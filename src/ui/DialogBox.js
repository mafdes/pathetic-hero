/**
 * DialogBox.js — Cuadro de diálogo estilo RPG con efecto typewriter
 */

import { COLORS, FONTS, FONT_SIZES, TIMING, DEPTHS } from "../utils/constants.js";

export class DialogBox {
  constructor(scene, options = {}) {
    this.scene = scene;
    const W = scene.scale.width;
    const H = scene.scale.height;

    const x = options.x ?? 16;
    const w = options.width ?? W - 32;
    const h = options.height ?? 120;
    const y = options.y ?? H - h - 12;

    this._onComplete = null;
    this._typeTimer = null;
    this._charIndex = 0;
    this._fullText = "";
    this._isTyping = false;
    this._visible = false;

    // ── Fondo del panel ─────────────────────────────────────────────────────
    this._bg = scene.add
      .rectangle(x, y, w, h, COLORS.UI_PANEL, 0.92)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.DIALOG)
      .setStrokeStyle(2, COLORS.GOLD)
      .setVisible(false);

    // ── Nombre del hablante ──────────────────────────────────────────────────
    this._speakerText = scene.add
      .text(x + 16, y - 22, "", {
        fontFamily: FONTS.PRIMARY,
        fontSize: FONT_SIZES.SMALL,
        color: "#d4a017",
        resolution: 2,
      })
      .setDepth(DEPTHS.DIALOG)
      .setVisible(false);

    // ── Texto principal con typewriter ───────────────────────────────────────
    this._bodyText = scene.add
      .text(x + 16, y + 16, "", {
        fontFamily: FONTS.PRIMARY,
        fontSize: FONT_SIZES.SMALL,
        color: "#f0e6d3",
        wordWrap: { width: w - 32 },
        resolution: 2,
        lineSpacing: 10,
      })
      .setDepth(DEPTHS.DIALOG)
      .setVisible(false);

    // ── Indicador "continuar" ────────────────────────────────────────────────
    this._continueIndicator = scene.add
      .text(x + w - 32, y + h - 28, "▼", {
        fontFamily: FONTS.PRIMARY,
        fontSize: FONT_SIZES.SMALL,
        color: "#d4a017",
        resolution: 2,
      })
      .setDepth(DEPTHS.DIALOG)
      .setVisible(false);

    scene.tweens.add({
      targets: this._continueIndicator,
      alpha: 0,
      duration: TIMING.CURSOR_BLINK,
      yoyo: true,
      repeat: -1,
    });
  }

  show(text, onComplete = null, speaker = "") {
    this._fullText = text;
    this._onComplete = onComplete;
    this._charIndex = 0;
    this._isTyping = true;
    this._visible = true;

    this._speakerText.setText(speaker).setVisible(!!speaker);
    this._bodyText.setText("").setVisible(true);
    this._bg.setVisible(true);
    this._continueIndicator.setVisible(false);

    this._startTypewriter();
  }

  advance() {
    if (!this._visible) return;
    if (this._isTyping) {
      this._skipTypewriter();
    } else {
      this.hide();
      if (this._onComplete) this._onComplete();
    }
  }

  _startTypewriter() {
    if (this._typeTimer) this._typeTimer.remove();
    this._typeTimer = this.scene.time.addEvent({
      delay: TIMING.TYPEWRITER_DELAY,
      callback: this._typeNextChar,
      callbackScope: this,
      loop: true,
    });
  }

  _typeNextChar() {
    if (this._charIndex >= this._fullText.length) {
      this._finishTypewriter();
      return;
    }
    this._charIndex++;
    this._bodyText.setText(this._fullText.slice(0, this._charIndex));
  }

  _skipTypewriter() {
    if (this._typeTimer) this._typeTimer.remove();
    this._bodyText.setText(this._fullText);
    this._finishTypewriter();
  }

  _finishTypewriter() {
    if (this._typeTimer) { this._typeTimer.remove(); this._typeTimer = null; }
    this._isTyping = false;
    this._continueIndicator.setVisible(true);
  }

  hide() {
    if (this._typeTimer) this._typeTimer.remove();
    this._bg.setVisible(false);
    this._bodyText.setVisible(false);
    this._speakerText.setVisible(false);
    this._continueIndicator.setVisible(false);
    this._visible = false;
    this._isTyping = false;
  }

  isVisible() { return this._visible; }
  isTyping()  { return this._isTyping; }

  destroy() {
    if (this._typeTimer) this._typeTimer.remove();
    this._bg.destroy();
    this._bodyText.destroy();
    this._speakerText.destroy();
    this._continueIndicator.destroy();
  }
}
