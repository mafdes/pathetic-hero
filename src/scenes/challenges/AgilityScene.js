/**
 * AgilityScene.js — Prueba de Agilidad del Gremio (720×1280 HD Vertical)
 * Sala retro pixel art: "El Pasadizo de las Trampas Oxidada".
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";

const PROMPTS = [
  { key: "SPACE", label: "[ ESPACIO ]" },
  { key: "UP",    label: "[ 🠉 ARRIBA ]" },
  { key: "DOWN",  label: "[ 🠋 ABAJO ]" },
  { key: "LEFT",  label: "[ 🠈 IZQUIERDA ]" },
  { key: "RIGHT", label: "[ 🠊 DERECHA ]" },
];

const FAIL_COMMENTS = [
  "Tus reflejos caducaron en el siglo pasado.",
  "Tropezaste con tu propia sombra.",
  "La trampa ni se esforzó. Te tiraste encima.",
  "Reacción de estatua de mármol.",
];

export class AgilityScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.AGILITY });
  }

  init(data) {
    this._challenge     = data?.challenge ?? CHALLENGES.AGILITY;
    this._sheetData     = data?.sheet ?? null;
    this._currentLevel  = 1;
    this._maxLevels     = 20;
    this._alive         = true;
    this._inCountdown   = true;
    this._score         = 0;
    this._currentPrompt = null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x191409);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Fondo Sala de Trampas
    const gfx = this.add.graphics().setDepth(DEPTHS.BG);
    gfx.fillStyle(0x120e05, 1);
    gfx.fillRect(0, 0, W, H);
    gfx.fillStyle(0x36270b, 1);
    gfx.fillRect(0, 0, 30, H);
    gfx.fillRect(W - 30, 0, 30, H);

    // HUD
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, 0xd4a017).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 04: AGILIDAD", {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#f0c040", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 175, "REACCIONA ANTES QUE EXPIRE EL TIEMPO\nPulsa la tecla indicada en pantalla", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#d4a017", resolution: 2, align: "center", lineSpacing: 8,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Display QTE Prompter gigante
    this._promptBox = this.add.rectangle(W / 2, H / 2 - 30, 520, 220, COLORS.UI_PANEL, 0.98)
      .setStrokeStyle(4, COLORS.GOLD).setDepth(DEPTHS.UI);

    this._promptText = this.add.text(W / 2, H / 2 - 30, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "36px", color: "#ffffff", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 1);

    // Barra de tiempo restante
    this._timerBar = this.add.rectangle(W / 2, H / 2 + 110, 520, 24, 0x4caf77, 1)
      .setDepth(DEPTHS.UI + 1);

    // Telón y Cuenta Atrás
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x191409, 0.95)
      .setDepth(250).setVisible(false);

    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "120px", color: "#f0c040", resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    this._dialog = new DialogBox(this);

    // Escuchar Teclado y Click
    this.input.keyboard?.on("keydown", (evt) => this._onKeyPress(evt.code));
    this.input.on("pointerdown", () => this._onPointerTap());

    this.time.delayedCall(400, () => this._beginLevel());
  }

  _beginLevel() {
    if (!this._alive) return;
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
    this._inCountdown = true;

    this._runCountdown(() => {
      this._inCountdown = false;
      this._spawnPrompt();
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
      this._countdownText.setText(steps[i]).setVisible(true);
      i++;
      this.time.delayedCall(300, next);
    };
    next();
  }

  _spawnPrompt() {
    this._currentPrompt = Phaser.Math.RND.pick(PROMPTS);
    this._promptText.setText(this._currentPrompt.label);
    this._maxTime = Math.max(0.6, 2.2 - (this._currentLevel - 1) * 0.08);
    this._timeLeft = this._maxTime;
  }

  _onKeyPress(code) {
    if (!this._alive || this._inCountdown || !this._currentPrompt || this._dialog.isVisible()) return;

    const expectedKey = `Key${this._currentPrompt.key}`;
    const expectedArrow = `Arrow${this._currentPrompt.key}`;
    const isSpace = this._currentPrompt.key === "SPACE" && code === "Space";

    if (code === expectedKey || code === expectedArrow || isSpace) {
      this._passLevel();
    } else {
      this._failLevel();
    }
  }

  _onPointerTap() {
    if (!this._alive || this._inCountdown || !this._currentPrompt || this._dialog.isVisible()) return;
    this._passLevel();
  }

  update(time, delta) {
    if (!this._alive || this._inCountdown || !this._currentPrompt || this._dialog.isVisible()) return;

    const dt = delta / 1000;
    this._timeLeft -= dt;

    const ratio = Math.max(0, this._timeLeft / this._maxTime);
    this._timerBar.setSize(520 * ratio, 24);

    if (this._timeLeft <= 0) {
      this._failLevel();
    }
  }

  _passLevel() {
    this._score = this._currentLevel;
    if (this._currentLevel >= this._maxLevels) {
      this._endGame(true);
      return;
    }
    this._currentLevel++;
    this.cameras.main.flash(150, 240, 192, 64, true);
    this._beginLevel();
  }

  _failLevel() {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const comment = Phaser.Math.RND.pick(FAIL_COMMENTS);
    this._dialog.show(`FIN DE LA PRUEBA\n\n${comment}\n\nPuntuación: ${this._score} / 20`, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score: this._score, sheet: this._sheetData });
    }, "Examinador Rotval");
  }

  _endGame(perfect = false) {
    this._alive = false;
    this._coverPanel.setVisible(true);
    this._dialog.show(`¡AGILIDAD FELINA!\n\nPuntuación: ${this._score} / 20`, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score: this._score, sheet: this._sheetData });
    }, "Examinador Rotval");
  }
}
