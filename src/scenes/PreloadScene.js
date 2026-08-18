/**
 * PreloadScene.js — Carga de assets con barra de progreso pixel art (960×540)
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, FONT_SIZES, BASE_WIDTH, BASE_HEIGHT, SCENES } from "../utils/constants.js";
import { buildAllEnemyTextureFrames } from "../graphics/EnemySpritesBuilder.js";
import { EnemyAnimationManager } from "../systems/EnemyAnimationManager.js";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.PRELOAD });
  }

  preload() {
    this._buildLoadingUI();

    // ── Precargar Assets Dinámicos de Enemigos (Imágenes + Mapa) ───────────────
    EnemyAnimationManager.preloadEnemyAssets(this);

    // ── Mapa de Tiled y Tileset (Carga los 8 niveles) ─────────────────────────
    this.load.image("dungeon_tiles", "assets/tilesets/dungeon_tiles.png");
    this.load.spritesheet("dungeon_tiles_sheet", "assets/tilesets/dungeon_tiles.png", { frameWidth: 32, frameHeight: 32 });
    
    for (let i = 1; i <= 8; i++) {
      this.load.tilemapTiledJSON(`level${i}_tiled`, `assets/maps/nivel${i}.json`);
    }

    // ── Sprites de Cofres, Llaves, Trampas y Monedas ───────────────────────────
    this.load.image("item_chest", "assets/images/items/chest.png");
    this.load.image("item_key", "assets/images/items/key.png");
    this.load.image("item_trap", "assets/images/items/trap.png");
    this.load.spritesheet("item_coin", "assets/images/items/Coin.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("item_coin_sparkle", "assets/images/items/Coin_Sparkle.png", { frameWidth: 32, frameHeight: 32 });

    // ── Avatares de Clases de Tier IV ──────────────────────────────────────────
    this.load.image("avatar_parchment_licker", "assets/images/classes/parchment_licker.jpg");
    this.load.image("avatar_manure_carrier", "assets/images/classes/manure_carrier.jpg");
    this.load.image("avatar_punch_sponge", "assets/images/classes/punch_sponge.jpg");
    this.load.image("avatar_flea_bag", "assets/images/classes/flea_bag.jpg");
    this.load.image("avatar_curb_tripper", "assets/images/classes/curb_tripper.jpg");

  }

  create() {
    // Registrar animaciones dinámicas desde el manifest de enemigos
    EnemyAnimationManager.registerAnimations(this);

    // Generar texturas de enemigos pixel art fallback
    this.scene.start(SCENES.INTRO);
  }

  _buildLoadingUI() {
    const cx = BASE_WIDTH / 2;
    const cy = BASE_HEIGHT / 2;
    const barW = 480;
    const barH = 24;

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);

    this.add.text(cx, cy - 60, "CARGANDO...", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.HEADING,
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5);

    // Marco
    this.add.rectangle(cx, cy, barW + 8, barH + 8)
      .setStrokeStyle(2, COLORS.GOLD_DARK)
      .setFillStyle(COLORS.BG_DEEP);

    // Barra
    const bar = this.add.rectangle(
      cx - barW / 2, cy - barH / 2,
      0, barH, COLORS.GOLD
    ).setOrigin(0, 0);

    // Porcentaje
    const pctText = this.add.text(cx, cy + 36, "0%", {
      fontFamily: FONTS.PRIMARY,
      fontSize: FONT_SIZES.BODY,
      color: "#f0e6d3",
      resolution: 2,
    }).setOrigin(0.5);

    this.load.on("progress", (value) => {
      bar.width = barW * value;
      pctText.setText(`${Math.round(value * 100)}%`);
    });
  }
}
