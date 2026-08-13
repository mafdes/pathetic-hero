/**
 * DialogBox.js — Modal de diálogo RPG gigante centrado en pantalla (720×1280 HD Vertical)
 */

import { COLORS, FONTS, TIMING } from "../utils/constants.js";

export class DialogBox {
  constructor(scene, options = {}) {
    this.scene = scene;
    const W = scene.scale.width;
    const H = scene.scale.height;

    const w = options.width ?? W - 80;
    const h = options.height ?? 360;
    const x = options.x ?? (W - w) / 2;
    const y = options.y ?? (H - h) / 2;

    this._onComplete = null;
    this._typeTimer = null;
    this._charIndex = 0;
    this._fullText = "";
    this._isTyping = false;
    this._visible = false;

    const DIALOG_DEPTH = 300;

    // ── Telón de fondo oscuro Fullscreen ─────────────────────────────────────
    this._backdrop = scene.add
      .rectangle(W / 2, H / 2, W, H, 0x000000, 0.82)
      .setDepth(DIALOG_DEPTH - 1)
      .setInteractive() // Bloquea clicks hacia la prueba
      .setVisible(false);

    // ── Fondo del modal centrado ─────────────────────────────────────────────
    this._bg = scene.add
      .rectangle(x, y, w, h, COLORS.UI_PANEL, 0.98)
      .setOrigin(0, 0)
      .setDepth(DIALOG_DEPTH)
      .setStrokeStyle(4, COLORS.GOLD)
      .setVisible(false);

    // ── Header del hablante ──────────────────────────────────────────────────
    this._speakerBg = scene.add
      .rectangle(x + 20, y - 24, 300, 44, COLORS.GOLD_DARK, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLORS.GOLD)
      .setDepth(DIALOG_DEPTH + 1)
      .setVisible(false);

    this._speakerText = scene.add
      .text(x + 36, y - 12, "", {
        fontFamily: FONTS.PRIMARY,
        fontSize: "20px",
        color: "#ffffff",
        resolution: 2,
      })
      .setDepth(DIALOG_DEPTH + 2)
      .setVisible(false);

    // ── Texto principal con typewriter ───────────────────────────────────────
    this._bodyText = scene.add
      .text(x + 30, y + 44, "", {
        fontFamily: FONTS.PRIMARY,
        fontSize: "22px",
        color: "#f0e6d3",
        wordWrap: { width: w - 60 },
        resolution: 2,
        lineSpacing: 16,
      })
      .setDepth(DIALOG_DEPTH + 1)
      .setVisible(false);

    // ── Indicador "PULSA PARA AVANZAR ▼" ────────────────────────────────────
    this._continueIndicator = scene.add
      .text(x + w / 2, y + h - 36, "▼ PULSA PARA AVANZAR ▼", {
        fontFamily: FONTS.PRIMARY,
        fontSize: "16px",
        color: "#d4a017",
        resolution: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DIALOG_DEPTH + 1)
      .setVisible(false);

    scene.tweens.add({
      targets: this._continueIndicator,
      alpha: 0.3,
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

    this._backdrop.setVisible(true);
    this._bg.setVisible(true);
    this._bodyText.setText("").setVisible(true);

    if (speaker) {
      this._speakerText.setText(speaker).setVisible(true);
      this._speakerBg.setVisible(true);
    } else {
      this._speakerText.setVisible(false);
      this._speakerBg.setVisible(false);
    }

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
    this._backdrop.setVisible(false);
    this._bg.setVisible(false);
    this._speakerBg.setVisible(false);
    this._speakerText.setVisible(false);
    this._bodyText.setVisible(false);
    this._continueIndicator.setVisible(false);
    this._visible = false;
    this._isTyping = false;
  }

  isVisible() { return this._visible; }
  isTyping()  { return this._isTyping; }

  destroy() {
    if (this._typeTimer) this._typeTimer.remove();
    this._backdrop.destroy();
    this._bg.destroy();
    this._speakerBg.destroy();
    this._speakerText.destroy();
    this._bodyText.destroy();
    this._continueIndicator.destroy();
  }
}
