/**
 * StrengthScene.js — Prueba de Fuerza del Gremio (720×1280 HD Vertical)
 * 100% CÓDIGO FIEL AL ORIGINAL (`heroic-failure/ui/strength-screen.js`).
 * Mecánica: MANTENER PULSADO PARA CARGAR LA BARRA Y SOLTAR EXACTAMENTE DENTRO DE LA ZONA OBJETIVO.
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";

const TOTAL_ROUNDS = 6;

function roundConfig(roundIndex) {
  const level = roundIndex + 1;
  let zoneSize = 0.38;
  let baseSpeed = 0.50;
  let isErratic = false;
  let moveZone = false;
  let blink = false;
  let message = "";

  if (level === 1) {
    zoneSize = 0.38;
    baseSpeed = 0.50;
    message = "La pesa de hierro ordinario. Mantén pulsado y suelta en la zona.";
  } else if (level === 2) {
    zoneSize = 0.26;
    baseSpeed = 0.82;
    isErratic = true; // 1ª trampa: fluctuación de velocidad
    message = "Aumentando el pesaje con carga errática.";
  } else if (level === 3) {
    zoneSize = 0.16;
    baseSpeed = 1.20;
    isErratic = true;
    moveZone = true; // 2ª trampa: la zona de impacto se desplaza
    message = "Pesaje con hierro encantado. La franja se desplaza.";
  } else if (level === 4) {
    zoneSize = 0.11;
    baseSpeed = 1.60;
    isErratic = true;
    moveZone = true;
    blink = true; // 3ª trampa: parpadeo intermitente
    message = "Evaluación física avanzada. Parpadeo de calibración.";
  } else if (level === 5) {
    zoneSize = 0.07;
    baseSpeed = 2.10;
    isErratic = true;
    moveZone = true;
    blink = true;
    message = "Tensión muscular extrema bajo supervisión de los Agentes.";
  } else {
    // Nivel 6: IMPOSSIBLE (zona objetivo de 0px y velocidad extrema)
    zoneSize = 0;
    baseSpeed = 6.00;
    isErratic = true;
    moveZone = true;
    blink = true;
    message = "Prueba de Titanes Imposible del Gremio.";
  }

  return { level, zoneSize, baseSpeed, isErratic, moveZone, blink, message };
}

const TRANSITION_PHRASES = [
  "El yunque real no se rompió, pero tus muñecas piden compasión.",
  "Sorprendente. Un orco con lumbalgia habría doblado más el hierro.",
  "El tribunal del gremio anota que tus bíceps han superado la prueba de milagro.",
  "Tus fibras musculares acaban de ganar 2 gramos de dignidad administrativa.",
  "El gremio aconseja no intentar levantar jarras de cerveza con tanto ímpetu.",
  "Sobreviviste a la carga por los pelos de un enano minero.",
  "Un esfuerzo remarcable para alguien con tu complexión de junco seco.",
  "Los examinadores dudan si fue potencia física o pánico acumulado.",
];

function getStrengthVerdict(score) {
  if (score <= 3) return "Dictamen del Tribunal: Brazos como fideos de taberna. El peso del formulario casi le quiebra la muñeca.";
  if (score <= 6) return "Dictamen del Tribunal: Fuerza ridícula. La pesa del Nivel 4 ha opinado sobre sus músculos.";
  if (score <= 10) return "Dictamen del Tribunal: Potencia bruta aceptable. Sirve para cargar sacos de carbón del gremio.";
  if (score <= 15) return "Dictamen del Tribunal: ¡Titánico! El tribunal ha tenido que apartarse de la mesa.";
  return "Dictamen del Tribunal: ¡Fuerza de Gigante! Ha levantado el gremio entero por los cimientos.";
}

export class StrengthScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.STRENGTH });
  }

  init(data) {
    const startLvl = (data?.startLevel && typeof data.startLevel === 'number') ? Math.min(5, Math.max(0, data.startLevel)) : 0;
    this._challenge     = data?.challenge ?? CHALLENGES.STRENGTH;
    this._sheetData     = data?.sheet ?? null;
    this._currentLevel  = startLvl + 1;
    this._maxLevels     = TOTAL_ROUNDS;
    this._alive         = true;
    this._inCountdown   = true;
    this._score         = startLvl;

    this._charge        = 0;
    this._zoneCenter    = 0.5;
    this._timeInRound   = 0;
    this._isHolding     = false;
    this._hasCharged    = false;
    this._blinkTimer    = 0;
    this._isChargeVisible = true;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x1a0d0a);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Fondo Sala de Forja
    const gfx = this.add.graphics().setDepth(DEPTHS.BG);
    gfx.fillStyle(0x140705, 1);
    gfx.fillRect(0, 0, W, H);
    gfx.fillStyle(0x38130d, 1);
    gfx.fillRect(0, 0, 30, H);
    gfx.fillRect(W - 30, 0, 30, H);

    // HUD superior
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, 0xc42b1c).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 03: FUERZA", {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#ff4444", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._messageText = this.add.text(W / 2, 160, "MANTÉN PULSADO PARA CARGAR Y SUELTA EN LA ZONA OBJETIVO", {
      fontFamily: FONTS.PRIMARY, fontSize: "15px", color: "#ff8888", resolution: 2, align: "center", lineSpacing: 8, wordWrap: { width: W - 80 },
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Riel Horizontal de Carga (Carga de Izquierda a Derecha) ──────────────
    const railX = W / 2;
    const railY = H / 2;
    const railW = 540;
    const railH = 50;

    this._railX = railX;
    this._railY = railY;
    this._railW = railW;

    this.add.rectangle(railX, railY, railW + 16, railH + 16, COLORS.BG_DARK, 1)
      .setStrokeStyle(4, 0xc42b1c).setDepth(DEPTHS.UI_BG);

    this.add.rectangle(railX, railY, railW, railH, 0x240c09, 1)
      .setDepth(DEPTHS.UI_BG + 1);

    // Franja Objetivo Dorada
    this._targetZone = this.add.rectangle(railX, railY, 100, railH - 4, COLORS.GOLD, 0.75)
      .setDepth(DEPTHS.UI);

    // Relleno de Carga
    this._chargeBarFill = this.add.rectangle(railX - railW / 2, railY, 0, railH - 4, 0xff4444, 1)
      .setOrigin(0, 0.5).setDepth(DEPTHS.UI + 1);

    // Hint Control
    const inputMode = this.registry.get("inputMode") ?? "keyboard";
    let hintText = "[ MANTÉN PULSADO Y SUELTA ESPACIO ]";
    if (inputMode === "mouse") hintText = "[ MANTÉN PULSADO Y SUELTA CLICK ]";
    else if (inputMode === "touch") hintText = "[ MANTÉN PULSADO Y SUELTA LA PANTALLA ]";

    this.add.text(W / 2, railY + 80, hintText, {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#ff8888", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Telón Oscuro desde frame 1
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x1a0d0a, 0.98)
      .setDepth(250).setVisible(true);

    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "120px", color: "#ff4444", resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    this._dialog = new DialogBox(this);

    // Escuchadores MANTENER PULSADO y SOLTAR
    this.input.keyboard?.on("keydown-SPACE", () => this._onPressStart());
    this.input.keyboard?.on("keyup-SPACE",   () => this._onPressRelease());

    this.input.on("pointerdown", () => this._onPressStart());
    this.input.on("pointerup",   () => this._onPressRelease());

    this.time.delayedCall(300, () => this._beginLevel());
  }

  _onPressStart() {
    if (this._dialog.isVisible()) {
      this._dialog.advance();
      return;
    }
    if (!this._alive || this._inCountdown) return;
    this._isHolding = true;
  }

  _onPressRelease() {
    if (this._dialog.isVisible()) return;
    if (!this._alive || this._inCountdown) return;
    if (this._isHolding && this._hasCharged) {
      this._isHolding = false;
      this._resolveRound();
    }
  }

  _beginLevel() {
    this._prepareLevel();
  }

  _prepareLevel() {
    if (!this._alive) return;
    const cfg = roundConfig(this._currentLevel - 1);
    this._charge      = 0;
    this._timeInRound = 0;
    this._isHolding   = false;
    this._hasCharged  = false;
    this._zoneCenter  = 0.5;
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
    this._messageText.setText(cfg.message);
    this._inCountdown = true;

    this._coverPanel.setVisible(true);

    this._runCountdown(() => {
      this._coverPanel.setVisible(false);
      this._inCountdown = false;
    });
  }

  _runCountdown(onComplete) {
    const steps = ["3", "2", "1", "¡YA!"];
    let i = 0;
    const next = () => {
      if (!this._alive) return;
      if (i >= steps.length) {
        this._countdownText.setVisible(false);
        if (onComplete) onComplete();
        return;
      }
      const text = steps[i];
      const isYa = text === "¡YA!";
      this._countdownText.setText(text)
        .setColor(isYa ? "#ff4444" : "#d4a017")
        .setScale(1.3)
        .setVisible(true);

      this.tweens.add({
        targets: this._countdownText,
        scale: 1.0,
        duration: isYa ? 200 : 350,
        ease: "Quad.easeOut",
        onComplete: () => {
          i++;
          this.time.delayedCall(isYa ? 150 : 350, next);
        },
      });
    };
    next();
  }

  update(time, delta) {
    if (!this._alive || this._inCountdown || this._dialog.isVisible()) return;

    const dt = delta / 1000;
    const cfg = roundConfig(this._currentLevel - 1);
    this._timeInRound += dt;

    // Zona objetivo en movimiento (Nivel 4+)
    if (cfg.moveZone) {
      const wave = Math.sin(this._timeInRound * (2.2 + (this._currentLevel - 1) * 0.35));
      const maxOffset = 0.36 - cfg.zoneSize / 2;
      this._zoneCenter = 0.5 + wave * maxOffset;
    } else {
      this._zoneCenter = 0.5;
    }

    // Velocidad de carga y pulsos erráticos (Nivel 3+)
    let currentSpeed = cfg.baseSpeed;
    if (cfg.isErratic) {
      const pulse = 1 + 0.65 * Math.sin(this._timeInRound * 8) + 0.3 * Math.cos(this._timeInRound * 14);
      currentSpeed *= Math.max(0.2, pulse);
    }

    // Carga continua mientras mantienes pulsado
    if (this._isHolding) {
      this._charge += currentSpeed * dt;
      if (this._charge > 0.02) this._hasCharged = true;
    }

    // Sobrecarga (te pasaste de 1.0 -> Fallo inmediato)
    if (this._charge >= 1.0) {
      this._charge = 1.0;
      this._failLevel();
      return;
    }

    // Parpadeo de visibilidad (Nivel 5+)
    if (cfg.blink && this._isHolding) {
      this._blinkTimer += dt;
      if (this._blinkTimer >= 0.16) {
        this._blinkTimer = 0;
        this._isChargeVisible = !this._isChargeVisible;
      }
    } else {
      this._isChargeVisible = true;
    }

    // Renderizar Posiciones en Pantalla
    const zoneStartPct = this._zoneCenter - cfg.zoneSize / 2;
    const zX = this._railX - this._railW / 2 + zoneStartPct * this._railW + (cfg.zoneSize * this._railW) / 2;
    this._targetZone.setPosition(zX, this._railY);
    this._targetZone.setSize(cfg.zoneSize * this._railW, 46);

    const fillW = Math.max(0, this._charge * this._railW);
    this._chargeBarFill.setSize(fillW, 46);
    this._chargeBarFill.setAlpha(this._isChargeVisible ? 1.0 : 0.25);
  }

  _resolveRound() {
    const cfg = roundConfig(this._currentLevel - 1);
    const zoneStart = this._zoneCenter - cfg.zoneSize / 2;
    const zoneEnd   = this._zoneCenter + cfg.zoneSize / 2;

    if (this._charge >= zoneStart && this._charge <= zoneEnd) {
      this._passLevel();
    } else {
      this._failLevel();
    }
  }

  _passLevel() {
    if (this._inCountdown || !this._alive) return;
    this._inCountdown = true;
    this._score = this._currentLevel;

    if (this._currentLevel >= this._maxLevels) {
      this._cheatDetected();
      return;
    }

    const phrase = TRANSITION_PHRASES[(this._currentLevel - 1) % TRANSITION_PHRASES.length];
    this._currentLevel++;
    this.cameras.main.flash(150, 255, 68, 68, true);

    this._dialog.show(`"${phrase}"`, () => this._prepareLevel(), "Examinador Rotval");
  }

  _cheatDetected() {
    this._alive = false;
    this._coverPanel.setVisible(true);
    this._score = 5;

    const msg = "¡TRAMPAS DETECTADAS!\n\nEl Gremio no tolera la suerte divina ni la alteración del destino. Tu puntuación queda fijada en 5 / 20.";
    this._dialog.show(msg, () => this._returnToReport(5), "Tribunal del Gremio");
  }

  _failLevel() {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const verdict = getStrengthVerdict(this._score);

    this._dialog.show(`FIN DE LA PRUEBA\n\nPuntuación: ${this._score} / 20\n\n${verdict}`, () => {
      this._returnToReport(this._score);
    }, "Examinador Rotval");
  }

  _endGame(perfect = false) {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const finalScore = this._score;
    const verdict = getStrengthVerdict(finalScore);

    this._dialog.show(`¡FUERZA TITÁNICA SUPERADA!\n\nPuntuación: ${finalScore} / 20\n\n${verdict}`, () => {
      this._returnToReport(finalScore);
    }, "Examinador Rotval");
  }

  _returnToReport(score) {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score, sheet: this._sheetData });
    });
  }
}
