/**
 * NameSelectionScene.js — Registro Inicial de Nombre del Aspirante (720×1280 HD Vertical)
 * Primera pantalla tras "NUEVA PARTIDA". Incluye generador aleatorio y edición de nombre con auto-escalado de fuente.
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS,
} from "../utils/constants.js";
import { CharacterSheet } from "../systems/CharacterSheet.js";
import { SaveManager } from "../systems/SaveManager.js";
import { PixelButton } from "../ui/PixelButton.js";
import { generateHeroName } from "../utils/helpers.js";

export class NameSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.NAME_SELECTION });
    this.sheet = new CharacterSheet();
  }

  create() {
    // Si hay partida iniciada la cargamos, si no creamos héroe nuevo
    const saved = SaveManager.load();
    if (saved) {
      this.sheet.fromJSON(saved);
    } else {
      this.sheet.name = generateHeroName();
      SaveManager.save(this.sheet);
    }

    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    this._buildUI();
  }

  _buildUI() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // ── Cabecera ──────────────────────────────────────────────────────────────
    this.add.text(cx, 160, "GREMIO DE HÉROES", {
      fontFamily: FONTS.PRIMARY, fontSize: "28px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(cx, 220, "REGISTRO DEL ASPIRANTE", {
      fontFamily: FONTS.PRIMARY, fontSize: "20px", color: "#f0c040", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(cx, 260, W - 80, 3, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    this.add.text(cx, 310, "Elige o genera tu nombre oficial para el expediente", {
      fontFamily: FONTS.PRIMARY, fontSize: "15px", color: "#6a4e8a", resolution: 2, align: "center", wordWrap: { width: W - 100 }, lineSpacing: 6,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Caja de Presentación del Nombre con Auto-Escalado ─────────────────────
    const nameBoxY = 440;
    const nameBoxW = W - 80;
    const nameBoxH = 140;

    this.add.rectangle(cx, nameBoxY, nameBoxW + 16, nameBoxH + 16, COLORS.BG_DARK, 1)
      .setStrokeStyle(4, COLORS.GOLD_DARK).setDepth(DEPTHS.UI_BG);

    this.add.rectangle(cx, nameBoxY, nameBoxW, nameBoxH, COLORS.UI_PANEL, 0.98)
      .setStrokeStyle(3, COLORS.GOLD).setDepth(DEPTHS.UI_BG + 1);

    this.add.text(cx, nameBoxY - 40, "NOMBRE EN LAS ACTAS DEL GREMIO", {
      fontFamily: FONTS.PRIMARY, fontSize: "13px", color: "#9d7bb0", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._nameDisplay = this.add.text(cx, nameBoxY + 10, `"${this.sheet.name}"`, {
      fontFamily: FONTS.PRIMARY, fontSize: "22px", color: "#ffffff", resolution: 2, align: "center", wordWrap: { width: nameBoxW - 40 },
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._updateNameFontSize();

    // ── Botones de Selección / Generador ─────────────────────────────────────
    new PixelButton(this, cx, 630, "🎲 GENERAR NOMBRE ALEATORIO", () => {
      this._randomizeName();
    }, { width: 560, height: 80, fontSize: "17px" });

    new PixelButton(this, cx, 735, "✏️ ESCRIBIR NOMBRE PERSONALIZADO", () => {
      this._editName();
    }, { width: 560, height: 80, fontSize: "17px" });

    // ── Botón de Confirmación Principal ─────────────────────────────────────
    new PixelButton(this, cx, H - 160, "¡CONFIRMAR Y CONTINUAR ►!", () => {
      this._confirmAndContinue();
    }, { width: 580, height: 90, fontSize: "22px" });
  }

  _updateNameFontSize() {
    if (!this._nameDisplay) return;
    const len = this.sheet.name.length;
    if (len > 24) {
      this._nameDisplay.setFontSize("16px");
    } else if (len > 18) {
      this._nameDisplay.setFontSize("18px");
    } else {
      this._nameDisplay.setFontSize("22px");
    }
  }

  _randomizeName() {
    this.sheet.name = generateHeroName();
    SaveManager.save(this.sheet);
    if (this._nameDisplay) {
      this._nameDisplay.setText(`"${this.sheet.name}"`);
      this._updateNameFontSize();
    }
  }

  _editName() {
    const inputName = window.prompt("Escribe el nombre para tu héroe:", this.sheet.name);
    if (inputName && inputName.trim().length > 0) {
      this.sheet.name = inputName.trim().slice(0, 30);
      SaveManager.save(this.sheet);
      if (this._nameDisplay) {
        this._nameDisplay.setText(`"${this.sheet.name}"`);
        this._updateNameFontSize();
      }
    }
  }

  _confirmAndContinue() {
    SaveManager.save(this.sheet);
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.CONTROLS, { mode: "new" });
    });
  }
}
