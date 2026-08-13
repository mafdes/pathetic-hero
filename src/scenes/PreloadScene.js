/**
 * PreloadScene.js — Carga todos los assets del juego con barra de progreso pixel art.
 * Una vez completada la carga, arranca IntroScene.
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, BASE_WIDTH, BASE_HEIGHT, SCENES } from "../utils/constants.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  preload() {
    this._buildLoadingUI();

    // ── Imágenes ─────────────────────────────────────────────────────────────
    // Los assets de placeholder se cargan aquí. Se irán sustituyendo por
    // pixel art real. Phaser 4 soporta WebP, PNG, JPEG.
    this.load.image("bg_intro", "assets/images/bg_intro.png");
    this.load.image("bg_menu", "assets/images/bg_menu.png");
    this.load.image("logo", "assets/images/logo.png");

    // ── Spritesheets ──────────────────────────────────────────────────────────
    // Se añadirán cuando tengamos los sprites del personaje y NPCs.
    // this.load.spritesheet("hero_idle", "assets/images/hero_idle.png", { frameWidth: 16, frameHeight: 24 });

    // ── Audio ─────────────────────────────────────────────────────────────────
    // this.load.audio("music_menu", ["assets/audio/menu.ogg", "assets/audio/menu.mp3"]);
    // this.load.audio("sfx_confirm", ["assets/audio/confirm.ogg"]);
    // this.load.audio("sfx_cancel", ["assets/audio/cancel.ogg"]);
    // this.load.audio("sfx_cursor", ["assets/audio/cursor.ogg"]);
  }

  create() {
    // Destruir la UI de carga y arrancar la intro
    this.scene.start(SCENES.INTRO);
  }

  _buildLoadingUI() {
    const cx = BASE_WIDTH / 2;
    const cy = BASE_HEIGHT / 2;
    const barW = 160;
    const barH = 8;

    // Fondo oscuro
    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);

    // Título de carga
    this.add.text(cx, cy - 24, "CARGANDO...", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "6px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5);

    // Marco de la barra
    this.add.rectangle(cx, cy, barW + 4, barH + 4)
      .setStrokeStyle(1, COLORS.GOLD_DARK)
      .setFillStyle(COLORS.BG_DEEP);

    // Barra de progreso (se actualiza en el evento progress)
    const bar = this.add.rectangle(
      cx - barW / 2,
      cy - barH / 2,
      0,
      barH,
      COLORS.GOLD
    ).setOrigin(0, 0);

    // Porcentaje
    const pctText = this.add.text(cx, cy + 14, "0%", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "5px",
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0.5);

    // Eventos del loader
    this.load.on("progress", (value) => {
      bar.width = barW * value;
      pctText.setText(`${Math.round(value * 100)}%`);
    });
  }
}
