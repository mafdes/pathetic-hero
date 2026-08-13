/**
 * DialogBox.js — Cuadro de diálogo estilo RPG con efecto typewriter
 *
 * Uso:
 *   const dialog = new DialogBox(scene);
 *   dialog.show("Hola, aventurero...", () => console.log("terminó"));
 *   dialog.advance(); // llamado desde input del jugador
 */

import { COLORS, FONTS, TIMING, DEPTHS } from "../utils/constants.js";

export class DialogBox {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} [options]
   * @param {number} [options.x=0]
   * @param {number} [options.y]  — Por defecto, zona inferior
   * @param {number} [options.width]
   * @param {number} [options.height=40]
   * @param {string} [options.speaker] — Nombre del hablante (opcional)
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    const W = scene.scale.width;
    const H = scene.scale.height;

    const x = options.x ?? 4;
    const w = options.width ?? W - 8;
    const h = options.height ?? 44;
    const y = options.y ?? H - h - 4;

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
      .setStrokeStyle(1, COLORS.GOLD)
      .setVisible(false);

    // ── Nombre del hablante ──────────────────────────────────────────────────
    this._speakerText = scene.add
      .text(x + 6, y - 10, "", {
        fontFamily: FONTS.PRIMARY,
        fontSize: "5px",
        color: "#d4a017",
        resolution: 2,
      })
      .setDepth(DEPTHS.DIALOG)
      .setVisible(false);

    // ── Texto principal con typewriter ───────────────────────────────────────
    this._bodyText = scene.add
      .text(x + 6, y + 6, "", {
        fontFamily: FONTS.PRIMARY,
        fontSize: "5px",
        color: "#f0e6d3",
        wordWrap: { width: w - 12 },
        resolution: 2,
        lineSpacing: 4,
      })
      .setDepth(DEPTHS.DIALOG)
      .setVisible(false);

    // ── Indicador "continuar" (▼ parpadeante) ────────────────────────────────
    this._continueIndicator = scene.add
      .text(x + w - 14, y + h - 12, "▼", {
        fontFamily: FONTS.PRIMARY,
        fontSize: "5px",
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

  /**
   * Muestra el cuadro de diálogo y empieza el typewriter.
   * @param {string} text
   * @param {Function} [onComplete] — Llamado cuando el jugador avanza al final
   * @param {string} [speaker]
   */
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

  /**
   * Avanza el diálogo: si está escribiendo, muestra todo el texto;
   * si ya terminó, llama al callback de completado.
   */
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
    if (this._typeTimer) {
      this._typeTimer.remove();
      this._typeTimer = null;
    }
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
  isTyping() { return this._isTyping; }

  destroy() {
    if (this._typeTimer) this._typeTimer.remove();
    this._bg.destroy();
    this._bodyText.destroy();
    this._speakerText.destroy();
    this._continueIndicator.destroy();
  }
}
