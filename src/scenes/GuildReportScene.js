/**
 * GuildReportScene.js — Expediente de Admisión (960×540)
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, FONT_SIZES, SCENES, TIMING, DEPTHS,
  CHALLENGES, CHALLENGE_LABELS,
} from "../utils/constants.js";
import { CharacterSheet } from "../systems/CharacterSheet.js";
import { SaveManager } from "../systems/SaveManager.js";
import { PixelButton } from "../ui/PixelButton.js";
import { generateHeroName, getVerdict } from "../utils/helpers.js";

const CHALLENGE_ORDER = [
  CHALLENGES.DEXTERITY,
  CHALLENGES.CONSTITUTION,
  CHALLENGES.STRENGTH,
  CHALLENGES.AGILITY,
  CHALLENGES.INTELLIGENCE,
];

const CHALLENGE_SCENE_MAP = {
  [CHALLENGES.DEXTERITY]:    SCENES.DEXTERITY,
  [CHALLENGES.CONSTITUTION]: SCENES.CONSTITUTION,
  [CHALLENGES.STRENGTH]:     SCENES.STRENGTH,
  [CHALLENGES.AGILITY]:      SCENES.AGILITY,
  [CHALLENGES.INTELLIGENCE]: SCENES.INTELLIGENCE,
};

export class GuildReportScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GUILD_REPORT });
    this.sheet = new CharacterSheet();
  }

  init(data) {
    if (data?.challenge && data?.score !== undefined) {
      this.sheet.setAttribute(data.challenge, data.score);
      SaveManager.save(this.sheet);
    }
  }

  create() {
    const saved = SaveManager.load();
    if (saved) {
      this.sheet.fromJSON(saved);
    } else {
      if (!this.sheet.name) {
        this.sheet.name = generateHeroName();
        SaveManager.save(this.sheet);
      }
    }

    this._buildUI();
    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);
  }

  _buildUI() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    // ── Cabecera ──────────────────────────────────────────────────────────────
    this.add.text(cx, 36, "GREMIO DE HEROES", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "28px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(cx, 70, "EXPEDIENTE DE ADMISION", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.SMALL,
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(cx, 88, W - 40, 2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    // Nombre aspirante
    this.add.text(cx, 112, `Aspirante:  ${this.sheet.name}`, {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.SMALL,
      color: "#c8a97a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(cx, 132, W - 40, 2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    // ── Filas de pruebas ──────────────────────────────────────────────────────
    const startY = 160;
    const rowH   = 56;
    const rowW   = W - 80;
    const rowX   = 40;

    CHALLENGE_ORDER.forEach((id, i) => {
      const score     = this.sheet.attributes[id];
      const completed = score !== null;
      const y         = startY + i * rowH;
      const label     = CHALLENGE_LABELS[id];

      // Fondo fila
      this.add.rectangle(cx, y + rowH / 2 - 4, rowW, rowH - 8,
        completed ? 0x0d2e14 : COLORS.UI_PANEL, 0.8)
        .setStrokeStyle(1, completed ? COLORS.SUCCESS : COLORS.UI_BORDER)
        .setDepth(DEPTHS.UI_BG);

      // Nombre prueba
      this.add.text(rowX + 16, y + rowH / 2 - 4, label, {
        fontFamily: FONTS.PRIMARY,
        fontSize: FONT_SIZES.BODY,
        color: completed ? "#4caf77" : "#f0e6d3",
        resolution: 2,
      }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

      if (completed) {
        // Puntuación
        this.add.text(W - rowX - 16, y + rowH / 2 - 4, `${score}  /  20`, {
          fontFamily: FONTS.PRIMARY,
          fontSize: FONT_SIZES.BODY,
          color: score >= 10 ? "#4caf77" : "#ff4444",
          resolution: 2,
        }).setOrigin(1, 0.5).setDepth(DEPTHS.UI);
      } else {
        // Botón iniciar
        const btn = this.add.text(W - rowX - 16, y + rowH / 2 - 4, "[ INICIAR ]", {
          fontFamily: FONTS.PRIMARY,
          fontSize: FONT_SIZES.BODY,
          color: "#d4a017",
          resolution: 2,
        }).setOrigin(1, 0.5).setDepth(DEPTHS.UI)
          .setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => btn.setColor("#f0c040"));
        btn.on("pointerout",  () => btn.setColor("#d4a017"));
        btn.on("pointerdown", () => this._openChallenge(id));
      }
    });

    // ── Separador inferior ────────────────────────────────────────────────────
    const bottomY = startY + CHALLENGE_ORDER.length * rowH + 8;
    this.add.rectangle(cx, bottomY, W - 40, 2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    if (this.sheet.isComplete()) {
      const avg     = Math.round(this.sheet.getAverage());
      const verdict = getVerdict(avg);

      this.add.text(cx, bottomY + 32, `VEREDICTO DEL TRIBUNAL:`, {
        fontFamily: FONTS.PRIMARY,
        fontSize: FONT_SIZES.SMALL,
        color: "#6a4e8a",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);

      this.add.text(cx, bottomY + 60, verdict, {
        fontFamily: FONTS.PRIMARY,
        fontSize: FONT_SIZES.HEADING,
        color: "#d4a017",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);

      this.add.text(cx, bottomY + 92, `Media final: ${avg} / 20`, {
        fontFamily: FONTS.PRIMARY,
        fontSize: FONT_SIZES.BODY,
        color: avg >= 10 ? "#4caf77" : "#ff4444",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);
    } else {
      const remaining = CHALLENGE_ORDER.filter(id => this.sheet.attributes[id] === null).length;
      this.add.text(cx, bottomY + 48, `Pruebas pendientes: ${remaining}`, {
        fontFamily: FONTS.PRIMARY,
        fontSize: FONT_SIZES.BODY,
        color: "#6a4e8a",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);
    }

    // ── Volver ────────────────────────────────────────────────────────────────
    new PixelButton(this, cx, H - 36, "< MENU",
      () => this._goToMenu(),
      { width: 200, height: 44, fontSize: FONT_SIZES.BODY }
    );
  }

  _openChallenge(id) {
    const sceneKey = CHALLENGE_SCENE_MAP[id];
    if (!sceneKey) return;
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(sceneKey, { challenge: id, sheet: this.sheet.toJSON() });
    });
  }

  _goToMenu() {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.MAIN_MENU);
    });
  }
}
