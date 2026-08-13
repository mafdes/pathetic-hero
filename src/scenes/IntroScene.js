/**
 * IntroScene.js — Pantalla de créditos/intro con efecto typewriter
 *
 * Texto que aparece letra a letra sobre fondo pixel art oscuro.
 * Narra (sarcásticamente) el contexto del mundo del Gremio de Héroes.
 * Skip con cualquier tecla, click o toque.
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, TIMING, DEPTHS } from "../utils/constants.js";

const INTRO_LINES = [
  "ANNO DOMINI 1347.",
  "",
  "El Imperio está en paz.",
  "Sus ciudades prosperan.",
  "Sus heroes... no tanto.",
  "",
  "El Gremio de Héroes lleva",
  "300 años gestionando el",
  "fracaso ajeno con eficiencia",
  "burocrática impecable.",
  "",
  "Hoy, un nuevo aspirante",
  "llama a sus puertas.",
  "",
  "Tú.",
  "",
  "Dios nos coja confesados.",
];

export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.INTRO });
    this._lineIndex = 0;
    this._charIndex = 0;
    this._typeTimer = null;
    this._done = false;
    this._skipCooldown = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Fondo ────────────────────────────────────────────────────────────────
    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);

    // Si hay imagen de fondo cargada, mostrarla oscurecida
    if (this.textures.exists("bg_intro")) {
      this.add.image(W / 2, H / 2, "bg_intro")
        .setDisplaySize(W, H)
        .setAlpha(0.35)
        .setDepth(DEPTHS.BG);
    }

    // ── Contenedor de texto ───────────────────────────────────────────────────
    this._textContainer = this.add.container(0, 0).setDepth(DEPTHS.UI);

    // Texto principal (se va construyendo línea a línea)
    this._displayedLines = [];
    this._currentLineText = this.add.text(W / 2, H / 2 - 20, "", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "6px",
      color: "#f0e6d3",
      resolution: 2,
      align: "center",
    }).setOrigin(0.5, 0.5);
    this._textContainer.add(this._currentLineText);

    // Pista "pulsa para saltar"
    this._skipHint = this.add.text(W - 6, H - 8, "[ SKIP ]", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "4px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(1, 1).setDepth(DEPTHS.UI);

    // Parpadeo del hint
    this.tweens.add({
      targets: this._skipHint,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    // Fade in inicial
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Empezar a escribir después del fade
    this.time.delayedCall(TIMING.TRANSITION_DURATION + 100, () => {
      this._skipCooldown = true;
      this._startTyping();
    });

    // ── Input: skip ──────────────────────────────────────────────────────────
    this.input.keyboard?.once("keydown", this._handleSkip, this);
    this.input.once("pointerdown", this._handleSkip, this);
  }

  _startTyping() {
    if (this._typeTimer) this._typeTimer.remove();
    this._typeTimer = this.time.addEvent({
      delay: TIMING.TYPEWRITER_DELAY,
      callback: this._typeChar,
      callbackScope: this,
      loop: true,
    });
  }

  _typeChar() {
    if (this._lineIndex >= INTRO_LINES.length) {
      this._finishIntro();
      return;
    }

    const currentLine = INTRO_LINES[this._lineIndex];

    if (this._charIndex > currentLine.length) {
      // Pausa entre líneas
      this._typeTimer.delay = TIMING.TYPEWRITER_DELAY * 8;
      this._charIndex = 0;
      this._lineIndex++;
      this._renderLines();
      return;
    }

    this._typeTimer.delay = TIMING.TYPEWRITER_DELAY;
    this._charIndex++;
    this._renderLines();
  }

  _renderLines() {
    const completedLines = INTRO_LINES.slice(0, this._lineIndex).join("\n");
    const partial = INTRO_LINES[this._lineIndex]?.slice(0, this._charIndex) ?? "";
    const full = completedLines
      ? completedLines + "\n" + partial
      : partial;

    this._currentLineText.setText(full);
  }

  _handleSkip() {
    if (!this._skipCooldown) return;

    if (!this._done) {
      // Primera pulsación: mostrar todo el texto de golpe
      if (this._typeTimer) this._typeTimer.remove();
      this._currentLineText.setText(INTRO_LINES.join("\n"));
      this._done = true;
      // Segunda oportunidad para salir
      this.time.delayedCall(TIMING.COOLDOWN_AFTER_RESULT, () => {
        this.input.keyboard?.once("keydown", this._goToMenu, this);
        this.input.once("pointerdown", this._goToMenu, this);
      });
    }
  }

  _finishIntro() {
    if (this._typeTimer) this._typeTimer.remove();
    this._done = true;

    // Mostrar "PULSA PARA CONTINUAR"
    const W = this.scale.width;
    const H = this.scale.height;
    const continueText = this.add.text(W / 2, H - 14, "PULSA PARA CONTINUAR", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "5px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.tweens.add({
      targets: continueText,
      alpha: 0,
      duration: TIMING.CURSOR_BLINK,
      yoyo: true,
      repeat: -1,
    });

    this.time.delayedCall(TIMING.COOLDOWN_AFTER_RESULT, () => {
      this.input.keyboard?.once("keydown", this._goToMenu, this);
      this.input.once("pointerdown", this._goToMenu, this);
    });
  }

  _goToMenu() {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.MAIN_MENU);
    });
  }
}
