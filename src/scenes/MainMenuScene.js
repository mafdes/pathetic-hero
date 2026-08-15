/**
 * MainMenuScene.js — Menú principal (720×1280 HD Vertical)
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, FONT_SIZES, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
import { SaveManager } from "../systems/SaveManager.js";
import { PixelButton } from "../ui/PixelButton.js";

import { CharacterSheet } from "../systems/CharacterSheet.js";
import { generateHeroName, randInt } from "../utils/helpers.js";

const MENU_ITEMS_BASE = [
  { id: "new",     label: "NUEVA PARTIDA" },
  { id: "options", label: "OPCIONES"      },
];

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MAIN_MENU });
    this._selectedIndex = 0;
    this._buttons = [];
    this._menuItems = [];
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

    // ── Cabecera Vertical HD ──────────────────────────────────────────────────
    this.add.text(W / 2, 180, "PATHETIC", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "80px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 270, "HERO", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "64px",
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(W / 2, 330, W - 100, 3, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    const subtitle = this.add.text(W / 2, 370, "~ Un RPG para valientes mediocres ~", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "16px",
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

    this.add.rectangle(W / 2, 410, W - 100, 3, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    // ── Botones Dinámicos: CONTINUAR / NUEVA PARTIDA / OPCIONES ─────────────
    const savedData = SaveManager.load();
    this._menuItems = [];
    if (savedData) {
      this._menuItems.push({ id: "continue", label: "CONTINUAR" });
    }
    this._menuItems.push({ id: "new", label: "NUEVA PARTIDA" });
    this._menuItems.push({ id: "options", label: "OPCIONES" });
    this._menuItems.push({ id: "credits", label: "CRÉDITOS" });

    const startY = savedData ? 460 : 510;
    const gap = 100;

    this._buttons = this._menuItems.map((item, i) => {
      const btn = new PixelButton(
        this,
        W / 2,
        startY + i * gap,
        item.label,
        () => this._onSelect(item.id),
        { width: 560, height: 80, fontSize: "26px" }
      );
      return btn;
    });

    this._updateSelection();

    // ── BOTÓN SALTO DEV A MAZMORRA (VIDA Y STATS FULL) ─────────────────────
    const devBtn = this.add.text(W / 2, H - 110, "[ ⚡ SALTO DIRECTO A MAZMORRA (DEV) ]", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "14px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI).setInteractive({ useHandCursor: true });

    devBtn.on("pointerover", () => devBtn.setColor("#ffffff"));
    devBtn.on("pointerout",  () => devBtn.setColor("#d4a017"));
    devBtn.on("pointerdown", () => this._devJumpToDungeon());

    // ── Versión ───────────────────────────────────────────────────────────────
    this.add.text(W / 2, H - 50, "v0.3.0 — Pathetic Hero", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "20px",
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
    const total = this._menuItems.length;
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
    this._onSelect(this._menuItems[this._selectedIndex].id);
  }

  _onSelect(id) {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      switch (id) {
        case "continue":
          this._continueSavedGame();
          break;
        case "new":
          SaveManager.clear();
          this.scene.start(SCENES.NAME_SELECTION);
          break;
        case "options":
          this.scene.start(SCENES.OPTIONS);
          break;
        case "credits":
          this.scene.start(SCENES.CREDITS);
          break;
      }
    });
  }

  _continueSavedGame() {
    const saved = SaveManager.load();
    const sheet = new CharacterSheet();
    if (saved) sheet.fromJSON(saved);

    // Garantizar que no esté a 0 para pasar el Tribunal de Admisión
    let hasNonZero = Object.values(sheet.attributes).some(v => v !== null && v > 0);
    if (!hasNonZero) {
      Object.keys(sheet.attributes).forEach(k => {
        sheet.attributes[k] = randInt(3, 6);
      });
    }
    SaveManager.save(sheet);

    this.scene.start(SCENES.MAP, { levelId: 1 });
  }

  _devJumpToDungeon() {
    const saved = SaveManager.load();
    const sheet = new CharacterSheet();
    if (saved) {
      sheet.fromJSON(saved);
    } else {
      sheet.name = generateHeroName();
    }

    // Asegurar stats potentes para pruebas (4..8)
    Object.keys(sheet.attributes).forEach(k => {
      if (!sheet.attributes[k] || sheet.attributes[k] === 0) {
        sheet.attributes[k] = randInt(4, 8);
      }
    });
    SaveManager.save(sheet);

    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.MAP, { levelId: 1 });
    });
  }
}
