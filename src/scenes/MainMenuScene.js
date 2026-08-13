/**
 * MainMenuScene.js — Menú principal de Pathetic Hero
 *
 * Opciones:
 *   - NUEVA PARTIDA → ControlsScene (pregunta controles) → GuildReportScene
 *   - CONTINUAR     → GuildReportScene (si hay save)
 *   - OPCIONES      → OptionsScene
 *
 * Navegación: teclado (↑↓ + Enter) y ratón/táctil.
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
import { SaveManager } from "../systems/SaveManager.js";
import { PixelButton } from "../ui/PixelButton.js";

const MENU_ITEMS = [
  { id: "new",      label: "NUEVA PARTIDA" },
  { id: "continue", label: "CONTINUAR"     },
  { id: "options",  label: "OPCIONES"      },
];

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MAIN_MENU });
    this._selectedIndex = 0;
    this._buttons = [];
    this._hasSave = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._hasSave = SaveManager.hasSave();

    // ── Fondo ────────────────────────────────────────────────────────────────
    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    if (this.textures.exists("bg_menu")) {
      this.add.image(W / 2, H / 2, "bg_menu")
        .setDisplaySize(W, H)
        .setAlpha(0.3)
        .setDepth(DEPTHS.BG);
    }

    // ── Logo / Título ─────────────────────────────────────────────────────────
    // Línea decorativa superior
    this.add.rectangle(W / 2, 28, W - 16, 1, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI);

    this.add.text(W / 2, 18, "PATHETIC", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "12px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 30, "HERO", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "10px",
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Subtítulo sarcástico con parpadeo suave
    const subtitle = this.add.text(W / 2, 42, "~ Un RPG para valientes mediocres ~", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "4px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.tweens.add({
      targets: subtitle,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Línea decorativa
    this.add.rectangle(W / 2, 50, W - 16, 1, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI);

    // ── Botones del menú ──────────────────────────────────────────────────────
    const startY = 80;
    const gap = 22;

    this._buttons = MENU_ITEMS.map((item, i) => {
      const enabled = item.id !== "continue" || this._hasSave;
      const btn = new PixelButton(
        this,
        W / 2,
        startY + i * gap,
        item.label,
        () => this._onSelect(item.id),
        { width: 140, height: 14, fontSize: 6 }
      );
      btn.setEnabled(enabled);
      return btn;
    });

    this._updateSelection();

    // ── Versión ───────────────────────────────────────────────────────────────
    this.add.text(W - 4, H - 4, "v0.1.0", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "4px",
      color: "#3d3d6b",
      resolution: 2,
    }).setOrigin(1, 1).setDepth(DEPTHS.UI);

    // ── Input teclado ─────────────────────────────────────────────────────────
    this._cursors = this.input.keyboard?.createCursorKeys();
    this._enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this._zKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    // Navegación con teclado
    this.input.keyboard?.on("keydown-UP", () => this._moveSelection(-1));
    this.input.keyboard?.on("keydown-DOWN", () => this._moveSelection(1));
    this.input.keyboard?.on("keydown-ENTER", () => this._confirmSelection());
    this.input.keyboard?.on("keydown-Z", () => this._confirmSelection());
  }

  _moveSelection(dir) {
    const total = MENU_ITEMS.length;
    let next = (this._selectedIndex + dir + total) % total;
    // Saltar opciones deshabilitadas
    if (MENU_ITEMS[next].id === "continue" && !this._hasSave) {
      next = (next + dir + total) % total;
    }
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
    const item = MENU_ITEMS[this._selectedIndex];
    if (item.id === "continue" && !this._hasSave) return;
    this._onSelect(item.id);
  }

  _onSelect(id) {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      switch (id) {
        case "new":
          SaveManager.clear();
          this.scene.start(SCENES.CONTROLS, { mode: "new" });
          break;
        case "continue":
          this.scene.start(SCENES.GUILD_REPORT);
          break;
        case "options":
          this.scene.start(SCENES.OPTIONS);
          break;
      }
    });
  }
}
