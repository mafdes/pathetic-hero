/**
 * IntelligenceScene.js — Prueba de Inteligencia del Gremio (720×1280 HD Vertical)
 * Sala retro pixel art: "La Biblioteca del Juicio Burocrático".
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";
import { PixelButton } from "../../ui/PixelButton.js";

const QUIZ_QUESTIONS = [
  { q: "¿Cuánto es 2 + 2 según el reglamento?", options: ["4", "5 (con IVA)", "3", "Depende del duende"], correct: 1 },
  { q: "Si ves un dragón de 20 metros, debes:", options: ["Atacar", "Rellenar modelo 3-B", "Huir", "Llamar a tu madre"], correct: 1 },
  { q: "¿Cuál es el arma definitiva?", options: ["Espada Legendaria", "El Sello de la Oficina", "Magia Oscura", "Poción"], correct: 1 },
  { q: "¿Por qué el agua moja?", options: ["Física", "Por decreto real", "No moja", "Cuestiones de fe"], correct: 1 },
  { q: "¿Qué hace un héroe ante el peligro?", options: ["Cobrar por adelantado", "Luchar", "Llorar", "Rezar"], correct: 0 },
];

const FAIL_COMMENTS = [
  "Intelecto de piedra pómez.",
  "Fallaste la pregunta más ridícula.",
  "El Tribunal duda que sepas leer.",
  "Suspenso absoluto en lógica medieval.",
];

export class IntelligenceScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.INTELLIGENCE });
  }

  init(data) {
    this._challenge     = data?.challenge ?? CHALLENGES.INTELLIGENCE;
    this._sheetData     = data?.sheet ?? null;
    this._currentLevel  = 1;
    this._maxLevels     = 20;
    this._alive         = true;
    this._inCountdown   = true;
    this._score         = 0;
    this._buttons       = [];
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x0e1424);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Fondo Biblioteca / Inteligencia
    const gfx = this.add.graphics().setDepth(DEPTHS.BG);
    gfx.fillStyle(0x070c17, 1);
    gfx.fillRect(0, 0, W, H);
    gfx.fillStyle(0x192742, 1);
    gfx.fillRect(0, 0, 30, H);
    gfx.fillRect(W - 30, 0, 30, H);

    // HUD
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, 0x3b82f6).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 05: INTELIGENCIA", {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#60a5fa", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Caja de Pregunta
    this._qBox = this.add.rectangle(W / 2, 240, W - 80, 160, COLORS.UI_PANEL, 0.98)
      .setStrokeStyle(3, 0x3b82f6).setDepth(DEPTHS.UI);

    this._qText = this.add.text(W / 2, 240, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "18px", color: "#ffffff", wordWrap: { width: W - 120 }, align: "center", resolution: 2, lineSpacing: 10,
    }).setOrigin(0.5).setDepth(DEPTHS.UI + 1);

    // Telón y Cuenta Atrás
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x0e1424, 0.95)
      .setDepth(250).setVisible(false);

    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "120px", color: "#60a5fa", resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    this._dialog = new DialogBox(this);

    this.time.delayedCall(400, () => this._beginLevel());
  }

  _beginLevel() {
    if (!this._alive) return;
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
    this._inCountdown = true;

    this._runCountdown(() => {
      this._inCountdown = false;
      this._loadQuestion();
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

  _loadQuestion() {
    this._clearButtons();
    const W = this.scale.width;
    const qData = QUIZ_QUESTIONS[(this._currentLevel - 1) % QUIZ_QUESTIONS.length];
    this._qText.setText(qData.q);

    const startY = 420;
    const gapY = 110;

    this._buttons = qData.options.map((optText, idx) => {
      return new PixelButton(this, W / 2, startY + idx * gapY, optText, () => {
        if (idx === qData.correct) {
          this._passLevel();
        } else {
          this._failLevel();
        }
      }, { width: 580, height: 86, fontSize: "18px" });
    });
  }

  _clearButtons() {
    this._buttons.forEach(b => b.destroy());
    this._buttons = [];
  }

  _passLevel() {
    this._score = this._currentLevel;
    if (this._currentLevel >= this._maxLevels) {
      this._endGame(true);
      return;
    }
    this._currentLevel++;
    this.cameras.main.flash(150, 96, 165, 250, true);
    this._beginLevel();
  }

  _failLevel() {
    this._alive = false;
    this._clearButtons();
    this._coverPanel.setVisible(true);
    const comment = Phaser.Math.RND.pick(FAIL_COMMENTS);
    this._dialog.show(`FIN DE LA PRUEBA\n\n${comment}\n\nPuntuación: ${this._score} / 20`, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score: this._score, sheet: this._sheetData });
    }, "Examinador Rotval");
  }

  _endGame(perfect = false) {
    this._alive = false;
    this._clearButtons();
    this._coverPanel.setVisible(true);
    this._dialog.show(`¡INTELECTO BRILLANTE!\n\nPuntuación: ${this._score} / 20`, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score: this._score, sheet: this._sheetData });
    }, "Examinador Rotval");
  }
}
