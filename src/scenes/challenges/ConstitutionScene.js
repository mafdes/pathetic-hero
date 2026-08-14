/**
 * ConstitutionScene.js — Prueba de Constitución del Gremio (720×1280 HD Vertical)
 * 100% CÓDIGO FIEL AL ORIGINAL (`heroic-failure/ui/constitution-screen.js`).
 * Mecánica: LATIDO PULSADO (FLAPPY PULSE) — Mantener la aguja dentro de la zona verde durante la duración del temporizador.
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";

const TOTAL_ROUNDS = 20;

function roundConfig(roundIndex) {
  const level = roundIndex + 1;
  let zoneSize = 0.38;
  let gravity = 0.32;
  let impulse = 0.12;
  let duration = 6.0 + level * 0.3;
  let isErratic = false;
  let moveZone = false;
  let blink = false;
  let message = "";

  if (level === 1) {
    zoneSize = 0.38;
    gravity = 0.32;
    message = "Mantenga el pulso en la zona verde con toques acompasados.";
  } else if (level === 2) {
    zoneSize = 0.28;
    gravity = 0.42;
    message = "Evaluación de resistencia biológica.";
  } else if (level === 3) {
    zoneSize = 0.20;
    gravity = 0.54;
    isErratic = true;
    message = "El pulso sufre alterations térmicas.";
  } else if (level === 4) {
    zoneSize = 0.14;
    gravity = 0.68;
    isErratic = true;
    moveZone = true;
    message = "La franja de salud se desplaza.";
  } else if (level === 5) {
    zoneSize = 0.095;
    gravity = 0.82;
    isErratic = true;
    moveZone = true;
    blink = true;
    message = "Niebla médica en los monitores del gremio.";
  } else {
    const extra = level - 5;
    zoneSize = Math.max(0.022, 0.075 - extra * 0.005);
    gravity = 0.90 + extra * 0.12;
    isErratic = true;
    moveZone = true;
    blink = true;
    message = `Prueba de Resistencia Imposible — Nivel ${level}.`;
  }

  return { level, zoneSize, gravity, impulse, duration, isErratic, moveZone, blink, message };
}

const TRANSITION_PHRASES = [
  "Los examinadores médicos dudan de que tengas pulso humano.",
  "Sorprendente. Un topo con soplo en el corazón lo habría hecho igual.",
  "El gremio anota en tu ficha: 'Sujeto milagrosamente con vida'.",
  "El estetoscopio del examinador acaba de pedir la baja laboral.",
  "Mantuviste el ritmo por pura cabezonería burocrática.",
  "Tu corazón resiste más que tu sentido de la dignidad.",
  "La camilla de urgencias esperará al siguiente nivel.",
  "El gremio consulta si tu sangre contiene poción o pura suerte.",
];

function getConstitutionVerdict(score) {
  if (score <= 3) return "Dictamen del Tribunal: Salud de lechuga marchita. Un estornudo de trasgo le causaría la muerte.";
  if (score <= 6) return "Dictamen del Tribunal: Resistencia raquítica. El tribunal le receta sopa de ortigas y no molestar.";
  if (score <= 10) return "Dictamen del Tribunal: Pulso vital estable. Puede aguantar un golpe de barra de taberna sin morir.";
  if (score <= 15) return "Dictamen del Tribunal: Constitución de mulo. Aguanta la peste de mazmorra sin inmutarse.";
  return "Dictamen del Tribunal: Inmortalidad sospechosa. Se investigará si es un no-muerto camuflado.";
}

export class ConstitutionScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.CONSTITUTION });
  }

  init(data) {
    const startLvl = (data?.startLevel && typeof data.startLevel === 'number') ? Math.min(19, Math.max(0, data.startLevel)) : 0;
    this._challenge     = data?.challenge ?? CHALLENGES.CONSTITUTION;
    this._sheetData     = data?.sheet ?? null;
    this._currentLevel  = startLvl + 1;
    this._maxLevels     = TOTAL_ROUNDS;
    this._alive         = true;
    this._inCountdown   = true;
    this._score         = startLvl;

    this._health        = 0.5;
    this._zoneCenter    = 0.5;
    this._timer         = 0;
    this._timeInRound   = 0;
    this._graceTimer    = 0;
    this._blinkTimer    = 0;
    this._isIndicatorVisible = true;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x0a1a0f);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Fondo Sala de Alquimia
    const gfx = this.add.graphics().setDepth(DEPTHS.BG);
    gfx.fillStyle(0x051409, 1);
    gfx.fillRect(0, 0, W, H);
    gfx.fillStyle(0x13381b, 1);
    gfx.fillRect(0, 0, 30, H);
    gfx.fillRect(W - 30, 0, 30, H);

    // HUD superior
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, 0x2d6a4f).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 02: CONSTITUCIÓN", {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#4caf77", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._messageText = this.add.text(W / 2, 160, "Mantenga el pulso en la zona verde con toques acompasados.", {
      fontFamily: FONTS.PRIMARY, fontSize: "15px", color: "#8abf9e", resolution: 2, align: "center", lineSpacing: 8, wordWrap: { width: W - 80 },
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Medidor Vertical Principal Centrado
    const mX = W / 2;
    const mY = H / 2 - 50;
    const mW = 86;
    const mH = 380;

    this._mX = mX;
    this._mY = mY;
    this._mH = mH;

    this.add.rectangle(mX, mY, mW + 16, mH + 16, COLORS.BG_DARK, 1)
      .setStrokeStyle(4, 0x2d6a4f).setDepth(DEPTHS.UI_BG);

    this.add.rectangle(mX, mY, mW, mH, 0x112215, 1).setDepth(DEPTHS.UI_BG + 1);

    // Franja Verde Objetivo
    this._targetZone = this.add.rectangle(mX, mY, mW - 8, 140, 0x2d6a4f, 0.7)
      .setDepth(DEPTHS.UI);

    // Aguja Indicadora
    this._needle = this.add.rectangle(mX, mY, mW - 4, 18, 0x4caf77, 1)
      .setDepth(DEPTHS.UI + 1);

    // ── BARRA DE TIEMPO RESTANTE EN EL NIVEL ──────────────────────────────────
    const pX = W / 2;
    const pY = mY + mH / 2 + 75;
    const pW = 480;
    const pH = 24;

    this.add.text(pX, pY - 22, "TIEMPO RESTANTE DE RESISTENCIA", {
      fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#4caf77", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(pX, pY, pW + 8, pH + 8, COLORS.BG_DARK, 1)
      .setStrokeStyle(3, 0x2d6a4f).setDepth(DEPTHS.UI_BG);

    this.add.rectangle(pX, pY, pW, pH, 0x09170c, 1).setDepth(DEPTHS.UI_BG + 1);

    this._timerBarFill = this.add.rectangle(pX - pW / 2, pY, pW, pH - 4, 0x4caf77, 1)
      .setOrigin(0, 0.5).setDepth(DEPTHS.UI);

    // Hint Control
    const inputMode = this.registry.get("inputMode") ?? "keyboard";
    let hintText = "[ ESPACIO PARA DAR UN LATIDO ]";
    if (inputMode === "mouse") hintText = "[ CLICK PARA DAR UN LATIDO ]";
    else if (inputMode === "touch") hintText = "[ TOCA PARA DAR UN LATIDO ]";

    this.add.text(W / 2, pY + 50, hintText, {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#5a5a8a", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Telón Oscuro desde frame 1
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x0a1a0f, 0.98)
      .setDepth(250).setVisible(true);

    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "120px", color: "#4caf77", resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    this._dialog = new DialogBox(this);

    // Escuchadores de Entrada (Latido)
    this.input.keyboard?.on("keydown-SPACE", () => this._onTap());
    this.input.on("pointerdown",             () => this._onTap());

    this.time.delayedCall(300, () => this._beginLevel());
  }

  _onTap() {
    if (this._dialog.isVisible()) {
      this._dialog.advance();
      return;
    }
    if (!this._alive || this._inCountdown) return;
    const cfg = roundConfig(this._currentLevel - 1);
    this._health = Math.min(1.0, this._health + cfg.impulse);
  }

  _beginLevel() {
    this._prepareLevel();
  }

  _prepareLevel() {
    if (!this._alive) return;
    const cfg = roundConfig(this._currentLevel - 1);
    this._health      = 0.5;
    this._zoneCenter  = 0.5;
    this._timer       = cfg.duration;
    this._timeInRound = 0;
    this._graceTimer  = 1.3;
    this._blinkTimer  = 0;
    this._isIndicatorVisible = true;
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
        .setColor(isYa ? "#4caf77" : "#d4a017")
        .setScale(1.3)
        .setVisible(true);

      this.tweens.add({
        targets: this._countdownText,
        scale: 1.0,
        duration: isYa ? 200 : 350,
        ease: "Quad.easeOut",
        onComplete: () => {
          i++;
          this.time.delayedCall(isYa ? 150 : 300, next);
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
    this._timer -= dt;

    if (this._graceTimer > 0) {
      this._graceTimer -= dt;
    }

    // Desplazamiento de franja objetivo (Nivel 4+)
    if (cfg.moveZone) {
      const wave = Math.sin(this._timeInRound * (2.2 + (this._currentLevel - 1) * 0.4));
      const maxOffset = 0.36 - cfg.zoneSize / 2;
      this._zoneCenter = 0.5 + wave * maxOffset;
    } else {
      this._zoneCenter = 0.5;
    }

    // Gravedad y empuje errático (Nivel 3+)
    let currentGravity = this._graceTimer > 0 ? cfg.gravity * 0.4 : cfg.gravity;
    if (cfg.isErratic && this._graceTimer <= 0) {
      const pulse = 1 + 0.6 * Math.sin(this._timeInRound * 7) + 0.3 * Math.cos(this._timeInRound * 13);
      currentGravity *= Math.max(0.3, pulse);
    }
    this._health -= currentGravity * dt;

    // Parpadeo de visibilidad (Nivel 5+)
    if (cfg.blink && this._graceTimer <= 0) {
      this._blinkTimer += dt;
      if (this._blinkTimer >= 0.18) {
        this._blinkTimer = 0;
        this._isIndicatorVisible = !this._isIndicatorVisible;
      }
    } else {
      this._isIndicatorVisible = true;
    }

    // Comprobar colisión fuera de zona objetivo tras tiempo de gracia
    if (this._graceTimer <= 0) {
      const zoneStart = this._zoneCenter - cfg.zoneSize / 2;
      const zoneEnd   = this._zoneCenter + cfg.zoneSize / 2;

      if (this._health < zoneStart || this._health > zoneEnd) {
        this._failLevel();
        return;
      }
    }

    // Renderizar Posiciones en Pantalla
    const mH = this._mH;
    const minY = this._mY - mH / 2 + 10;
    const maxY = this._mY + mH / 2 - 10;

    // Posición Aguja
    const nY = maxY - (this._health) * (maxY - minY);
    this._needle.setY(nY);
    this._needle.setAlpha(this._isIndicatorVisible ? 1.0 : 0.25);

    // Posición Franja Verde
    const zY = maxY - (this._zoneCenter) * (maxY - minY);
    this._targetZone.setY(zY);
    this._targetZone.setSize(86 - 8, cfg.zoneSize * mH);

    // Barra de tiempo horizontal
    const progressRatio = Math.max(0, this._timer / cfg.duration);
    this._timerBarFill.setSize(progressRatio * 476, 20);

    // Nivel Completado con éxito
    if (this._timer <= 0) {
      this._passLevel();
    }
  }

  _passLevel() {
    if (this._inCountdown || !this._alive) return;
    this._inCountdown = true;
    this._score = this._currentLevel;

    if (this._currentLevel >= this._maxLevels) {
      this._endGame(true);
      return;
    }

    const phrase = TRANSITION_PHRASES[(this._currentLevel - 1) % TRANSITION_PHRASES.length];
    this._currentLevel++;
    this.cameras.main.flash(150, 76, 175, 119, true);

    this._dialog.show(`"${phrase}"`, () => this._prepareLevel(), "Examinador Rotval");
  }

  _failLevel() {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const verdict = getConstitutionVerdict(this._score);

    this._dialog.show(`FIN DE LA PRUEBA\n\nPuntuación: ${this._score} / 20\n\n${verdict}`, () => {
      this._returnToReport(this._score);
    }, "Examinador Rotval");
  }

  _endGame(perfect = false) {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const finalScore = this._score;
    const verdict = getConstitutionVerdict(finalScore);

    this._dialog.show(`¡RESISTENCIA SUPERADA!\n\nPuntuación: ${finalScore} / 20\n\n${verdict}`, () => {
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
