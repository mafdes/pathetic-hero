/**
 * AgilityScene.js — Prueba de Agilidad del Gremio (720×1280 HD Vertical)
 * MECÁNICA ORIGINAL: Esquiva de barriles en 3 carriles con drifting y sabotajes.
 * Gráficos vectoriales Phaser integrados (sin emojis).
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";
import { getVerdict } from "../../utils/helpers.js";

const TOTAL_ROUNDS = 6;

const SABOTAGE_ANNOUNCEMENTS = {
  2:  "Nivel 2. ¡Múltiples barriles!\nLos aprendices empujan 2 barriles dejando un solo carril seguro.",
  3:  "Nivel 3. ¡Barriles con Drifting!\nLos toneles cambian de carril mientras caen por la rampa.",
  4:  "Nivel 4. ¡Avalancha del almacén norte!\nVelocidad aumentada y desvíos impredecibles.",
  5:  "Nivel 5. Caos en la bodega del Gremio.\nFrecuencia extrema de barriles y desvíos múltiples.",
  6:  "Nivel 6. EVALUACIÓN FINAL DE AGILIDAD IMPOSIBLE.\nAvalancha total cubriendo todos los carriles.",
};

const FAIL_COMMENTS = [
  "Aplastado por el primer barril. El almacén no te dio ni un segundo.",
  "Agilidad de saco de papas. Los barriles ganaron con facilidad.",
  "Reflejos pesados. Calificas para guardia de puerta, pero sentado.",
  "El roble te ha dejado una marca imborrable en las costillas.",
];

export class AgilityScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.AGILITY });
  }

  init(data) {
    const startLvl = (data?.startLevel && typeof data.startLevel === 'number') ? Math.min(5, Math.max(0, data.startLevel)) : 0;
    this._challenge     = data?.challenge ?? CHALLENGES.AGILITY;
    this._sheetData     = data?.sheet ?? null;
    this._currentLevel  = startLvl + 1;
    this._maxLevels     = 6;
    this._alive         = true;
    this._inCountdown   = true;
    this._score         = startLvl;

    this._playerLane    = 1; // 0: Izquierda, 1: Centro, 2: Derecha
    this._barrels       = [];
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x191409);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Fondo Almacén de Barriles
    const gfx = this.add.graphics().setDepth(DEPTHS.BG);
    gfx.fillStyle(0x120e05, 1);
    gfx.fillRect(0, 0, W, H);

    // 3 Carriles (Lanes)
    const laneWidth = (W - 80) / 3;
    this._laneCenters = [
      40 + laneWidth * 0.5,
      40 + laneWidth * 1.5,
      40 + laneWidth * 2.5,
    ];

    // Dibujar líneas de carriles
    gfx.lineStyle(2, 0x36270b, 0.8);
    for (let i = 0; i <= 3; i++) {
      const x = 40 + i * laneWidth;
      gfx.lineBetween(x, 140, x, H - 120);
    }

    // HUD superior
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, 0xd4a017).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 04: AGILIDAD", {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#f0c040", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.text(W / 2, 160, "ESQUIVA LOS BARRILES CAMBIANDO DE CARRIL\nToca o usa las flechas [ Izquierda / Derecha ]", {
      fontFamily: FONTS.PRIMARY, fontSize: "15px", color: "#d4a017", resolution: 2, align: "center", lineSpacing: 8,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Jugador (Héroe en la parte inferior dibujado por Vector Graphics)
    this._playerY = H - 180;
    this._playerContainer = this.add.container(this._laneCenters[1], this._playerY)
      .setDepth(DEPTHS.UI + 2);

    const playerGfx = this.add.graphics();
    playerGfx.fillStyle(0x4caf77, 1);
    playerGfx.fillRoundedRect(-32, -32, 64, 64, 12);
    playerGfx.lineStyle(3, 0xffffff, 1);
    playerGfx.strokeRoundedRect(-32, -32, 64, 64, 12);
    // Escudo/Blasón interno
    playerGfx.fillStyle(0xd4a017, 1);
    playerGfx.fillTriangle(0, -18, -16, 12, 16, 12);

    this._playerContainer.add(playerGfx);

    // Hint control adaptativo
    const inputMode = this.registry.get("inputMode") ?? "keyboard";
    let hintText = "[ 🠈 / 🠊 FLECHAS ]";
    if (inputMode === "mouse") hintText = "[ CLICK EN CARRIL ]";
    else if (inputMode === "touch") hintText = "[ TOCA EL CARRIL ]";

    this.add.text(W / 2, H - 70, hintText, {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#5a5a8a", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Telón Oscuro desde frame 1
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x191409, 0.98)
      .setDepth(250).setVisible(true);

    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "120px", color: "#f0c040", resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    this._dialog = new DialogBox(this);

    // Controles de entrada (Teclado y Click/Touch por carriles)
    this.input.keyboard?.on("keydown-LEFT",  () => this._movePlayer(-1));
    this.input.keyboard?.on("keydown-RIGHT", () => this._movePlayer(1));
    this.input.keyboard?.on("keydown-A",     () => this._movePlayer(-1));
    this.input.keyboard?.on("keydown-D",     () => this._movePlayer(1));
    this.input.keyboard?.on("keydown-SPACE", () => this._handleModalAdvance());

    this.input.on("pointerdown", (pointer) => {
      if (this._dialog.isVisible()) {
        this._dialog.advance();
        return;
      }
      if (pointer.x < W / 3) this._movePlayerToLane(0);
      else if (pointer.x > (W * 2) / 3) this._movePlayerToLane(2);
      else this._movePlayerToLane(1);
    });

    this.time.delayedCall(300, () => this._beginLevel());
  }

  _handleModalAdvance() {
    if (this._dialog.isVisible()) {
      this._dialog.advance();
    }
  }

  _movePlayer(dir) {
    if (this._dialog.isVisible()) {
      this._dialog.advance();
      return;
    }
    if (!this._alive || this._inCountdown) return;
    this._movePlayerToLane(Phaser.Math.Clamp(this._playerLane + dir, 0, 2));
  }

  _movePlayerToLane(lane) {
    this._playerLane = lane;
    const targetX = this._laneCenters[lane];
    this._playerContainer.setX(targetX);
  }

  _beginLevel() {
    const announcement = SABOTAGE_ANNOUNCEMENTS[this._currentLevel];
    if (announcement) {
      this._coverPanel.setVisible(true);
      this._dialog.show(announcement, () => this._prepareLevel(), "Examinador Rotval");
    } else {
      this._prepareLevel();
    }
  }

  _prepareLevel() {
    if (!this._alive) return;
    this._clearBarrels();
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
    this._inCountdown = true;
    this._coverPanel.setVisible(true);

    this._runCountdown(() => {
      this._coverPanel.setVisible(false);
      this._inCountdown = false;
      this._spawnBarrelWave();
    });
  }

  _runCountdown(onComplete) {
    const steps = ["3", "2", "1", "¡YA!"];
    let i = 0;
    const next = () => {
      if (!this._alive) return;
      if (i >= steps.length) {
        this._countdownText.setVisible(false);
        if (onComplete) onComplete();
        return;
      }
      const text = steps[i];
      const isYa = text === "¡YA!";
      this._countdownText.setText(text)
        .setColor(isYa ? "#4caf77" : "#f0c040")
        .setScale(1.3)
        .setVisible(true);

      this.tweens.add({
        targets: this._countdownText,
        scale: 1.0,
        duration: isYa ? 200 : 350,
        ease: "Quad.easeOut",
        onComplete: () => {
          i++;
          this.time.delayedCall(isYa ? 150 : 300, next);
        },
      });
    };
    next();
  }

  _spawnBarrelWave() {
    if (!this._alive) return;
    const level = this._currentLevel;

    if (level >= 6) {
      // Nivel 6 IMPOSIBLE: Avalancha simultánea sobre los 3 carriles a la vez
      for (let lane = 0; lane < 3; lane++) {
        this._createBarrel(lane, lane, 450);
      }
      return;
    }

    const count = level === 1 ? 1 : 2;
    const stagger = level === 1 ? 400 : Math.max(180, 420 - level * 40);
    const dropDuration = level === 1 ? 1300 : level === 2 ? 1050 : level === 3 ? 880 : level === 4 ? 750 : 620;
    const hasDrift = level >= 3;

    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      const startLane = lanes[i % 3];
      let endLane = startLane;

      if (hasDrift && Math.random() < 0.6) {
        const candidates = [0, 1, 2].filter(l => l !== startLane);
        endLane = Phaser.Math.RND.pick(candidates);
      }

      this.time.delayedCall(i * stagger, () => {
        if (!this._alive || this._inCountdown) return;
        this._createBarrel(startLane, endLane, dropDuration);
      });
    }
  }

  _createBarrel(startLane, endLane, duration) {
    const W = this.scale.width;
    const startX = this._laneCenters[startLane];
    const endX   = this._laneCenters[endLane];
    const startY = 190;
    const endY   = this.scale.height - 80;

    const barrelContainer = this.add.container(startX, startY).setDepth(DEPTHS.UI + 1);

    const barrelGfx = this.add.graphics();
    // Cuerpo del barril (Madera de roble)
    barrelGfx.fillStyle(0x733d16, 1);
    barrelGfx.fillRoundedRect(-34, -34, 68, 68, 8);
    // Aros de hierro
    barrelGfx.fillStyle(0x3a3a42, 1);
    barrelGfx.fillRect(-34, -24, 68, 8);
    barrelGfx.fillRect(-34, 16, 68, 8);
    // Remaches de latón
    barrelGfx.fillStyle(0xd4a017, 1);
    barrelGfx.fillCircle(-20, -20, 3);
    barrelGfx.fillCircle(20, -20, 3);
    barrelGfx.fillCircle(-20, 20, 3);
    barrelGfx.fillCircle(20, 20, 3);
    // Borde exterior
    barrelGfx.lineStyle(3, 0x4a2408, 1);
    barrelGfx.strokeRoundedRect(-34, -34, 68, 68, 8);

    barrelContainer.add(barrelGfx);

    const barrelObj = { container: barrelContainer, startLane, endLane, done: false };
    this._barrels.push(barrelObj);

    this.tweens.add({
      targets: barrelContainer,
      x: endX,
      y: endY,
      duration,
      ease: endLane !== startLane ? "Quad.easeIn" : "Linear",
      onUpdate: () => {
        if (!this._alive || barrelObj.done) return;
        if (barrelContainer.y >= this._playerY - 44 && barrelContainer.y <= this._playerY + 44) {
          const currentLane = barrelContainer.x < W / 3 ? 0 : barrelContainer.x < (W * 2) / 3 ? 1 : 2;
          if (currentLane === this._playerLane) {
            barrelObj.done = true;
            this._failLevel();
          }
        }
      },
      onComplete: () => {
        barrelObj.done = true;
        barrelContainer.destroy();
        this._checkWaveComplete();
      },
    });
  }

  _checkWaveComplete() {
    if (!this._alive || this._inCountdown) return;
    const remaining = this._barrels.filter(b => !b.done);
    if (remaining.length === 0) {
      this._passLevel();
    }
  }

  _clearBarrels() {
    this._barrels.forEach(b => {
      if (b.container) b.container.destroy();
    });
    this._barrels = [];
  }

  _passLevel() {
    if (this._inCountdown || !this._alive) return;
    this._inCountdown = true;
    this._score = this._currentLevel;

    if (this._currentLevel >= this._maxLevels) {
      this._cheatDetected();
      return;
    }

    this._currentLevel++;
    this.cameras.main.flash(150, 240, 192, 64, true);
    this.time.delayedCall(300, () => this._beginLevel());
  }

  _cheatDetected() {
    this._alive = false;
    this._clearBarrels();
    this._coverPanel.setVisible(true);
    this._score = 5;

    const msg = "¡TRAMPAS DETECTADAS!\n\nEl Gremio no tolera la suerte divina ni la alteración del destino. Tu puntuación queda fijada en 5 / 20.";
    this._dialog.show(msg, () => this._returnToReport(5), "Tribunal del Gremio");
  }

  _failLevel() {
    this._alive = false;
    this._clearBarrels();
    this._coverPanel.setVisible(true);
    this.cameras.main.shake(300, 0.015);
    const comment = Phaser.Math.RND.pick(FAIL_COMMENTS);

    this._dialog.show(`FIN DE LA PRUEBA\n\n${comment}\n\nPuntuación: ${this._score} / 20\n\n${getVerdict(this._score)}`, () => {
      this._returnToReport(this._score);
    }, "Examinador Rotval");
  }

  _endGame(perfect = false) {
    this._alive = false;
    this._clearBarrels();
    this._coverPanel.setVisible(true);
    const finalScore = this._score;
    this._dialog.show(`¡AGILIDAD FELINA SUPERADA!\n\nPuntuación: ${finalScore} / 20\n\n${getVerdict(finalScore)}`, () => {
      this._returnToReport(finalScore);
    }, "Examinador Rotval");
  }

  _returnToReport(score) {
    this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
    this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
      this.scene.start(SCENES.GUILD_REPORT, { challenge: this._challenge, score, sheet: this._sheetData });
    });
  }
}
