/**
 * ClassSelectionScene.js — Selección de Clase por Escalones (Tiers I - IV)
 * Clases narrativas satíricas sin bonificadores.
 * Incluye sello [ RECHAZADO ] para clases denegadas (no re-seleccionables) y ajuste impecable de texto en requisitos.
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
    this._rejectedClasses = new Set(); // IDs de clases denegadas
  }

  create() {
    const saved = SaveManager.load();
    if (saved) this.sheet.fromJSON(saved);

    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    this._dialog = new DialogBox(this);

    // Escuchadores globales de avance para el cuadro modal del tribunal
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
    const headerTitle = this.add.text(cx, 45, tierData.title, {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5);
    this._container.add(headerTitle);

    const headerSub = this.add.text(cx, 90, tierData.subtitle, {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#8a7a9a", wordWrap: { width: W - 80 }, align: "center", resolution: 2, lineSpacing: 6,
    }).setOrigin(0.5);
    this._container.add(headerSub);

    const sep1 = this.add.rectangle(cx, 130, W - 60, 3, COLORS.GOLD_DARK);
    this._container.add(sep1);

    // ── Lista de Clases del Tier ─────────────────────────────────────────────
    const startY = 145;
    const itemH  = 170;
    const gapY   = 185;

    tierData.classes.forEach((cls, idx) => {
      const y = startY + idx * gapY;
      if (y + itemH > H - 100) return; // Evitar salir de pantalla en vertical

      const isRejected = this._rejectedClasses.has(cls.id);
      const avatarKey  = cls.avatarKey;
      const hasAvatar  = avatarKey && this.textures.exists(avatarKey);

      // Tarjeta Panel
      const bg = this.add.rectangle(cx, y + itemH / 2, W - 70, itemH, isRejected ? 0x220c0c : COLORS.UI_PANEL, isRejected ? 0.85 : 0.95)
        .setStrokeStyle(3, isRejected ? 0x661a1a : COLORS.UI_BORDER);
      if (!isRejected) {
        bg.setInteractive({ useHandCursor: true });
      }
      this._container.add(bg);

      // Offset X si hay avatar
      const contentLeft = hasAvatar ? cx - 180 : cx - 280;
      const contentW    = hasAvatar ? W - 220 : W - 120;

      if (hasAvatar) {
        // Thumbnail Avatar
        const thumbX = cx - 240;
        const thumbY = y + itemH / 2;
        const thumbSize = 90;

        const thumbFrame = this.add.rectangle(thumbX, thumbY, thumbSize + 4, thumbSize + 4, COLORS.BG_DARK, 1)
          .setStrokeStyle(2, COLORS.GOLD);
        this._container.add(thumbFrame);

        const thumbImg = this.add.image(thumbX, thumbY, avatarKey);
        thumbImg.setDisplaySize(thumbSize, thumbSize);
        this._container.add(thumbImg);
      }

      // Línea 1: Nombre de la clase
      const titleFontSz = cls.name.length > 26 ? "15px" : cls.name.length > 20 ? "17px" : "19px";
      const title = this.add.text(contentLeft, y + 24, cls.name, {
        fontFamily: FONTS.PRIMARY, fontSize: titleFontSz, color: isRejected ? "#885555" : "#f0c040", resolution: 2,
      }).setOrigin(0, 0.5);
      this._container.add(title);

      // Sello [ RECHAZADO ] si fue denegado previamente
      if (isRejected) {
        const stamp = this.add.text(cx + 270, y + 24, "[ RECHAZADO ]", {
          fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#ff4444", stroke: "#000000", strokeThickness: 3, resolution: 2,
        }).setOrigin(1, 0.5);
        this._container.add(stamp);
      }

      // Línea 2: Requisitos exigidos
      const req = this.add.text(contentLeft, y + 56, `[ ${cls.reqText} ]`, {
        fontFamily: FONTS.PRIMARY, fontSize: "12px", color: isRejected ? "#664444" : "#9d7bb0", wordWrap: { width: contentW - 40 }, resolution: 2,
      }).setOrigin(0, 0.5);
      this._container.add(req);

      // Línea 3: Descripción humorística narrativa
      const desc = this.add.text(contentLeft, y + 114, cls.description, {
        fontFamily: FONTS.PRIMARY, fontSize: "13px", color: isRejected ? "#776666" : "#f0e6d3", wordWrap: { width: contentW - 20 }, lineSpacing: 4, resolution: 2,
      }).setOrigin(0, 0.5);
      this._container.add(desc);

      if (!isRejected) {
        bg.on("pointerover", () => bg.setStrokeStyle(3, COLORS.GOLD));
        bg.on("pointerout",  () => bg.setStrokeStyle(3, COLORS.UI_BORDER));
        bg.on("pointerdown", () => {
          if (!this._dialog.isVisible()) {
            this._trySelectClass(cls, tierData);
          }
        });
      }
    });

    // ── Botón "Rendirse y mirar Clases Inferiores" ────────────────────────────
    if (tierData.giveUpText) {
      const giveUpBtn = new PixelButton(this, cx, H - 65, tierData.giveUpText, () => {
        if (!this._dialog.isVisible()) {
          this._currentTierIndex = Math.min(CLASS_TIERS.length - 1, this._currentTierIndex + 1);
          this._renderTierUI();
        }
      }, { width: 620, height: 72, fontSize: "15px" });

      this._container.add(giveUpBtn._bg);
      this._container.add(giveUpBtn._label);
      this._container.add(giveUpBtn._cursor);
    }
  }

  _trySelectClass(cls, tierData) {
    if (tierData.tier === 4) {
      // ¡Asignación final en Tier IV!
      this.sheet.heroClass = cls.id;
      this.sheet.archetype = cls.archetype;
      SaveManager.save(this.sheet);

      this._dialog.show(
        `¡ASIGNACIÓN OBLIGATORIA CONCEDIDA!\n\nEl Tribunal te concede la clase de consolación:\n${cls.name}.\n\n(0 Bonus de Atributos - El gremio ha tirado la toalla).\n\n¡Comienza tu desastrosa aventura!`,
        () => {
          this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
          this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
            this.scene.start(SCENES.HERO_SUMMARY);
          });
        },
        "Tribunal del Gremio"
      );
    } else {
      // Rechazo sarcástico ineludible para Tiers I, II y III
      this._rejectedClasses.add(cls.id);

      this._dialog.show(
        `SOLICITUD RECHAZADA\n\n${cls.rejection}\n\nRequisito Exigido: Puntuación de 20 Impecable en la prueba correspondiente.`,
        () => {
          this._renderTierUI(); // Actualizar UI para estampar el sello [ RECHAZADO ]
        },
        "Tribunal del Gremio"
      );
    }
  }
}
