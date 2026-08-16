import { COLORS, FONTS, DEPTHS } from "../utils/constants.js";
import { SoundFx } from "../systems/SoundFx.js";

export class LevelUpModal {
  constructor(scene, playerStats, onComplete) {
    this.scene = scene;
    this.playerStats = playerStats;
    this.onComplete = onComplete;
    this.tempPoints = playerStats.attributePoints;
    this.allocated = { strength: 0, dexterity: 0, constitution: 0, wisdom: 0, agility: 0 };
    this.container = null;

    this.show();
  }

  show() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    SoundFx.playVictory();

    this.container = this.scene.add.container(0, 0).setDepth(DEPTHS.UI + 50);

    // Overlay oscuro
    const overlay = this.scene.add.rectangle(cx, cy, W, H, 0x000000, 0.82)
      .setInteractive();
    this.container.add(overlay);

    // Marco del Modal
    const modalW = W - 50;
    const modalH = 580;
    const panel = this.scene.add.rectangle(cx, cy, modalW, modalH, 0x140824, 1)
      .setStrokeStyle(3, 0xf0c040);
    this.container.add(panel);

    // Título
    const title = this.scene.add.text(cx, cy - 250, `✨ ¡SUBIDA DE NIVEL! (NIVEL ${this.playerStats.level})`, {
      fontFamily: FONTS.PRIMARY, fontSize: "20px", color: "#f0c040", resolution: 2,
    }).setOrigin(0.5);

    this.ptsText = this.scene.add.text(cx, cy - 215, `Puntos de Atributo Disponibles: ${this.tempPoints}`, {
      fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#4caf77", resolution: 2,
    }).setOrigin(0.5);

    this.container.add([title, this.ptsText]);

    // Lista de Atributos
    const attrs = [
      { key: 'strength', name: '🗡️ FUERZA', desc: 'Aumenta el Daño Físico' },
      { key: 'dexterity', name: '🎯 DESTREZA', desc: 'Aumenta el % de Golpe Crítico' },
      { key: 'constitution', name: '🛡️ CONSTITUCIÓN', desc: '+5 PV Máximos y Actuales' },
      { key: 'wisdom', name: '🔮 SABIDURÍA', desc: '+4 PM Máximos, Actuales y Magia' },
      { key: 'agility', name: '🏃 AGILIDAD', desc: 'Aumenta Esquiva e Iniciativa' },
    ];

    this.valTexts = {};
    const startY = cy - 160;
    const gapY = 64;

    attrs.forEach((attr, idx) => {
      const y = startY + idx * gapY;

      // Fila fondo
      const rowBg = this.scene.add.rectangle(cx, y, modalW - 30, 54, 0x221038, 1)
        .setStrokeStyle(1, 0x3d2d54);
      this.container.add(rowBg);

      // Nombre y desc
      const label = this.scene.add.text(cx - modalW / 2 + 30, y - 14, attr.name, {
        fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#f0e6d3", resolution: 2,
      });

      const desc = this.scene.add.text(cx - modalW / 2 + 30, y + 6, attr.desc, {
        fontFamily: FONTS.PRIMARY, fontSize: "10px", color: "#a08cb8", resolution: 2,
      });
      this.container.add([label, desc]);

      // Valor actual con tope /20
      const currentVal = this.playerStats[attr.key];
      const valTxt = this.scene.add.text(cx + 40, y, `${currentVal}/20`, {
        fontFamily: FONTS.PRIMARY, fontSize: "15px", color: "#f0c040", resolution: 2,
      }).setOrigin(0.5);
      this.valTexts[attr.key] = valTxt;
      this.container.add(valTxt);

      // Botón +
      const plusBtn = this.scene.add.rectangle(cx + 95, y, 32, 32, 0x3d2d54, 1)
        .setStrokeStyle(2, 0x4caf77)
        .setInteractive({ useHandCursor: true });
      const plusTxt = this.scene.add.text(cx + 95, y, "+", {
        fontFamily: FONTS.PRIMARY, fontSize: "18px", color: "#4caf77", resolution: 2,
      }).setOrigin(0.5);

      plusBtn.on("pointerdown", () => this.addPoint(attr.key));

      // Botón -
      const minusBtn = this.scene.add.rectangle(cx + 135, y, 32, 32, 0x3d2d54, 1)
        .setStrokeStyle(2, 0xe53935)
        .setInteractive({ useHandCursor: true });
      const minusTxt = this.scene.add.text(cx + 135, y, "-", {
        fontFamily: FONTS.PRIMARY, fontSize: "18px", color: "#e53935", resolution: 2,
      }).setOrigin(0.5);

      minusBtn.on("pointerdown", () => this.removePoint(attr.key));

      this.container.add([plusBtn, plusTxt, minusBtn, minusTxt]);
    });

    // Botón Confirmar
    const confirmBtn = this.scene.add.rectangle(cx, cy + 225, modalW - 60, 50, 0x2e7d32, 1)
      .setStrokeStyle(2, 0xd4a017)
      .setInteractive({ useHandCursor: true });

    const confirmTxt = this.scene.add.text(cx, cy + 225, "⚔️ CONFIRMAR REPARTO", {
      fontFamily: FONTS.PRIMARY, fontSize: "15px", color: "#ffffff", resolution: 2,
    }).setOrigin(0.5);

    confirmBtn.on("pointerdown", () => this.confirm());

    this.container.add([confirmBtn, confirmTxt]);
  }

  addPoint(key) {
    const currentVal = this.playerStats[key] + this.allocated[key];
    if (this.tempPoints <= 0 || currentVal >= 20) return;
    SoundFx.playButtonClick();
    this.tempPoints--;
    this.allocated[key]++;
    this.updateUI(key);
  }

  removePoint(key) {
    if (this.allocated[key] <= 0) return;
    SoundFx.playButtonClick();
    this.tempPoints++;
    this.allocated[key]--;
    this.updateUI(key);
  }

  updateUI(key) {
    const currentVal = this.playerStats[key] + this.allocated[key];
    if (this.valTexts[key]) {
      this.valTexts[key].setText(`${currentVal}/20`);
      this.valTexts[key].setColor(this.allocated[key] > 0 ? "#4caf77" : (currentVal >= 20 ? "#ffeb3b" : "#f0c040"));
    }
    if (this.ptsText) {
      this.ptsText.setText(`Puntos de Atributo Disponibles: ${this.tempPoints}`);
    }
  }

  confirm() {
    SoundFx.playVictory();

    // Aplicar asignaciones al PlayerStats
    Object.keys(this.allocated).forEach(key => {
      const count = this.allocated[key];
      for (let i = 0; i < count; i++) {
        this.playerStats.allocateAttribute(key);
      }
    });

    // Guardar los puntos sobrantes si hubiera
    this.playerStats.attributePoints = this.tempPoints;

    this.container.destroy();
    if (this.onComplete) this.onComplete();
  }
}
