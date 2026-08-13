/**
 * NameSelectionScene.js — Registro Inicial de Nombre del Aspirante (720×1280 HD Vertical)
 * Teclado arcade integrado 100% en Phaser (sin inputs HTML ni prompts de navegador).
 * Campo de texto en blanco por defecto con cursor parpadeante, soporte de teclado físico y teclado virtual táctil.
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS,
} from "../utils/constants.js";
import { CharacterSheet } from "../systems/CharacterSheet.js";
import { SaveManager } from "../systems/SaveManager.js";
import { PixelButton } from "../ui/PixelButton.js";
import { generateHeroName } from "../utils/helpers.js";

const KEYBOARD_ROWS = [
  ["A", "B", "C", "D", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N"],
  ["O", "P", "Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z", " ", "⌫"],
];

export class NameSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.NAME_SELECTION });
    this.sheet = new CharacterSheet();
    this._currentName = "";
    this._cursorVisible = true;
    this._cursorTimer = null;
  }

  create() {
    const saved = SaveManager.load();
    if (saved) {
      this.sheet.fromJSON(saved);
      this._currentName = this.sheet.name || "";
    } else {
      this._currentName = ""; // En blanco por defecto
    }

    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    this._buildUI();
    this._setupPhysicalKeyboard();
  }

  _buildUI() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // ── Cabecera ──────────────────────────────────────────────────────────────
    this.add.text(cx, 80, "GREMIO DE HÉROES", {
      fontFamily: FONTS.PRIMARY, fontSize: "28px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(cx, 135, "REGISTRO DEL ASPIRANTE", {
      fontFamily: FONTS.PRIMARY, fontSize: "20px", color: "#f0c040", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(cx, 170, W - 80, 3, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    this.add.text(cx, 210, "Escribe tu nombre con el teclado o usa los botones", {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#6a4e8a", resolution: 2, align: "center",
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Campo de Entrada de Nombre Centrado (100% Canvas) ─────────────────────
    const nameBoxY = 285;
    const nameBoxW = W - 80;
    const nameBoxH = 100;

    this.add.rectangle(cx, nameBoxY, nameBoxW + 16, nameBoxH + 16, COLORS.BG_DARK, 1)
      .setStrokeStyle(4, COLORS.GOLD_DARK).setDepth(DEPTHS.UI_BG);

    this.add.rectangle(cx, nameBoxY, nameBoxW, nameBoxH, COLORS.UI_PANEL, 0.98)
      .setStrokeStyle(3, COLORS.GOLD).setDepth(DEPTHS.UI_BG + 1);

    this.add.text(cx, nameBoxY - 32, "NOMBRE DEL HÉROES EN LAS ACTAS", {
      fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#9d7bb0", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._nameDisplayText = this.add.text(cx, nameBoxY + 8, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "22px", color: "#ffffff", resolution: 2, align: "center",
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Cursor Parpadeante
    this._cursorTimer = this.time.addEvent({
      delay: 450,
      loop: true,
      callback: () => {
        this._cursorVisible = !this._cursorVisible;
        this._updateNameDisplay();
      },
    });

    this._updateNameDisplay();

    // ── Teclado Virtual Arcade 100% Phaser (4 filas x 7 botones) ──────────────
    const kbStartY = 420;
    const keyW     = 78;
    const keyH     = 68;
    const gapX     = 86;
    const gapY     = 76;
    const rowStartX = cx - (3 * gapX);

    KEYBOARD_ROWS.forEach((row, rIdx) => {
      row.forEach((char, cIdx) => {
        const x = rowStartX + cIdx * gapX;
        const y = kbStartY + rIdx * gapY;

        let labelText = char === " " ? "ESP" : char;
        let btnW = keyW;

        const btnBg = this.add.rectangle(x, y, btnW, keyH, COLORS.UI_PANEL, 0.95)
          .setStrokeStyle(2, COLORS.UI_BORDER)
          .setInteractive({ useHandCursor: true })
          .setDepth(DEPTHS.UI);

        const btnLabel = this.add.text(x, y, labelText, {
          fontFamily: FONTS.PRIMARY, fontSize: "18px", color: char === "⌫" ? "#ff4444" : "#f0e6d3", resolution: 2,
        }).setOrigin(0.5).setDepth(DEPTHS.UI + 1);

        btnBg.on("pointerover", () => {
          btnBg.setStrokeStyle(2, COLORS.GOLD);
          btnLabel.setColor("#f0c040");
        });

        btnBg.on("pointerout", () => {
          btnBg.setStrokeStyle(2, COLORS.UI_BORDER);
          btnLabel.setColor(char === "⌫" ? "#ff4444" : "#f0e6d3");
        });

        btnBg.on("pointerdown", () => {
          if (char === "⌫") {
            this._backspace();
          } else {
            this._appendChar(char);
          }
        });
      });
    });

    // ── Botones de Acción (Random & Limpiar) ──────────────────────────────────
    const actionY = kbStartY + 4 * gapY + 10;

    new PixelButton(this, cx - 150, actionY, "🎲 RANDOM", () => {
      this._randomizeName();
    }, { width: 270, height: 64, fontSize: "15px" });

    new PixelButton(this, cx + 150, actionY, "🗑️ BORRAR", () => {
      this._clearName();
    }, { width: 270, height: 64, fontSize: "15px" });

    // ── Botón de Confirmación Principal ─────────────────────────────────────
    new PixelButton(this, cx, H - 120, "¡CONFIRMAR Y CONTINUAR ►!", () => {
      this._confirmAndContinue();
    }, { width: 580, height: 86, fontSize: "20px" });
  }

  _setupPhysicalKeyboard() {
    this.input.keyboard?.on("keydown", (evt) => {
      if (evt.key === "Backspace") {
        this._backspace();
      } else if (evt.key === "Enter") {
        this._confirmAndContinue();
      } else if (evt.key.length === 1) {
        // Permitir letras, números y espacios
        const char = evt.key.toUpperCase();
        if (/^[A-Z0-9 ÁÉÍÓÚÑ]$/.test(char)) {
          this._appendChar(char);
        }
      }
    });
  }

  _appendChar(char) {
    if (this._currentName.length >= 24) return;
    this._currentName += char;
    this._updateNameDisplay();
  }

  _backspace() {
    if (this._currentName.length > 0) {
      this._currentName = this._currentName.slice(0, -1);
      this._updateNameDisplay();
    }
  }

  _clearName() {
    this._currentName = "";
    this._updateNameDisplay();
  }

  _randomizeName() {
    this._currentName = generateHeroName();
    this._updateNameDisplay();
  }

  _updateNameDisplay() {
    if (!this._nameDisplayText) return;

    const cursor = this._cursorVisible ? "_" : " ";
    const displayStr = this._currentName.length > 0
      ? `${this._currentName}${cursor}`
      : `[ TECLEA TU NOMBRE ]${cursor}`;

    this._nameDisplayText.setText(displayStr);
    this._nameDisplayText.setColor(this._currentName.length > 0 ? "#ffffff" : "#6a4e8a");

    // Auto-escalado dinámico de fuente según longitud
    const len = this._currentName.length;
    if (len > 20) {
      this._nameDisplayText.setFontSize("16px");
    } else if (len > 14) {
      this._nameDisplayText.setFontSize("18px");
    } else {
      this._nameDisplayText.setFontSize("22px");
    }
  }

  _confirmAndContinue() {
    // Si lo deja en blanco, asignamos un nombre aleatorio automático de héroe
    if (this._currentName.trim().length === 0) {
      this._currentName = generateHeroName();
    }

    this.sheet.name = this._currentName.trim();
    SaveManager.save(this.sheet);

    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.CONTROLS, { mode: "new" });
    });
  }
}
