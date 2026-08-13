/**
 * ClassSelectionScene.js — Selección de Clase del Héroe (720×1280 HD Vertical)
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
import { CharacterSheet } from "../systems/CharacterSheet.js";
import { SaveManager } from "../systems/SaveManager.js";
import { PixelButton } from "../ui/PixelButton.js";

const HERO_CLASSES = [
  {
    id: "barbarian",
    name: "BÁRBARO MEDIOCRE",
    icon: "🪓",
    desc: "Gran fuerza bruta, cero elegancia.\nSuperó las pruebas a cabezazos.",
    perks: "HP +50% | Fuerza +4 | Inteligencia -2",
  },
  {
    id: "mage",
    name: "MAGO BECARIO",
    icon: "🧙",
    desc: "Especialista en papeleo místico\ny pociones caducadas.",
    perks: "Magia +40% | Inteligencia +5 | Armadura -3",
  },
  {
    id: "rogue",
    name: "PÍCARO SIN GRACIA",
    icon: "🗡️",
    desc: "Huye antes de que empiece la pelea.\nExperto en disculpas.",
    perks: "Velocidad +35% | Crítico +3 | HP -20%",
  },
];

export class ClassSelectionScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.CLASS_SELECTION });
    this.sheet = new CharacterSheet();
    this._selectedIndex = 0;
  }

  create() {
    const saved = SaveManager.load();
    if (saved) this.sheet.fromJSON(saved);

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // ── Cabecera ──────────────────────────────────────────────────────────────
    this.add.text(cx, 60, "TRIBUNAL DEL GREMIO", {
      fontFamily: FONTS.PRIMARY, fontSize: "28px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(cx, 110, "ASIGNACIÓN DE CLASE OFICIAL", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#6a4e8a", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(cx, 140, W - 60, 3, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    // Nombre y expediente
    this.add.text(cx, 175, `${this.sheet.name}`, {
      fontFamily: FONTS.PRIMARY, fontSize: "20px", color: "#c8a97a", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Tarjetas de Clase ──────────────────────────────────────────────────
    const startY = 240;
    const cardH = 220;
    const gapY = 240;

    this._cards = HERO_CLASSES.map((cls, idx) => {
      const y = startY + idx * gapY;
      const bg = this.add.rectangle(cx, y + cardH / 2, W - 80, cardH, COLORS.UI_PANEL, 0.95)
        .setStrokeStyle(3, COLORS.UI_BORDER)
        .setInteractive({ useHandCursor: true })
        .setDepth(DEPTHS.UI);

      const icon = this.add.text(cx - 230, y + 50, cls.icon, { fontSize: "44px" })
        .setOrigin(0.5).setDepth(DEPTHS.UI + 1);

      const title = this.add.text(cx - 170, y + 30, cls.name, {
        fontFamily: FONTS.PRIMARY, fontSize: "20px", color: "#f0e6d3", resolution: 2,
      }).setOrigin(0, 0.5).setDepth(DEPTHS.UI + 1);

      const desc = this.add.text(cx - 170, y + 85, cls.desc, {
        fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#8a7a9a", wordWrap: { width: 400 }, lineSpacing: 6, resolution: 2,
      }).setOrigin(0, 0.5).setDepth(DEPTHS.UI + 1);

      const perks = this.add.text(cx - 170, y + 150, cls.perks, {
        fontFamily: FONTS.PRIMARY, fontSize: "13px", color: "#d4a017", resolution: 2,
      }).setOrigin(0, 0.5).setDepth(DEPTHS.UI + 1);

      bg.on("pointerdown", () => {
        this._selectedIndex = idx;
        this._updateSelection();
      });

      return { bg, title, cls };
    });

    this._updateSelection();

    // ── Botón Confirmar Clase ───────────────────────────────────────────────
    new PixelButton(this, cx, H - 90, "CONFIRMAR Y COMENSAR ►", () => this._confirmClass(), {
      width: 540, height: 86, fontSize: "22px",
    });
  }

  _updateSelection() {
    this._cards.forEach((c, idx) => {
      const isSel = idx === this._selectedIndex;
      c.bg.setStrokeStyle(4, isSel ? COLORS.GOLD : COLORS.UI_BORDER);
      c.bg.setFillStyle(isSel ? 0x3d245c : COLORS.UI_PANEL);
      c.title.setColor(isSel ? "#f0c040" : "#f0e6d3");
    });
  }

  _confirmClass() {
    const chosen = HERO_CLASSES[this._selectedIndex];
    this.sheet.heroClass = chosen.id;
    SaveManager.save(this.sheet);

    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      // Avanzar a la aventura o volver al expediente con resumen
      this.scene.start(SCENES.GUILD_REPORT);
    });
  }
}
