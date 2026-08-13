/**
 * DexterityScene.js — Prueba de Destreza del Gremio (720×1280 HD Vertical)
 * Incluye telón de cuenta atrás FULLSCREEN gigante (120px) y diálogos modales centrados.
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
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

const SABOTAGE_ANNOUNCEMENTS = {
  3:  "Nivel 3. Indicador fantasma activado.\nEs un fallo del prototipo. Ignore el magenta.",
  5:  "Nivel 5. Parpadeo de calibración del equipo.\nCompletamente normal. No nos mire así.",
  7:  "Nivel 7. Zonas de control señuelo adicionales.\nPor motivos de seguridad burocrática.",
  9:  "Nivel 9. Puede que la velocidad varíe.\nLa maquinaria es antigua. Presupuesto recortado.",
  12: "Nivel 12. Modo de evaluación avanzado del Tribunal.\nNadie lo supera. Por pura estadística.",
};

export class DexterityScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.DEXTERITY });
  }

  init(data) {
    this._challenge     = data?.challenge ?? CHALLENGES.DEXTERITY;
    this._sheetData     = data?.sheet ?? null;
    this._currentLevel  = 1;
    this._maxLevels     = 20;
    this._alive         = true;
    this._inCountdown   = true;
    this._inputCooldown = false;
    this._score         = 0;

    this._zoneT         = 0;
    this._zoneBaseX     = 0;
    this._zoneMoving    = false;
    this._zoneMoveAmp   = 0;
    this._zoneMoveFreq  = 0;

    this._blinkTimer    = null;
    this._burstTimer    = null;
    this._flipTimer     = null;

    this._speedBurstOn  = false;
    this._currentSpeed  = 0;

    this._hasDecoyIndicator = false;
    this._decoyX            = 0;
    this._decoyDir          = -1;
    this._decoySpeed        = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DEEP);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // ── Estilo de Sala Retro Pixel Art: "Galería de Calibración" ─────────────
    this._drawRoomEnvironment(W, H);

    // ── HUD superior ──────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 01: DESTREZA", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "24px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5, 0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "16px",
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0.5, 0.5).setDepth(DEPTHS.UI);

    // ── Instrucción Principal ───────────────────────────────────────────────
    this.add.text(W / 2, 175, "PULSA cuando el cursor BLANCO\ncruece la zona dorada", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "16px",
      color: "#c8a97a",
      resolution: 2,
      align: "center",
      lineSpacing: 8,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Barra de precisión (640px de ancho) ──────────────────────────────────
    const barY = H / 2 - 80;
    const barW = W - 80;
    const barH = 60;
    const barX = 40;

    // Marco de la máquina de prueba
    this.add.rectangle(W / 2, barY, barW + 16, barH + 16, COLORS.BG_DARK, 1)
      .setStrokeStyle(4, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI_BG);

    this.add.rectangle(W / 2, barY, barW, barH, COLORS.BG_STONE, 1)
      .setDepth(DEPTHS.UI_BG + 1);

    // Zona dorada objetivo
    this._goldZone = this.add.rectangle(W / 2, barY, 110, barH - 8, COLORS.GOLD, 0.6)
      .setDepth(DEPTHS.UI);

    // Señuelos rojos (Nivel 7+)
    this._decoyLeft  = this.add.rectangle(0, barY, 0, barH - 8, COLORS.DANGER, 0.5)
      .setDepth(DEPTHS.UI).setVisible(false);
    this._decoyRight = this.add.rectangle(0, barY, 0, barH - 8, COLORS.DANGER, 0.5)
      .setDepth(DEPTHS.UI).setVisible(false);

    // Indicador FANTASMA señuelo (magenta) a partir de Nivel 3
    this._decoyIndicator = this.add.rectangle(barX + barW, barY, 16, barH, 0xff00ff, 0.85)
      .setDepth(DEPTHS.UI + 1).setVisible(false);

    // Indicador REAL (blanco)
    this._indicator = this.add.rectangle(barX, barY, 16, barH, COLORS.WHITE, 1)
      .setDepth(DEPTHS.UI + 2);

    this._barX    = barX;
    this._barW    = barW;
    this._barY    = barY;
    this._barH    = barH;
    this._barMidX = barX + barW / 2;

    // Extremos de la guía
    this.add.text(barX - 18, barY, "◄", {
      fontFamily: FONTS.PRIMARY, fontSize: "18px", color: "#6a4e8a", resolution: 2,
    }).setOrigin(1, 0.5).setDepth(DEPTHS.UI);
    this.add.text(barX + barW + 18, barY, "►", {
      fontFamily: FONTS.PRIMARY, fontSize: "18px", color: "#6a4e8a", resolution: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    // Hint de control adaptativo según inputMode seleccionado
    const inputMode = this.registry.get("inputMode") ?? "keyboard";
    let hintText = "[ ESPACIO ]";
    if (inputMode === "mouse") {
      hintText = "[ CLICK IZQUIERDO ]";
    } else if (inputMode === "touch") {
      hintText = "[ TOCA LA PANTALLA ]";
    }

    this.add.text(W / 2, barY + 80, hintText, {
      fontFamily: FONTS.PRIMARY,
      fontSize: "16px",
      color: "#5a5a8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── TELÓN FULLSCREEN ENORME PARA LA CUENTA ATRÁS ─────────────────────────
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x0d0613, 0.95)
      .setDepth(250)
      .setVisible(false);

    // Texto de Cuenta Atrás ENORME (120px) en medio de la pantalla
    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "120px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    // ── Diálogo Modal Centrado del Examinador (capa 300) ─────────────────────
    this._dialog = new DialogBox(this);

    // ── Input ─────────────────────────────────────────────────────────────────
    this.input.keyboard?.on("keydown-SPACE", () => this._handleInput());
    this.input.on("pointerdown",             () => this._handleInput());

    // ── Arrancar primer nivel ─────────────────────────────────────────────────
    this.time.delayedCall(400, () => this._beginLevel());
  }

  // ─── Renderizado de Sala Retro Pixel Art ─────────────────────────────────

  _drawRoomEnvironment(W, H) {
    const gfx = this.add.graphics().setDepth(DEPTHS.BG);

    // Fondo oscuro con patrón de piedra
    gfx.fillStyle(0x120a1f, 1);
    gfx.fillRect(0, 0, W, H);

    // Marcos de piedra retro a los lados (columnas de la sala)
    gfx.fillStyle(0x28183d, 1);
    gfx.fillRect(0, 0, 30, H);
    gfx.fillRect(W - 30, 0, 30, H);

    gfx.fillStyle(0x4a2e6e, 1);
    gfx.fillRect(26, 0, 4, H);
    gfx.fillRect(W - 30, 0, 4, H);

    // Antorchas decorativas (puntos dorados parpadeantes)
    const torchLeft = this.add.circle(60, 240, 6, 0xd4a017).setDepth(DEPTHS.BG + 1);
    const torchRight = this.add.circle(W - 60, 240, 6, 0xd4a017).setDepth(DEPTHS.BG + 1);

    this.tweens.add({
      targets: [torchLeft, torchRight],
      scale: 1.4,
      alpha: 0.6,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // ─── Dificultad y Sabotajes ───────────────────────────────────────────────

  _getLevelConfig(level) {
    const t    = (level - 1) / 19;
    const barW = this._barW;

    return {
      speed:              220 + t * 520,
      goldWidth:          Math.max(32, Math.round(barW * 0.20 - t * barW * 0.14)),
      hasDecoyIndicator:  level >= 3,
      decoySpeed:         (240 + t * 450) * 1.3,
      zoneMoving:         level >= 3,
      zoneMoveAmp:        level >= 3 ? Math.min(barW * 0.08 + (level - 3) * barW * 0.015, barW * 0.32) : 0,
      zoneMoveFreq:       level >= 3 ? 0.6 + (level - 3) * 0.08 : 0,
      zoneBlink:          level >= 5,
      blinkInterval:      level >= 5 ? Math.max(1200 - (level - 5) * 90, 400) : 0,
      blinkDuration:      level >= 5 ? Math.min(250 + (level - 5) * 25, 550) : 0,
      hasDecoys:          level >= 7,
      speedBurst:         level >= 9,
      directionFlip:      level >= 12,
    };
  }

  // ─── Flujo de Niveles ────────────────────────────────────────────────────

  _beginLevel() {
    const announcement = SABOTAGE_ANNOUNCEMENTS[this._currentLevel];
    if (announcement) {
      this._coverPanel.setVisible(true);
      this._dialog.show(announcement, () => this._prepareAndStartLevel(), "Examinador Rotval");
    } else {
      this._prepareAndStartLevel();
    }
  }

  _prepareAndStartLevel() {
    if (!this._alive) return;

    this._clearLevelTimers();

    const cfg = this._getLevelConfig(this._currentLevel);
    const cx  = this._barMidX;

    // Reset indicador real
    this._indicatorX   = this._barX;
    this._indicatorDir = 1;
    this._indicator.setX(this._barX).setAlpha(1);

    // Reset indicador señuelo
    this._hasDecoyIndicator = cfg.hasDecoyIndicator;
    this._decoyX            = this._barX + this._barW;
    this._decoyDir          = -1;
    this._decoySpeed        = cfg.decoySpeed;
    this._decoyIndicator.setX(this._decoyX).setVisible(cfg.hasDecoyIndicator);

    // Reset zona dorada
    this._goldZone.setX(cx).setVisible(true);
    this._goldZone.width = cfg.goldWidth;

    this._zoneBaseX    = cx;
    this._zoneT        = 0;
    this._zoneMoving   = cfg.zoneMoving;
    this._zoneMoveAmp  = cfg.zoneMoveAmp;
    this._zoneMoveFreq = cfg.zoneMoveFreq;

    // Señuelos rojos
    if (cfg.hasDecoys) {
      const dw = cfg.goldWidth;
      this._decoyLeft.setX(cx - this._barW * 0.32).setSize(dw, this._barH - 8).setVisible(true);
      this._decoyRight.setX(cx + this._barW * 0.32).setSize(dw, this._barH - 8).setVisible(true);
    } else {
      this._decoyLeft.setVisible(false);
      this._decoyRight.setVisible(false);
    }

    this._currentSpeed  = cfg.speed;
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);

    this._inCountdown = true;
    this._inputCooldown = true;

    // Telón Fullscreen activo para la cuenta atrás
    this._coverPanel.setVisible(true);

    this._runCountdown(() => {
      if (!this._alive) return;
      this._coverPanel.setVisible(false);
      this._inCountdown   = false;
      this._inputCooldown = false;

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

      if (cfg.speedBurst) {
        this._burstTimer = this.time.addEvent({
          delay: Phaser.Math.Between(700, 1400),
          loop: false,
          callback: () => this._triggerSpeedBurst(cfg.speed),
        });
      }

      if (cfg.directionFlip) {
        this._flipTimer = this.time.addEvent({
          delay: Phaser.Math.Between(600, 1200),
          loop: true,
          callback: () => {
            if (!this._inCountdown && this._alive) {
              this._indicatorDir *= -1;
            }
          },
        });
      }
    });
  }

  _runCountdown(onComplete) {
    const steps = ["3", "2", "1", "¡YA!"];
    let stepIndex = 0;

    const showStep = () => {
      if (!this._alive) return;
      if (stepIndex >= steps.length) {
        this._countdownText.setVisible(false);
        if (onComplete) onComplete();
        return;
      }

      const text = steps[stepIndex];
      const isYa = text === "¡YA!";
      this._countdownText.setText(text)
        .setColor(isYa ? "#4caf77" : "#d4a017")
        .setScale(1.3)
        .setVisible(true);

      this.tweens.add({
        targets: this._countdownText,
        scale: 1.0,
        duration: isYa ? 200 : 320,
        ease: "Quad.easeOut",
        onComplete: () => {
          stepIndex++;
          this.time.delayedCall(isYa ? 150 : 250, showStep);
        },
      });
    };

    showStep();
  }

  _triggerSpeedBurst(baseSpeed) {
    if (!this._alive || this._inCountdown) return;
    this._speedBurstOn = true;
    this._currentSpeed = baseSpeed * 2.3;

    this.time.delayedCall(550, () => {
      if (this._alive) {
        this._currentSpeed = baseSpeed;
        this._speedBurstOn = false;
      }
    });
  }

  _clearLevelTimers() {
    if (this._blinkTimer) { this._blinkTimer.remove(); this._blinkTimer = null; }
    if (this._burstTimer) { this._burstTimer.remove(); this._burstTimer = null; }
    if (this._flipTimer)  { this._flipTimer.remove();  this._flipTimer = null; }
    this._goldZone.setVisible(true);
    this._speedBurstOn = false;
    if (this._countdownText) this._countdownText.setVisible(false);
    if (this._coverPanel)    this._coverPanel.setVisible(false);
  }

  // ─── Update Loop ──────────────────────────────────────────────────────────

  update(time, delta) {
    if (!this._alive || this._inCountdown || this._dialog.isVisible()) return;

    const dt = delta / 1000;

    // Mover indicador REAL
    this._indicatorX += this._currentSpeed * this._indicatorDir * dt;
    if (this._indicatorX >= this._barX + this._barW - 5) {
      this._indicatorX   = this._barX + this._barW - 5;
      this._indicatorDir = -1;
    } else if (this._indicatorX <= this._barX) {
      this._indicatorX   = this._barX;
      this._indicatorDir = 1;
    }
    this._indicator.setX(this._indicatorX);

    // Mover indicador FANTASMA SEÑUELO
    if (this._hasDecoyIndicator) {
      this._decoyX += this._decoySpeed * this._decoyDir * dt;
      if (this._decoyX >= this._barX + this._barW - 5) {
        this._decoyX   = this._barX + this._barW - 5;
        this._decoyDir = -1;
      } else if (this._decoyX <= this._barX) {
        this._decoyX   = this._barX;
        this._decoyDir = 1;
      }
      this._decoyIndicator.setX(this._decoyX);
    }

    // Mover zona dorada
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
    if (this._inCountdown) return;
    this._onAction();
  }

  _onAction() {
    if (!this._alive || this._inputCooldown || this._inCountdown) return;
    this._inputCooldown = true;
    this._showFeedback(this._isInGoldZone());
  }

  _isInGoldZone() {
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
    this._coverPanel.setVisible(true);

    const comment  = Phaser.Math.RND.pick(hit ? SUCCESS_COMMENTS : FAIL_COMMENTS);
    const flashHex = hit ? COLORS.SUCCESS_BRIGHT : COLORS.DANGER_BRIGHT;
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
    this._coverPanel.setVisible(true);

    const finalScore = this._score;
    const msg = perfect
      ? `PERFECTO. ${finalScore}/20.\nEl Tribunal desconfía profundamente.`
      : `FIN DE LA PRUEBA\n\nPuntuación: ${finalScore} / 20\n\n${getVerdict(finalScore)}`;

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
