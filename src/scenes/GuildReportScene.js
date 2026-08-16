/**
 * GuildReportScene.js — Expediente de Admisión (720×1280 HD Vertical)
 * Incluye botón temporal de autocompletado aleatorio (DEV) posicionado abajo y transición a Selección de Clase.
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS,
  CHALLENGES, CHALLENGE_LABELS,
} from "../utils/constants.js";
import { CharacterSheet } from "../systems/CharacterSheet.js";
import { SaveManager } from "../systems/SaveManager.js";
import { PixelButton } from "../ui/PixelButton.js";
import { generateHeroName, getVerdict, randInt } from "../utils/helpers.js";

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

    // ── Cabecera HD ──────────────────────────────────────────────────────────
    this.add.text(cx, 60, "GREMIO DE HÉROES", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "30px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(cx, 105, "EXPEDIENTE DE ADMISIÓN", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "16px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(cx, 130, W - 60, 3, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    // Nombre aspirante con auto-escalado de fuente para evitar desbordamientos
    const nameStr = `Aspirante: "${this.sheet.name}"`;
    const fontSz = nameStr.length > 30 ? "14px" : nameStr.length > 22 ? "16px" : "18px";
    this.add.text(cx, 160, nameStr, {
      fontFamily: FONTS.PRIMARY,
      fontSize: fontSz,
      color: "#c8a97a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(cx, 185, W - 60, 3, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    // ── Filas de pruebas HD (720px ancho) ─────────────────────────────────
    const startY = 210;
    const rowH   = 86;
    const rowW   = W - 60;
    const rowX   = 30;

    CHALLENGE_ORDER.forEach((id, i) => {
      const score     = this.sheet.attributes[id];
      const completed = score !== null;
      const y         = startY + i * rowH;
      const label     = CHALLENGE_LABELS[id];

      // Fondo fila
      this.add.rectangle(cx, y + rowH / 2 - 6, rowW, rowH - 12,
        completed ? 0x0d2e14 : COLORS.UI_PANEL, 0.9)
        .setStrokeStyle(2, completed ? COLORS.SUCCESS : COLORS.UI_BORDER)
        .setDepth(DEPTHS.UI_BG);

      // Nombre prueba
      this.add.text(rowX + 20, y + rowH / 2 - 6, label, {
        fontFamily: FONTS.PRIMARY,
        fontSize: "18px",
        color: completed ? "#4caf77" : "#f0e6d3",
        resolution: 2,
      }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

      if (completed) {
        // Puntuación
        this.add.text(W - rowX - 20, y + rowH / 2 - 6, `${score} / 20`, {
          fontFamily: FONTS.PRIMARY,
          fontSize: "18px",
          color: score >= 10 ? "#4caf77" : "#ff4444",
          resolution: 2,
        }).setOrigin(1, 0.5).setDepth(DEPTHS.UI);
      } else {
        // Botón iniciar
        const btn = this.add.text(W - rowX - 20, y + rowH / 2 - 6, "[ INICIAR ]", {
          fontFamily: FONTS.PRIMARY,
          fontSize: "18px",
          color: "#d4a017",
          resolution: 2,
        }).setOrigin(1, 0.5).setDepth(DEPTHS.UI)
          .setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => btn.setColor("#f0c040"));
        btn.on("pointerout",  () => btn.setColor("#d4a017"));
        btn.on("pointerdown", () => this._openChallenge(id));
      }
    });

    // ── Separador inferior y Veredicto / Acción de Clase ────────────────────
    const bottomY = startY + CHALLENGE_ORDER.length * rowH + 10;
    this.add.rectangle(cx, bottomY, W - 60, 3, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    if (this.sheet.isComplete()) {
      const avg     = Math.round(this.sheet.getAverage());
      const verdict = getVerdict(avg);

      this.add.text(cx, bottomY + 30, `VEREDICTO: ${verdict} (${avg}/20)`, {
        fontFamily: FONTS.PRIMARY,
        fontSize: "16px",
        color: "#d4a017",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);

      // Botón SELECCIONAR CLASE
      new PixelButton(this, cx, bottomY + 110, "SELECCIONAR CLASE ►",
        () => this._goToClassSelection(),
        { width: 560, height: 86, fontSize: "22px" }
      );
    } else {
      const remaining = CHALLENGE_ORDER.filter(id => this.sheet.attributes[id] === null).length;
      this.add.text(cx, bottomY + 35, `Pruebas pendientes: ${remaining}`, {
        fontFamily: FONTS.PRIMARY,
        fontSize: "16px",
        color: "#6a4e8a",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);
    }

    // ── Nivel de Inicio de Pruebas DEV (Stepper 1-6) ──────────────────────
    if (this._debugStartLevel === undefined) this._debugStartLevel = 0;

    const levelBoxY = H - 165;
    this.add.text(cx - 100, levelBoxY, "NIVEL INICIO DEV:", {
      fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#6a4e8a", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    const minusBtn = this.add.text(cx + 40, levelBoxY, "[-]", {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI).setInteractive({ useHandCursor: true });

    const lvlText = this.add.text(cx + 85, levelBoxY, `LVL ${this._debugStartLevel + 1}`, {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#f0c040", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    const plusBtn = this.add.text(cx + 130, levelBoxY, "[+]", {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI).setInteractive({ useHandCursor: true });

    minusBtn.on("pointerdown", () => {
      this._debugStartLevel = Math.max(0, this._debugStartLevel - 1);
      lvlText.setText(`LVL ${this._debugStartLevel + 1}`);
    });

    plusBtn.on("pointerdown", () => {
      this._debugStartLevel = Math.min(5, this._debugStartLevel + 1);
      lvlText.setText(`LVL ${this._debugStartLevel + 1}`);
    });

    // ── Botón Temporal de Autocompletado Aleatorio (DEV) ABAJO ──────────────
    const devBtn = this.add.text(cx - 130, H - 120, "[ 🎲 AUTO-COMPLETAR DEV ]", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "12px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI)
      .setInteractive({ useHandCursor: true });

    devBtn.on("pointerover", () => devBtn.setColor("#ffffff"));
    devBtn.on("pointerout",  () => devBtn.setColor("#d4a017"));
    devBtn.on("pointerdown", () => this._fillRandomScores());

    const dungeonDevBtn = this.add.text(cx + 130, H - 120, "[ ⚡ SALTO MAZMORRA DEV ]", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "12px",
      color: "#4caf77",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI)
      .setInteractive({ useHandCursor: true });

    dungeonDevBtn.on("pointerover", () => dungeonDevBtn.setColor("#ffffff"));
    dungeonDevBtn.on("pointerout",  () => dungeonDevBtn.setColor("#4caf77"));
    dungeonDevBtn.on("pointerdown", () => this._devJumpToMap());

    // ── Volver al Menú ────────────────────────────────────────────────────────
    new PixelButton(this, cx, H - 55, "< MENU PRINCIPAL",
      () => this._goToMenu(),
      { width: 360, height: 58, fontSize: "16px" }
    );
  }

  _fillRandomScores() {
    CHALLENGE_ORDER.forEach(id => {
      this.sheet.attributes[id] = randInt(1, 5);
    });
    SaveManager.save(this.sheet);
    this.scene.restart();
  }

  _devJumpToMap() {
    this._fillRandomScores();
    this.scene.start(SCENES.MAP, { levelId: 1 });
  }

  _openChallenge(id) {
    const sceneKey = CHALLENGE_SCENE_MAP[id];
    if (!sceneKey) return;
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(sceneKey, { challenge: id, sheet: this.sheet.toJSON(), startLevel: this._debugStartLevel || 0 });
    });
  }

  _goToClassSelection() {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.CLASS_SELECTION);
    });
  }

  _goToMenu() {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.MAIN_MENU);
    });
  }
}
