/**
 * PixelButton.js — Botón reutilizable con estética pixel art retro (540×960 Vertical)
 */

import { COLORS, FONTS, FONT_SIZES, DEPTHS } from "../utils/constants.js";

export class PixelButton {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x — Centro X
   * @param {number} y — Centro Y
   * @param {string} label
   * @param {Function} onClick
   * @param {object} [options]
   * @param {number} [options.width=360]
   * @param {number} [options.height=54]
   * @param {string} [options.fontSize="16px"]
   * @param {boolean} [options.selected=false]
   */
  constructor(scene, x, y, label, onClick, options = {}) {
    this.scene = scene;
    this.onClick = onClick;
    this._selected = options.selected ?? false;
    this._enabled = true;

    const w = options.width  ?? 360;
    const h = options.height ?? 54;
    const fs = options.fontSize ?? FONT_SIZES.BODY;

    // ── Fondo ────────────────────────────────────────────────────────────────
    this._bg = scene.add
      .rectangle(x, y, w, h, COLORS.UI_PANEL, 0.94)
      .setDepth(DEPTHS.UI)
      .setStrokeStyle(2, COLORS.GOLD_DARK)
      .setInteractive({ useHandCursor: true });

    // ── Etiqueta ─────────────────────────────────────────────────────────────
    this._label = scene.add
      .text(x, y, label, {
        fontFamily: FONTS.PRIMARY,
        fontSize: fs,
        color: "#f0e6d3",
        resolution: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTHS.UI);

    // ── Cursor ► ─────────────────────────────────────────────────────────────
    this._cursor = scene.add
      .text(x - w / 2 + 16, y, "►", {
        fontFamily: FONTS.PRIMARY,
        fontSize: fs,
        color: "#d4a017",
        resolution: 2,
      })
      .setOrigin(0, 0.5)
      .setDepth(DEPTHS.UI)
      .setVisible(false);

    // ── Eventos ──────────────────────────────────────────────────────────────
    this._bg
      .on("pointerover", () => this.select())
      .on("pointerout",  () => { if (!this._selected) this.deselect(); })
      .on("pointerdown", () => { if (this._enabled) this.onClick(); });

    this._updateVisuals();
  }

  select()   { this._selected = true;  this._updateVisuals(); }
  deselect() { this._selected = false; this._updateVisuals(); }

  setEnabled(enabled) {
    this._enabled = enabled;
    this._bg.setInteractive(enabled ? { useHandCursor: true } : false);
    this._updateVisuals();
  }

  _updateVisuals() {
    const active = this._selected && this._enabled;
    this._bg.setStrokeStyle(2, active ? COLORS.GOLD : COLORS.GOLD_DARK);
    this._label.setColor(
      !this._enabled  ? "#555555" :
      this._selected  ? "#f0c040" : "#f0e6d3"
    );
    this._cursor.setVisible(active);
  }

  setLabel(text) { this._label.setText(text); }

  setVisible(v) {
    this._bg.setVisible(v);
    this._label.setVisible(v);
    this._cursor.setVisible(v && this._selected && this._enabled);
    return this;
  }

  destroy() {
    this._bg.destroy();
    this._label.destroy();
    this._cursor.destroy();
  }
}
