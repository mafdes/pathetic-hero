/**
 * MainMenuScene.js — Menú principal (540×960 Vertical)
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, FONT_SIZES, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
import { SaveManager } from "../systems/SaveManager.js";
import { PixelButton } from "../ui/PixelButton.js";

const MENU_ITEMS = [
  { id: "new",     label: "NUEVA PARTIDA" },
  { id: "options", label: "OPCIONES"      },
];

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MAIN_MENU });
    this._selectedIndex = 0;
    this._buttons = [];
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    if (this.textures.exists("bg_menu")) {
      this.add.image(W / 2, H / 2, "bg_menu")
        .setDisplaySize(W, H).setAlpha(0.3).setDepth(DEPTHS.BG);
    }

    // ── Cabecera Vertical ──────────────────────────────────────────────────
    this.add.text(W / 2, 140, "PATHETIC", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "40px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 210, "HERO", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "36px",
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(W / 2, 260, W - 60, 2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    const subtitle = this.add.text(W / 2, 290, "~ Un RPG para valientes mediocres ~", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "12px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.tweens.add({
      targets: subtitle,
      alpha: 0.4,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add.rectangle(W / 2, 320, W - 60, 2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    // ── Botones ───────────────────────────────────────────────────────────────
    const startY = 460;
    const gap = 80;

    this._buttons = MENU_ITEMS.map((item, i) => {
      const btn = new PixelButton(
        this,
        W / 2,
        startY + i * gap,
        item.label,
        () => this._onSelect(item.id),
        { width: 380, height: 56, fontSize: "16px" }
      );
      return btn;
    });

    this._updateSelection();

    // ── Versión ───────────────────────────────────────────────────────────────
    this.add.text(W / 2, H - 36, "v0.1.0 — Pathetic Hero", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "10px",
      color: "#3d3d6b",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Input teclado ─────────────────────────────────────────────────────────
    this.input.keyboard?.on("keydown-UP",    () => this._moveSelection(-1));
    this.input.keyboard?.on("keydown-DOWN",  () => this._moveSelection(1));
    this.input.keyboard?.on("keydown-ENTER", () => this._confirmSelection());
    this.input.keyboard?.on("keydown-Z",     () => this._confirmSelection());
  }

  _moveSelection(dir) {
    const total = MENU_ITEMS.length;
    const next = (this._selectedIndex + dir + total) % total;
    this._selectedIndex = next;
    this._updateSelection();
  }

  _updateSelection() {
    this._buttons.forEach((btn, i) => {
      if (i === this._selectedIndex) btn.select();
      else btn.deselect();
    });
  }

  _confirmSelection() {
    this._onSelect(MENU_ITEMS[this._selectedIndex].id);
  }

  _onSelect(id) {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      switch (id) {
        case "new":
          SaveManager.clear();
          this.scene.start(SCENES.CONTROLS, { mode: "new" });
          break;
        case "options":
          this.scene.start(SCENES.OPTIONS);
          break;
      }
    });
  }
}
