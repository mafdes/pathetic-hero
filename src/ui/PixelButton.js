/**
 * PixelButton.js — Botón reutilizable con estética pixel art retro
 *
 * Uso:
 *   const btn = new PixelButton(scene, 160, 90, "NUEVA PARTIDA", () => { ... });
 */

import { COLORS, FONTS, DEPTHS } from "../utils/constants.js";

export class PixelButton {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x — Centro X
   * @param {number} y — Centro Y
   * @param {string} label
   * @param {Function} onClick
   * @param {object} [options]
   * @param {number} [options.width=100]
   * @param {number} [options.height=16]
   * @param {number} [options.fontSize=6]
   * @param {boolean} [options.selected=false] — Estado seleccionado inicial
   */
  constructor(scene, x, y, label, onClick, options = {}) {
    this.scene = scene;
    this.onClick = onClick;
    this._selected = options.selected ?? false;
    this._enabled = true;

    const w = options.width ?? 100;
    const h = options.height ?? 16;
    const fs = options.fontSize ?? 6;

    // ── Fondo del botón ──────────────────────────────────────────────────────
    this._bg = scene.add
      .rectangle(x, y, w, h, COLORS.UI_PANEL, 0.9)
      .setDepth(DEPTHS.UI)
      .setStrokeStyle(1, COLORS.GOLD_DARK)
      .setInteractive({ useHandCursor: true });

    // ── Texto ────────────────────────────────────────────────────────────────
    this._label = scene.add
      .text(x, y, label, {
        fontFamily: FONTS.PRIMARY,
        fontSize: `${fs}px`,
        color: "#f0e6d3",
        resolution: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTHS.UI);

    // ── Cursor selector (► a la izquierda) ──────────────────────────────────
    this._cursor = scene.add
      .text(x - w / 2 + 4, y, "►", {
        fontFamily: FONTS.PRIMARY,
        fontSize: `${fs}px`,
        color: "#d4a017",
        resolution: 2,
      })
      .setOrigin(0, 0.5)
      .setDepth(DEPTHS.UI)
      .setVisible(false);

    // ── Eventos de ratón ─────────────────────────────────────────────────────
    this._bg
      .on("pointerover", () => this.select())
      .on("pointerout", () => {
        if (!this._selected) this.deselect();
      })
      .on("pointerdown", () => {
        if (this._enabled) {
          scene.sound.play("sfx_confirm", { volume: 0.6 }).catch?.(() => {});
          this.onClick();
        }
      });

    this._updateVisuals();
  }

  select() {
    this._selected = true;
    this._updateVisuals();
  }

  deselect() {
    this._selected = false;
    this._updateVisuals();
  }

  setEnabled(enabled) {
    this._enabled = enabled;
    this._updateVisuals();
  }

  _updateVisuals() {
    const color = this._selected && this._enabled ? COLORS.GOLD : COLORS.GOLD_DARK;
    this._bg.setStrokeStyle(1, color);
    this._label.setColor(
      this._enabled
        ? (this._selected ? "#f0c040" : "#f0e6d3")
        : "#666666"
    );
    this._cursor.setVisible(this._selected && this._enabled);
  }

  setLabel(text) {
    this._label.setText(text);
  }

  setVisible(v) {
    this._bg.setVisible(v);
    this._label.setVisible(v);
    this._cursor.setVisible(v && this._selected);
    return this;
  }

  destroy() {
    this._bg.destroy();
    this._label.destroy();
    this._cursor.destroy();
  }
}
