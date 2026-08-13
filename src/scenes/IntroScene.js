/**
 * IntroScene.js — Pantalla de créditos con typewriter (960×540)
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, FONT_SIZES, SCENES, TIMING, DEPTHS } from "../utils/constants.js";

const INTRO_TEXT = `ANNO DOMINI 1347.

El Imperio está en paz. Sus ciudades prosperan.
Sus héroes... no tanto.

El Gremio de Héroes lleva 300 años gestionando
el fracaso ajeno con eficiencia burocrática impecable.

Hoy, un nuevo aspirante llama a sus puertas.

Tú.

Dios nos coja confesados.`;

export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.INTRO });
    this._charIndex = 0;
    this._typeTimer = null;
    this._done = false;
    this._skipCooldown = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    if (this.textures.exists("bg_intro")) {
      this.add.image(W / 2, H / 2, "bg_intro")
        .setDisplaySize(W, H).setAlpha(0.35).setDepth(DEPTHS.BG);
    }

    // Texto principal GRANDE y bien distribuido para ocupar la pantalla completa
    this._currentLineText = this.add.text(W / 2, H / 2 - 30, "", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "22px", // Mucho más grande y visible
      color: "#f0e6d3",
      resolution: 2,    // Renderizado en alta resolución para eliminar pixelado
      align: "center",
      wordWrap: { width: 840 },
      lineSpacing: 20,  // Interlineado amplio y elegante
    }).setOrigin(0.5, 0.5).setDepth(DEPTHS.UI);

    // Hint "SKIP"
    this._skipHint = this.add.text(W - 24, H - 24, "[ CUALQUIER TECLA — SKIP ]", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.SMALL,
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(1, 1).setDepth(DEPTHS.UI);

    this.tweens.add({
      targets: this._skipHint,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.time.delayedCall(TIMING.TRANSITION_DURATION + 100, () => {
      this._skipCooldown = true;
      this._startTyping();
    });

    this.input.keyboard?.once("keydown", this._handleSkip, this);
    this.input.once("pointerdown", this._handleSkip, this);
  }

  _startTyping() {
    if (this._typeTimer) this._typeTimer.remove();
    this._typeTimer = this.time.addEvent({
      delay: TIMING.TYPEWRITER_DELAY * 0.8,
      callback: this._typeChar,
      callbackScope: this,
      loop: true,
    });
  }

  _typeChar() {
    if (this._charIndex >= INTRO_TEXT.length) {
      this._finishIntro();
      return;
    }
    this._charIndex++;
    this._currentLineText.setText(INTRO_TEXT.slice(0, this._charIndex));
  }

  _handleSkip() {
    if (!this._skipCooldown) return;
    if (!this._done) {
      if (this._typeTimer) this._typeTimer.remove();
      this._currentLineText.setText(INTRO_TEXT);
      this._done = true;
      this.time.delayedCall(TIMING.COOLDOWN_AFTER_RESULT, () => {
        this.input.keyboard?.once("keydown", this._goToMenu, this);
        this.input.once("pointerdown", this._goToMenu, this);
      });
    }
  }

  _finishIntro() {
    if (this._typeTimer) this._typeTimer.remove();
    this._done = true;

    const W = this.scale.width;
    const H = this.scale.height;
    const cont = this.add.text(W / 2, H - 48, "— PULSA PARA CONTINUAR —", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.BODY,
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.tweens.add({ targets: cont, alpha: 0, duration: TIMING.CURSOR_BLINK, yoyo: true, repeat: -1 });

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
