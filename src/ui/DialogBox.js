/**
 * DialogBox.js — Cuadro de diálogo estilo RPG con efecto typewriter (720×1280 HD Vertical)
 */

import { COLORS, FONTS, FONT_SIZES, TIMING, DEPTHS } from "../utils/constants.js";

export class DialogBox {
  constructor(scene, options = {}) {
    this.scene = scene;
    const W = scene.scale.width;
    const H = scene.scale.height;

    const x = options.x ?? 30;
    const w = options.width ?? W - 60;
    const h = options.height ?? 260;
    const y = options.y ?? H - h - 30;

    this._onComplete = null;
    this._typeTimer = null;
    this._charIndex = 0;
    this._fullText = "";
    this._isTyping = false;
    this._visible = false;

    // ── Fondo del panel ─────────────────────────────────────────────────────
    this._bg = scene.add
      .rectangle(x, y, w, h, COLORS.UI_PANEL, 0.95)
      .setOrigin(0, 0)
      .setDepth(DEPTHS.DIALOG)
      .setStrokeStyle(3, COLORS.GOLD)
      .setVisible(false);

    // ── Nombre del hablante ──────────────────────────────────────────────────
    this._speakerText = scene.add
      .text(x + 24, y - 32, "", {
        fontFamily: FONTS.PRIMARY,
        fontSize: "18px",
        color: "#d4a017",
        resolution: 2,
      })
      .setDepth(DEPTHS.DIALOG)
      .setVisible(false);

    // ── Texto principal con typewriter ───────────────────────────────────────
    this._bodyText = scene.add
      .text(x + 24, y + 26, "", {
        fontFamily: FONTS.PRIMARY,
        fontSize: "20px",
        color: "#f0e6d3",
        wordWrap: { width: w - 48 },
        resolution: 2,
        lineSpacing: 12,
      })
      .setDepth(DEPTHS.DIALOG)
      .setVisible(false);

    // ── Indicador "continuar" ────────────────────────────────────────────────
    this._continueIndicator = scene.add
      .text(x + w - 40, y + h - 36, "▼", {
        fontFamily: FONTS.PRIMARY,
        fontSize: "20px",
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
