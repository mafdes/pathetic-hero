/**
 * GuildReportScene.js — Expediente de Admisión del Gremio de Héroes
 *
 * Muestra las 5 pruebas con su estado (PENDIENTE / puntuación obtenida).
 * El jugador puede seleccionar cualquier prueba pendiente para realizarla.
 * Una vez completadas las 5, muestra el veredicto y permite solicitar clase.
 *
 * Los datos se cargan/guardan desde SaveManager.
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES, CHALLENGE_LABELS } from "../utils/constants.js";
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
    // Si venimos de una prueba con resultado, lo registramos
    if (data?.challenge && data?.score !== undefined) {
      this.sheet.setAttribute(data.challenge, data.score);
      SaveManager.save(this.sheet);
    }
  }

  create() {
    // Cargar datos guardados
    const saved = SaveManager.load();
    if (saved) {
      this.sheet.fromJSON(saved);
    } else {
      // Nueva partida: generar nombre si está vacío
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
    this.add.text(cx, 10, "GREMIO DE HEROES", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "7px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(cx, 21, "EXPEDIENTE DE ADMISION", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "4px",
      color: "#6a4e8a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(cx, 28, W - 8, 1, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI);

    // ── Nombre del aspirante ──────────────────────────────────────────────────
    this.add.text(cx, 36, `Aspirante: ${this.sheet.name}`, {
      fontFamily: FONTS.PRIMARY,
      fontSize: "4px",
      color: "#c8a97a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Lista de pruebas ──────────────────────────────────────────────────────
    const startY = 52;
    const rowH = 20;

    CHALLENGE_ORDER.forEach((id, i) => {
      const score = this.sheet.attributes[id];
      const completed = score !== null;
      const y = startY + i * rowH;
      const label = CHALLENGE_LABELS[id];

      // Fondo de fila alternado
      const rowBg = this.add.rectangle(cx, y, W - 12, 16, completed ? 0x1a2e1a : COLORS.UI_PANEL, 0.7)
        .setStrokeStyle(1, completed ? COLORS.SUCCESS : COLORS.UI_BORDER)
        .setDepth(DEPTHS.UI_BG);

      // Nombre de la prueba
      this.add.text(10, y, label, {
        fontFamily: FONTS.PRIMARY,
        fontSize: "5px",
        color: completed ? "#4caf77" : "#f0e6d3",
        resolution: 2,
      }).setOrigin(0, 0.5).setDepth(DEPTHS.UI);

      if (completed) {
        // Puntuación obtenida
        this.add.text(W - 10, y, `${score} / 20`, {
          fontFamily: FONTS.PRIMARY,
          fontSize: "5px",
          color: score >= 10 ? "#4caf77" : "#ff4444",
          resolution: 2,
        }).setOrigin(1, 0.5).setDepth(DEPTHS.UI);
      } else {
        // Botón para iniciar prueba
        const btn = this.add.text(W - 10, y, "[INICIAR]", {
          fontFamily: FONTS.PRIMARY,
          fontSize: "5px",
          color: "#d4a017",
          resolution: 2,
        }).setOrigin(1, 0.5).setDepth(DEPTHS.UI)
          .setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => btn.setColor("#f0c040"));
        btn.on("pointerout", () => btn.setColor("#d4a017"));
        btn.on("pointerdown", () => this._openChallenge(id));
      }
    });

    // ── Separador ─────────────────────────────────────────────────────────────
    const bottomY = startY + CHALLENGE_ORDER.length * rowH + 4;
    this.add.rectangle(cx, bottomY, W - 8, 1, COLORS.GOLD_DARK)
      .setDepth(DEPTHS.UI);

    // ── Estado general ────────────────────────────────────────────────────────
    if (this.sheet.isComplete()) {
      const avg = Math.round(this.sheet.getAverage());
      const verdict = getVerdict(avg);

      this.add.text(cx, bottomY + 10, `VEREDICTO: ${verdict}`, {
        fontFamily: FONTS.PRIMARY,
        fontSize: "5px",
        color: "#d4a017",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);

      this.add.text(cx, bottomY + 22, `Media: ${avg} / 20`, {
        fontFamily: FONTS.PRIMARY,
        fontSize: "5px",
        color: avg >= 10 ? "#4caf77" : "#ff4444",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);

      // TODO: botón solicitar clase
    } else {
      const remaining = CHALLENGE_ORDER.filter(id => this.sheet.attributes[id] === null).length;
      this.add.text(cx, bottomY + 12, `Pruebas pendientes: ${remaining}`, {
        fontFamily: FONTS.PRIMARY,
        fontSize: "5px",
        color: "#6a4e8a",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);
    }

    // ── Botón volver al menú ──────────────────────────────────────────────────
    new PixelButton(
      this, cx, H - 12,
      "< MENU",
      () => this._goToMenu(),
      { width: 80, height: 12, fontSize: 5 }
    );
  }

  _openChallenge(id) {
    const sceneKey = CHALLENGE_SCENE_MAP[id];
    if (!sceneKey) {
      console.warn(`[GuildReport] No hay escena para la prueba: ${id}`);
      return;
    }
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(sceneKey, {
        challenge: id,
        sheet: this.sheet.toJSON(),
      });
    });
  }

  _goToMenu() {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.MAIN_MENU);
    });
  }
}
