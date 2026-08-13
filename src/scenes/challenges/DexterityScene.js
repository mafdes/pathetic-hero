/**
 * DexterityScene.js — Prueba de Destreza del Gremio (960×540)
 *
 * Mecánica base: barra horizontal con indicador en movimiento.
 * El jugador pulsa cuando el indicador cruce la zona dorada.
 *
 * EL EXAMINADOR SABOTEA ACTIVAMENTE AL ASPIRANTE:
 *   Nv 1-2  → Normal. Lento. El Examinador evalúa.
 *   Nv 3    → La zona DORADA SE MUEVE (seno suave). "Ah, se ha movido."
 *   Nv 5    → La zona PARPADEA y se oculta. "Calibración en curso."
 *   Nv 7    → Señuelos ROJOS idénticos en ancho a la zona real.
 *   Nv 9    → Aceleración REPENTINA a mitad de la barra. "Brisa."
 *   Nv 12+  → Todo a la vez. El caos total.
 *
 * La puntuación final es el último nivel superado (0-20).
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, FONT_SIZES, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";
import { getVerdict } from "../../utils/helpers.js";

// ─── Comentarios del Examinador Rotval ──────────────────────────────────────

const FAIL_COMMENTS = [
  "Impresionante. Incluso los ciegos lo hacen mejor.",
  "¿Estás seguro de que tienes manos?",
  "Eso no fue un intento. Eso fue un insulto.",
  "Mi abuela con artritis supera eso. Estaba muerta.",
  "El Tribunal anota: coordinación nula.",
  "He visto tortugas más ágiles. Muertas.",
  "¿Lo has hecho aposta? Dinos si lo has hecho aposta.",
];

const SUCCESS_COMMENTS = [
  "Suerte de principiante. No se repetirá.",
  "Aceptable. Para un campesino.",
  "Hmmm. El Tribunal toma nota con escepticismo.",
  "No está mal. Para ser usted.",
];

// Avisos de sabotaje — el Examinador anuncia el truco ANTES del nivel
const SABOTAGE_ANNOUNCEMENTS = {
  3:  "Nivel 3. La diana puede haberse... desplazado ligeramente.\nCosas que pasan.",
  5:  "Nivel 5. Parpadeo de calibración del equipo.\nCompletamente normal. No nos mire así.",
  7:  "Nivel 7. Hemos añadido zonas de control adicionales.\nPor motivos de seguridad.",
  9:  "Nivel 9. Puede que el indicador varíe velocidad.\nLa maquinaria es antigua. Presupuesto recortado.",
  12: "Nivel 12. El Tribunal ha decidido activar\nel modo de evaluación avanzado.\nNadie lo supera. Por si acaso.",
};

export class DexterityScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.DEXTERITY });
  }

  init(data) {
    this._challenge    = data?.challenge ?? CHALLENGES.DEXTERITY;
    this._sheetData    = data?.sheet ?? null;
    this._currentLevel = 1;
    this._maxLevels    = 20;
    this._alive        = true;
    this._inputCooldown = false;
    this._score        = 0;

    // Estado de la zona móvil
    this._zoneT        = 0;
    this._zoneBaseX    = 0;
    this._zoneMoving   = false;
    this._zoneMoveAmp  = 0;
    this._zoneMoveFreq = 0;

    // Estado del parpadeo
    this._blinkTimer   = null;

    // Estado de la ráfaga de velocidad
    this._speedBurst   = false;
    this._burstTimer   = null;
    this._currentSpeed = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DEEP);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // ── HUD superior ──────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, 28, W, 56, COLORS.UI_PANEL, 0.9)
      .setDepth(DEPTHS.UI_BG);

    this.add.text(24, 28, "PRUEBA: DESTREZA", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.BODY,
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W - 24, 28, "NIVEL  1 / 20", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.BODY,
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(1, 0.5).setDepth(DEPTHS.UI);

    // Instrucción
    this.add.text(W / 2, 80, "PULSA cuando el cursor cruce la zona dorada", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.SMALL,
      color: "#6a4e8a",
      resolution: 2,
      align: "center",
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Barra de precisión ────────────────────────────────────────────────────
    const barY = H / 2 - 20;
    const barW = W - 120;
    const barH = 42;
    const barX = 60;

    // Marco
    this.add.rectangle(W / 2, barY, barW, barH, COLORS.BG_STONE, 1)
      .setStrokeStyle(2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI_BG);

    // Zona dorada
    this._goldZone = this.add.rectangle(W / 2, barY, 80, barH - 6, COLORS.GOLD, 0.6)
      .setDepth(DEPTHS.UI);

    // Señuelos rojos (idénticos en ancho a la zona dorada)
    this._decoyLeft  = this.add.rectangle(0, barY, 0, barH - 6, COLORS.DANGER, 0.5)
      .setDepth(DEPTHS.UI).setVisible(false);
    this._decoyRight = this.add.rectangle(0, barY, 0, barH - 6, COLORS.DANGER, 0.5)
      .setDepth(DEPTHS.UI).setVisible(false);

    // Indicador (cursor móvil)
    this._indicator = this.add.rectangle(barX, barY, 10, barH, COLORS.WHITE, 1)
      .setDepth(DEPTHS.UI + 1); // encima de todo

    this._barX    = barX;
    this._barW    = barW;
    this._barY    = barY;
    this._barH    = barH;
    this._barMidX = barX + barW / 2;

    // Marcadores de los extremos
    this.add.text(barX - 10, barY, "◄", {
      fontFamily: FONTS.PRIMARY, fontSize: FONT_SIZES.SMALL, color: "#3d3d6b", resolution: 2,
    }).setOrigin(1, 0.5).setDepth(DEPTHS.UI);
    this.add.text(barX + barW + 10, barY, "►", {
      fontFamily: FONTS.PRIMARY, fontSize: FONT_SIZES.SMALL, color: "#3d3d6b", resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    // Hint de control
    this.add.text(W / 2, barY + 52, "[ ESPACIO  /  Z  /  ENTER  /  CLICK ]", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.SMALL,
      color: "#5a5a8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Diálogo del Examinador ────────────────────────────────────────────────
    this._dialog = new DialogBox(this, {
      y: H - 160,
      height: 140,
    });

    // ── Input (único punto de entrada) ───────────────────────────────────────
    this.input.keyboard?.on("keydown-SPACE", () => this._handleInput());
    this.input.keyboard?.on("keydown-Z",     () => this._handleInput());
    this.input.keyboard?.on("keydown-ENTER", () => this._handleInput());
    this.input.on("pointerdown",             () => this._handleInput());

    // ── Arrancar primer nivel ─────────────────────────────────────────────────
    this.time.delayedCall(400, () => this._beginLevel());
  }

  // ─── Configuración de dificultad por nivel ─────────────────────────────────

  _getLevelConfig(level) {
    const t    = (level - 1) / 19; // 0 (nv1) → 1 (nv20)
    const barW = this._barW;

    return {
      // Velocidad del indicador (px/s)
      speed:     160 + t * 400,

      // Anchura de la zona dorada (se encoge con el nivel)
      goldWidth: Math.max(28, Math.round(barW * 0.21 - t * barW * 0.14)),

      // SABOTAJE 1 (nv 3+): zona dorada que se desplaza en seno
      zoneMoving:    level >= 3,
      zoneMoveAmp:   level >= 3 ? Math.min(barW * 0.06 + (level - 3) * barW * 0.012, barW * 0.28) : 0,
      zoneMoveFreq:  level >= 3 ? 0.5 + (level - 3) * 0.06 : 0, // Hz

      // SABOTAJE 2 (nv 5+): zona parpadea y desaparece
      zoneBlink:      level >= 5,
      blinkInterval:  level >= 5 ? Math.max(1400 - (level - 5) * 80, 500) : 0, // ms entre parpadeos
      blinkDuration:  level >= 5 ? Math.min(200 + (level - 5) * 20, 500) : 0,  // ms oculta

      // SABOTAJE 3 (nv 7+): señuelos rojos del mismo tamaño que la zona real
      hasDecoys: level >= 7,

      // SABOTAJE 4 (nv 9+): ráfagas de velocidad aleatoria del indicador
      speedBurst: level >= 9,
    };
  }

  // ─── Flujo de niveles ──────────────────────────────────────────────────────

  _beginLevel() {
    // Si este nivel tiene anuncio de sabotaje, mostrarlo antes
    const announcement = SABOTAGE_ANNOUNCEMENTS[this._currentLevel];
    if (announcement) {
      this._dialog.show(announcement, () => this._startLevel(), "Examinador Rotval");
    } else {
      this._startLevel();
    }
  }

  _startLevel() {
    if (!this._alive) return;

    // Limpiar timers del nivel anterior
    this._clearLevelTimers();

    const cfg = this._getLevelConfig(this._currentLevel);
    const cx  = this._barMidX;

    // ── Zona dorada ───────────────────────────────────────────────────────────
    this._goldZone.setX(cx).setVisible(true);
    this._goldZone.width = cfg.goldWidth;

    // Guardar base para el movimiento ondulante
    this._zoneBaseX    = cx;
    this._zoneT        = 0;
    this._zoneMoving   = cfg.zoneMoving;
    this._zoneMoveAmp  = cfg.zoneMoveAmp;
    this._zoneMoveFreq = cfg.zoneMoveFreq;

    // ── Señuelos ──────────────────────────────────────────────────────────────
    if (cfg.hasDecoys) {
      const dw = cfg.goldWidth; // mismo ancho que la zona real (así no hay trampa visual)
      this._decoyLeft.setX(cx - this._barW * 0.30);
      this._decoyLeft.width = dw;
      this._decoyLeft.setVisible(true);
      this._decoyRight.setX(cx + this._barW * 0.30);
      this._decoyRight.width = dw;
      this._decoyRight.setVisible(true);
    } else {
      this._decoyLeft.setVisible(false);
      this._decoyRight.setVisible(false);
    }

    // ── Parpadeo de zona ──────────────────────────────────────────────────────
    if (cfg.zoneBlink) {
      this._blinkTimer = this.time.addEvent({
        delay: cfg.blinkInterval,
        loop: true,
        callback: () => {
          if (!this._goldZone.visible) return;
          this._goldZone.setVisible(false);
          this.time.delayedCall(cfg.blinkDuration, () => {
            if (this._alive) this._goldZone.setVisible(true);
          });
        },
      });
    }

    // ── Ráfaga de velocidad ───────────────────────────────────────────────────
    this._currentSpeed  = cfg.speed;
    this._speedBurstOn  = false;
    if (cfg.speedBurst) {
      this._burstTimer = this.time.addEvent({
        delay: Phaser.Math.Between(800, 1600),
        loop: false,
        callback: () => this._triggerSpeedBurst(cfg.speed),
      });
    }

    // ── Indicador ─────────────────────────────────────────────────────────────
    this._indicatorX   = this._barX;
    this._indicatorDir = 1;
    this._inputCooldown = false;

    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
  }

  _triggerSpeedBurst(baseSpeed) {
    if (!this._alive) return;
    this._speedBurstOn  = true;
    this._currentSpeed  = baseSpeed * 2.2;

    // Volver a normal después de 600ms
    this.time.delayedCall(600, () => {
      if (this._alive) {
        this._currentSpeed = baseSpeed;
        this._speedBurstOn = false;
      }
    });
  }

  _clearLevelTimers() {
    if (this._blinkTimer) { this._blinkTimer.remove(); this._blinkTimer = null; }
    if (this._burstTimer) { this._burstTimer.remove(); this._burstTimer = null; }
    this._goldZone.setVisible(true);
    this._speedBurstOn = false;
  }

  // ─── Update loop ──────────────────────────────────────────────────────────

  update(time, delta) {
    if (!this._alive || this._dialog.isVisible()) return;

    const dt = delta / 1000;

    // Mover indicador
    this._indicatorX += this._currentSpeed * this._indicatorDir * dt;

    if (this._indicatorX >= this._barX + this._barW - 5) {
      this._indicatorX   = this._barX + this._barW - 5;
      this._indicatorDir = -1;
    } else if (this._indicatorX <= this._barX) {
      this._indicatorX   = this._barX;
      this._indicatorDir = 1;
    }

    this._indicator.setX(this._indicatorX);

    // Mover zona dorada en onda sinusoidal
    if (this._zoneMoving) {
      this._zoneT += dt;
      const offset = Math.sin(this._zoneT * this._zoneMoveFreq * Math.PI * 2) * this._zoneMoveAmp;
      const newX = Phaser.Math.Clamp(
        this._zoneBaseX + offset,
        this._barX + this._goldZone.width / 2 + 4,
        this._barX + this._barW - this._goldZone.width / 2 - 4
      );
      this._goldZone.setX(newX);
    }
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  _handleInput() {
    if (this._dialog.isVisible()) {
      this._dialog.advance();
      return;
    }
    this._onAction();
  }

  _onAction() {
    if (!this._alive || this._inputCooldown) return;
    this._inputCooldown = true;
    this._showFeedback(this._isInGoldZone());
  }

  _isInGoldZone() {
    // Si la zona está oculta (parpadeo), no cuenta como válida
    if (!this._goldZone.visible) return false;

    const ix    = this._indicatorX;
    const gz    = this._goldZone;
    const left  = gz.x - gz.width / 2;
    const right = gz.x + gz.width / 2;
    return ix >= left && ix <= right;
  }

  // ─── Feedback ─────────────────────────────────────────────────────────────

  _showFeedback(hit) {
    this._clearLevelTimers();

    const comment   = Phaser.Math.RND.pick(hit ? SUCCESS_COMMENTS : FAIL_COMMENTS);
    const flashHex  = hit ? COLORS.SUCCESS_BRIGHT : COLORS.DANGER_BRIGHT;
    this.cameras.main.flash(200, ...this._hexToRGB(flashHex), true);

    this.tweens.add({
      targets: this._indicator,
      alpha: 0, duration: 80, yoyo: true, repeat: 2,
    });

    this._dialog.show(comment, () => {
      if (hit) this._nextLevel();
      else     this._endGame();
    }, "Examinador Rotval");
  }

  _nextLevel() {
    this._score = this._currentLevel;

    if (this._currentLevel >= this._maxLevels) {
      this._score = 20;
      this._endGame(true);
      return;
    }

    this._currentLevel++;
    this.cameras.main.flash(150, 255, 255, 255, true);
    this.time.delayedCall(300, () => this._beginLevel());
  }

  _endGame(perfect = false) {
    this._alive = false;
    this._clearLevelTimers();

    const finalScore = this._score;
    const msg = perfect
      ? `PERFECTO. ${finalScore}/20.\nEl Tribunal desconfía profundamente.`
      : `FIN DE LA PRUEBA\n\nPuntuacion: ${finalScore} / 20\n\n${getVerdict(finalScore)}`;

    this._dialog.show(msg, () => this._returnToReport(finalScore), "Examinador Rotval");
  }

  _returnToReport(score) {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.GUILD_REPORT, {
        challenge: this._challenge,
        score,
        sheet: this._sheetData,
      });
    });
  }

  _hexToRGB(hex) {
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
  }
}
