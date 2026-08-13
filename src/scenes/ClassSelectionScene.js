/**
 * ClassSelectionScene.js — Selección de Clase por Escalones (Tiers I - IV)
 * Clases narrativas satíricas sin bonificadores.
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
import { CLASS_TIERS } from "../data/classes.js";
import { CharacterSheet } from "../systems/CharacterSheet.js";
import { SaveManager } from "../systems/SaveManager.js";
import { DialogBox } from "../ui/DialogBox.js";
import { PixelButton } from "../ui/PixelButton.js";

export class ClassSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.CLASS_SELECTION });
    this.sheet = new CharacterSheet();
    this._currentTierIndex = 0; // Empieza en Escalón I (0)
  }

  create() {
    const saved = SaveManager.load();
    if (saved) this.sheet.fromJSON(saved);

    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    this._dialog = new DialogBox(this);
    this._renderTierUI();
  }

  _renderTierUI() {
    // Limpiar elementos dinámicos anteriores
    if (this._container) this._container.destroy(true);

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const tierData = CLASS_TIERS[this._currentTierIndex];
    this._container = this.add.container(0, 0).setDepth(DEPTHS.UI);

    // ── Cabecera ──────────────────────────────────────────────────────────────
    const headerTitle = this.add.text(cx, 50, tierData.title, {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5);
    this._container.add(headerTitle);

    const headerSub = this.add.text(cx, 95, tierData.subtitle, {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#8a7a9a", wordWrap: { width: W - 80 }, align: "center", resolution: 2, lineSpacing: 6,
    }).setOrigin(0.5);
    this._container.add(headerSub);

    const sep1 = this.add.rectangle(cx, 135, W - 60, 3, COLORS.GOLD_DARK);
    this._container.add(sep1);

    // ── Lista de Clases del Tier ─────────────────────────────────────────────
    const startY = 160;
    const itemH  = 160;
    const gapY   = 175;

    tierData.classes.forEach((cls, idx) => {
      const y = startY + idx * gapY;
      if (y + itemH > H - 150) return; // Evitar salir de pantalla en vertical

      const bg = this.add.rectangle(cx, y + itemH / 2, W - 70, itemH, COLORS.UI_PANEL, 0.95)
        .setStrokeStyle(3, COLORS.UI_BORDER)
        .setInteractive({ useHandCursor: true });
      this._container.add(bg);

      const title = this.add.text(cx - 270, y + 26, cls.name, {
        fontFamily: FONTS.PRIMARY, fontSize: "20px", color: "#f0c040", resolution: 2,
      }).setOrigin(0, 0.5);
      this._container.add(title);

      const req = this.add.text(cx + 270, y + 26, cls.reqText, {
        fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#6a4e8a", resolution: 2,
      }).setOrigin(1, 0.5);
      this._container.add(req);

      const desc = this.add.text(cx - 270, y + 80, cls.description, {
        fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#f0e6d3", wordWrap: { width: W - 140 }, lineSpacing: 6, resolution: 2,
      }).setOrigin(0, 0.5);
      this._container.add(desc);

      bg.on("pointerover", () => bg.setStrokeStyle(3, COLORS.GOLD));
      bg.on("pointerout",  () => bg.setStrokeStyle(3, COLORS.UI_BORDER));
      bg.on("pointerdown", () => this._trySelectClass(cls, tierData));
    });

    // ── Botón "Rendirse y mirar Clases Inferiores" ────────────────────────────
    if (tierData.giveUpText) {
      const giveUpBtn = new PixelButton(this, cx, H - 75, tierData.giveUpText, () => {
        this._currentTierIndex = Math.min(CLASS_TIERS.length - 1, this._currentTierIndex + 1);
        this._renderTierUI();
      }, { width: 620, height: 76, fontSize: "16px" });

      this._container.add(giveUpBtn._bg);
      this._container.add(giveUpBtn._label);
      this._container.add(giveUpBtn._cursor);
    }
  }

  _trySelectClass(cls, tierData) {
    // Evaluar si se cumplen los requisitos
    const reqs = cls.requirements || {};
    let meetsReqs = true;

    for (const [attr, minVal] of Object.entries(reqs)) {
      const userVal = this.sheet.attributes[attr] ?? 0;
      if (userVal < minVal) {
        meetsReqs = false;
        break;
      }
    }

    if (meetsReqs) {
      // ¡Aceptado!
      this.sheet.heroClass = cls.id;
      SaveManager.save(this.sheet);

      this._dialog.show(`¡SOLICITUD ACEPTADA!\n\nEl Tribunal te ha concedido el título de:\n${cls.name}.\n\n¡Comienza tu desastrosa aventura!`, () => {
        this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
        this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
          this.scene.start(SCENES.GUILD_REPORT);
        });
      }, "Tribunal del Gremio");
    } else {
      // Rechazo sarcástico
      this._dialog.show(`SOLICITUD RECHAZADA\n\n${cls.rejection}\n\n[ ${cls.reqText} ]`, null, "Tribunal del Gremio");
    }
  }
}
