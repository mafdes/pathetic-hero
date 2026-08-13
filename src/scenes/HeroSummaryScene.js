/**
 * HeroSummaryScene.js — Ficha del Héroe y Antesala de la Mazmorra (720×1280 HD Vertical)
 * Muestra el resumen oficial del héroe registrado: Nombre definitivo, Clase asignada, Atributos y Veredicto.
 * Incluye modal "¡PRÓXIMAMENTE! Fase 2D RPG" al pulsar "¡ENTRAR EN LA MAZMORRA ►!".
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS,
  CHALLENGES, CHALLENGE_LABELS,
} from "../utils/constants.js";
import { CharacterSheet } from "../systems/CharacterSheet.js";
import { SaveManager } from "../systems/SaveManager.js";
import { CLASS_TIERS } from "../data/classes.js";
import { DialogBox } from "../ui/DialogBox.js";
import { PixelButton } from "../ui/PixelButton.js";
import { getVerdict } from "../utils/helpers.js";

export class HeroSummaryScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.HERO_SUMMARY });
    this.sheet = new CharacterSheet();
  }

  create() {
    const saved = SaveManager.load();
    if (saved) this.sheet.fromJSON(saved);

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    this._dialog = new DialogBox(this);

    // Escuchadores de avance para el cuadro modal
    this.input.on("pointerdown", () => {
      if (this._dialog.isVisible()) {
        this._dialog.advance();
      }
    });

    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this._dialog.isVisible()) {
        this._dialog.advance();
      }
    });

    this.input.keyboard?.on("keydown-ENTER", () => {
      if (this._dialog.isVisible()) {
        this._dialog.advance();
      }
    });

    this._renderUI();
  }

  _renderUI() {
    if (this._container) this._container.destroy(true);

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    this._container = this.add.container(0, 0).setDepth(DEPTHS.UI);

    // ── Cabecera ──────────────────────────────────────────────────────────────
    const title = this.add.text(cx, 55, "FICHA OFICIAL DE ADMISIÓN", {
      fontFamily: FONTS.PRIMARY, fontSize: "26px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5);
    this._container.add(title);

    const subtitle = this.add.text(cx, 95, "Antesala de la Mazmorra", {
      fontFamily: FONTS.PRIMARY, fontSize: "15px", color: "#6a4e8a", resolution: 2,
    }).setOrigin(0.5);
    this._container.add(subtitle);

    const sep1 = this.add.rectangle(cx, 120, W - 60, 3, COLORS.GOLD_DARK);
    this._container.add(sep1);

    // ── SECCIÓN 1: NOMBRE DEL HÉROE REGISTRADO ────────────────────────────────
    const nameBoxY = 165;
    const nameBoxW = W - 70;
    const nameBoxH = 70;

    const nameBox = this.add.rectangle(cx, nameBoxY, nameBoxW, nameBoxH, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, COLORS.GOLD);
    this._container.add(nameBox);

    const nameStr = `ASPIRANTE REGISTRADO:  "${this.sheet.name}"`;
    const fontSz  = nameStr.length > 32 ? "14px" : nameStr.length > 24 ? "16px" : "18px";

    this._nameText = this.add.text(cx, nameBoxY, nameStr, {
      fontFamily: FONTS.PRIMARY, fontSize: fontSz, color: "#f0c040", resolution: 2, align: "center", wordWrap: { width: nameBoxW - 40 },
    }).setOrigin(0.5);
    this._container.add(this._nameText);

    // ── SECCIÓN 2: CLASE SELECCIONADA Y SÁTIRA ────────────────────────────────
    const classBoxY = 295;
    const heroClassData = this._getHeroClassData(this.sheet.heroClass);

    const classBox = this.add.rectangle(cx, classBoxY, W - 70, 140, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, COLORS.GOLD_DARK);
    this._container.add(classBox);

    const classTitle = this.add.text(cx - 260, classBoxY - 40, `CLASE:  ${heroClassData.name}`, {
      fontFamily: FONTS.PRIMARY, fontSize: "20px", color: "#f0c040", resolution: 2,
    }).setOrigin(0, 0.5);
    this._container.add(classTitle);

    const classDesc = this.add.text(cx - 260, classBoxY + 15, heroClassData.description, {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#f0e6d3", wordWrap: { width: W - 130 }, lineSpacing: 6, resolution: 2,
    }).setOrigin(0, 0.5);
    this._container.add(classDesc);

    // ── SECCIÓN 3: ATRIBUTOS Y DICTAMEN DEL TRIBUNAL ─────────────────────────
    const statsBoxY = 550;
    const statsBox = this.add.rectangle(cx, statsBoxY, W - 70, 310, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, COLORS.UI_BORDER);
    this._container.add(statsBox);

    const statsHeader = this.add.text(cx, statsBoxY - 125, "ATRIBUTOS OFICIALES DEL GREMIO", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5);
    this._container.add(statsHeader);

    const order = [
      CHALLENGES.DEXTERITY,
      CHALLENGES.CONSTITUTION,
      CHALLENGES.STRENGTH,
      CHALLENGES.AGILITY,
      CHALLENGES.INTELLIGENCE,
    ];

    order.forEach((id, idx) => {
      const score = this.sheet.attributes[id] ?? 0;
      const label = CHALLENGE_LABELS[id];
      const y = statsBoxY - 80 + idx * 36;

      const statName = this.add.text(cx - 250, y, label, {
        fontFamily: FONTS.PRIMARY, fontSize: "15px", color: "#c8a97a", resolution: 2,
      }).setOrigin(0, 0.5);
      this._container.add(statName);

      const statVal = this.add.text(cx + 250, y, `${score} / 20`, {
        fontFamily: FONTS.PRIMARY, fontSize: "15px", color: score >= 10 ? "#4caf77" : "#ff4444", resolution: 2,
      }).setOrigin(1, 0.5);
      this._container.add(statVal);
    });

    const avg = Math.round(this.sheet.getAverage());
    const verdict = getVerdict(avg);

    const verdictText = this.add.text(cx, statsBoxY + 115, `VEREDICTO GLOBAL: ${verdict} (${avg}/20)`, {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#d4a017", resolution: 2, wordWrap: { width: W - 100 }, align: "center",
    }).setOrigin(0.5);
    this._container.add(verdictText);

    // ── BOTÓN PRINCIPAL DE ENTRADA A LA MAZMORRA ────────────────────────────
    const playBtn = new PixelButton(this, cx, H - 150, "¡ENTRAR EN LA MAZMORRA ►!", () => {
      if (!this._dialog.isVisible()) {
        this._enterDungeon();
      }
    }, { width: 580, height: 90, fontSize: "22px" });

    this._container.add(playBtn._bg);
    this._container.add(playBtn._label);
    this._container.add(playBtn._cursor);

    // Botón Cambiar Clase
    const changeClassBtn = new PixelButton(this, cx, H - 55, "< CAMBIAR CLASE", () => {
      if (!this._dialog.isVisible()) {
        this.scene.start(SCENES.CLASS_SELECTION);
      }
    }, { width: 360, height: 56, fontSize: "15px" });

    this._container.add(changeClassBtn._bg);
    this._container.add(changeClassBtn._label);
    this._container.add(changeClassBtn._cursor);
  }

  _getHeroClassData(classId) {
    if (!classId) {
      return {
        name: "Aspirante sin Clase",
        description: "Aún no has reclamado ningún título del Tribunal del Gremio.",
      };
    }

    for (const tierObj of CLASS_TIERS) {
      const found = tierObj.classes.find(c => c.id === classId);
      if (found) return found;
    }

    return {
      name: classId,
      description: "Título concedido por decreto del Tribunal del Gremio.",
    };
  }

  _enterDungeon() {
    SaveManager.save(this.sheet);
    const clsName = this._getHeroClassData(this.sheet.heroClass).name;

    this._dialog.show(
      `¡PRÓXIMAMENTE!\n\nFASE 2D RPG (v0.3)\n\nEl Tribunal del Gremio está limpiando las trágicas trampas de la mazmorra.\n\n¡Tu héroe "${this.sheet.name}" (${clsName}) aguarda victorioso en la antesala!`,
      null,
      "Examinador Rotval"
    );
  }
}
