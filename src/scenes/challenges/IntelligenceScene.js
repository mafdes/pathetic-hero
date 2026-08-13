/**
 * IntelligenceScene.js — Prueba de Inteligencia del Gremio (720×1280 HD Vertical)
 * MECÁNICA ORIGINAL: El Archivista Corrupto — Simon Says con 6 Runas, Trampas Rojas, Mezcla, Inversión y Baldosas Boca Abajo.
 * Con avance de diálogo modal garantizado por click en cualquier punto de la pantalla.
 */

import * as Phaser from "phaser";
import {
  COLORS, FONTS, SCENES, TIMING, DEPTHS, CHALLENGES,
} from "../../utils/constants.js";
import { DialogBox } from "../../ui/DialogBox.js";
import { getVerdict } from "../../utils/helpers.js";

const TOTAL_ROUNDS = 20;

const RUNES = [
  { id: 0, name: "Sol",      icon: "☀️", color: 0xf59e0b },
  { id: 1, name: "Luna",     icon: "🌙", color: 0x3b82f6 },
  { id: 2, name: "Estrella", icon: "⭐️", color: 0xef4444 },
  { id: 3, name: "Ojo",      icon: "👁️", color: 0x10b981 },
  { id: 4, name: "Gema",     icon: "💎", color: 0x8b5cf6 },
  { id: 5, name: "Corona",   icon: "👑", color: 0xec4899 },
];

const SABOTAGE_ANNOUNCEMENTS = {
  2:  "Nivel 2. ¡LUCES ROJAS TRAMPA!\nSi una runa parpadea en ROJO, NO debes pulsarla.",
  3:  "Nivel 3. ¡SABOTAJE MEZCLA!\nLas baldosas cambiarán de posición tras la demostración.",
  4:  "Nivel 4. ¡SABOTAJE INVERSIÓN!\nRepite la secuencia AL REVÉS (del final al principio).",
  5:  "Nivel 5. ¡BALDOSAS BOCA ABAJO!\nLas runas se tapan como cartas ciegas cuando te toca pulsar.",
  6:  "Nivel 6+. ¡CAOS ABSOLUTO DE ARCHIVO!\nTrampas rojas, mezcla, orden inverso y cartas a ciegas.",
};

const FAIL_COMMENTS = [
  "Memoria de pez hervido. No recuerdas ni tu propio nombre.",
  "En cuanto las baldosas cambiaron de sitio te perdiste por completo.",
  "Caíste en la trampa roja del Archivista sin dudarlo.",
  "Amnesia administrativa ante la primera orden inversa.",
];

export class IntelligenceScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.INTELLIGENCE });
  }

  init(data) {
    this._challenge     = data?.challenge ?? CHALLENGES.INTELLIGENCE;
    this._sheetData     = data?.sheet ?? null;
    this._currentLevel  = 1;
    this._maxLevels     = TOTAL_ROUNDS;
    this._alive         = true;
    this._inCountdown   = true;
    this._score         = 0;

    this._sequence        = [];
    this._expectedInput   = [];
    this._playerInput     = [];
    this._tilePositions   = [0, 1, 2, 3, 4, 5];
    this._isBoardFaceDown = false;
    this._isShowing       = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(0x0e1424);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Fondo Biblioteca Arcana
    const gfx = this.add.graphics().setDepth(DEPTHS.BG);
    gfx.fillStyle(0x070c17, 1);
    gfx.fillRect(0, 0, W, H);
    gfx.fillStyle(0x192742, 1);
    gfx.fillRect(0, 0, 30, H);
    gfx.fillRect(W - 30, 0, 30, H);

    // HUD superior
    this.add.rectangle(W / 2, 55, W - 60, 80, COLORS.UI_PANEL, 0.95)
      .setStrokeStyle(3, 0x3b82f6).setDepth(DEPTHS.UI_BG);

    this.add.text(W / 2, 38, "SALA 05: INTELIGENCIA", {
      fontFamily: FONTS.PRIMARY, fontSize: "24px", color: "#60a5fa", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._levelText = this.add.text(W / 2, 74, "NIVEL 1 / 20", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this._instructionText = this.add.text(W / 2, 160, "MEMORIZA LA SECUENCIA DE RUNAS...", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#60a5fa", resolution: 2, align: "center", lineSpacing: 8, wordWrap: { width: W - 80 },
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // ── Tablero de 6 Baldosas Rúnicas (2 filas x 3 columnas) ────────────────
    this._tiles = [];
    const gridCols = 3;
    const gridRows = 2;
    const startX   = W / 2 - 190;
    const startY   = H / 2 - 80;
    const gapX     = 190;
    const gapY     = 190;
    const tileSize = 160;

    RUNES.forEach((rune, idx) => {
      const col = idx % gridCols;
      const row = Math.floor(idx / gridCols);
      const x   = startX + col * gapX;
      const y   = startY + row * gapY;

      const bg = this.add.rectangle(x, y, tileSize, tileSize, COLORS.UI_PANEL, 0.98)
        .setStrokeStyle(4, 0x3b82f6)
        .setInteractive({ useHandCursor: true })
        .setDepth(DEPTHS.UI);

      const icon = this.add.text(x, y, rune.icon, { fontSize: "54px" })
        .setOrigin(0.5).setDepth(DEPTHS.UI + 1);

      bg.on("pointerdown", () => this._onTileClicked(rune.id));

      this._tiles[rune.id] = { bg, icon, rune, x, y };
    });

    // Telón Oscuro desde frame 1
    this._coverPanel = this.add.rectangle(W / 2, H / 2, W, H, 0x0e1424, 0.98)
      .setDepth(250).setVisible(true);

    this._countdownText = this.add.text(W / 2, H / 2, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "120px", color: "#60a5fa", resolution: 2,
    }).setOrigin(0.5).setDepth(251).setVisible(false);

    this._dialog = new DialogBox(this);

    // Escuchador global de Click para avanzar el modal de diálogo en cualquier punto
    this.input.on("pointerdown", () => {
      if (this._dialog.isVisible()) {
        this._dialog.advance();
      }
    });

    // Entrada Teclado (Números 1 a 6 y Espacio)
    this.input.keyboard?.on("keydown", (evt) => {
      if (this._dialog.isVisible()) {
        this._dialog.advance();
        return;
      }
      const num = parseInt(evt.key, 10);
      if (!isNaN(num) && num >= 1 && num <= 6) {
        const runeId = this._tilePositions[num - 1];
        this._onTileClicked(runeId);
      }
    });

    this.time.delayedCall(300, () => this._beginLevel());
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
    this._levelText.setText(`NIVEL  ${this._currentLevel} / 20`);
    this._inCountdown = true;
    this._isShowing   = false;
    this._isBoardFaceDown = false;
    this._tilePositions = [0, 1, 2, 3, 4, 5];
    this._updateTileLayout();

    this._coverPanel.setVisible(true);

    this._runCountdown(() => {
      this._coverPanel.setVisible(false);
      this._inCountdown = false;
      this._startRuneSequence();
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
        .setColor(isYa ? "#4caf77" : "#60a5fa")
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

  _startRuneSequence() {
    const level = this._currentLevel;
    const len = Math.min(7, 3 + Math.floor((level - 1) / 3));
    const hasRedTraps = level >= 2;
    const isReverse   = level >= 4;
    const hideTiles   = level >= 5;

    this._sequence = [];
    for (let i = 0; i < len; i++) {
      const runeId = Phaser.Math.Between(0, 5);
      const isTrap = hasRedTraps && Math.random() < 0.35;
      this._sequence.push({ runeId, isTrap });
    }

    const validRunes = this._sequence.filter(item => !item.isTrap).map(item => item.runeId);
    this._expectedInput = isReverse ? validRunes.reverse() : validRunes;
    this._playerInput = [];

    this._isShowing = true;
    this._instructionText.setText("MEMORIZA LA SECUENCIA DE RUNAS...");

    this._playSequence(0, () => {
      if (!this._alive) return;
      this._isShowing = false;

      // Mezcla de baldosas a partir de Nivel 3
      if (level >= 3) {
        this._tilePositions.sort(() => Math.random() - 0.5);
        this._updateTileLayout();
      }

      // Baldosas boca abajo a partir de Nivel 5
      if (hideTiles) {
        this._isBoardFaceDown = true;
        this._updateTileLayout();
      }

      const hintMsg = isReverse
        ? "¡REPITE EN ORDEN INVERSO (DEL FINAL AL PRINCIPIO)!"
        : "¡REPITE LA SECUENCIA DE RUNAS AHORA!";
      this._instructionText.setText(hintMsg);
    });
  }

  _playSequence(index, onComplete) {
    if (!this._alive || index >= this._sequence.length) {
      if (onComplete) onComplete();
      return;
    }

    const item = this._sequence[index];
    const tile = this._tiles[item.runeId];
    const strokeColor = item.isTrap ? 0xef4444 : 0x10b981;

    tile.bg.setStrokeStyle(6, strokeColor);
    tile.bg.setFillStyle(item.isTrap ? 0x551111 : 0x114422);

    this.time.delayedCall(450, () => {
      tile.bg.setStrokeStyle(4, 0x3b82f6);
      tile.bg.setFillStyle(COLORS.UI_PANEL);

      this.time.delayedCall(200, () => {
        this._playSequence(index + 1, onComplete);
      });
    });
  }

  _updateTileLayout() {
    const W = this.scale.width;
    const H = this.scale.height;
    const gridCols = 3;
    const startX   = W / 2 - 190;
    const startY   = H / 2 - 80;
    const gapX     = 190;
    const gapY     = 190;

    this._tilePositions.forEach((runeId, slotIdx) => {
      const col = slotIdx % gridCols;
      const row = Math.floor(slotIdx / gridCols);
      const x   = startX + col * gapX;
      const y   = startY + row * gapY;

      const tile = this._tiles[runeId];
      tile.bg.setPosition(x, y);
      tile.icon.setPosition(x, y);

      if (this._isBoardFaceDown) {
        tile.icon.setText("❓");
        tile.bg.setStrokeStyle(4, 0x6a4e8a);
      } else {
        tile.icon.setText(tile.rune.icon);
        tile.bg.setStrokeStyle(4, 0x3b82f6);
      }
    });
  }

  _onTileClicked(runeId) {
    if (this._dialog.isVisible()) {
      this._dialog.advance();
      return;
    }
    if (!this._alive || this._inCountdown || this._isShowing) return;

    const tile = this._tiles[runeId];
    tile.bg.setStrokeStyle(6, 0xf59e0b);
    this.time.delayedCall(150, () => {
      tile.bg.setStrokeStyle(4, this._isBoardFaceDown ? 0x6a4e8a : 0x3b82f6);
    });

    const expectedRuneId = this._expectedInput[this._playerInput.length];

    if (runeId === expectedRuneId) {
      this._playerInput.push(runeId);
      if (this._playerInput.length === this._expectedInput.length) {
        this._passLevel();
      }
    } else {
      this._failLevel();
    }
  }

  _passLevel() {
    if (this._inCountdown || !this._alive) return;
    this._inCountdown = true;
    this._score = this._currentLevel;

    if (this._currentLevel >= this._maxLevels) {
      this._endGame(true);
      return;
    }

    this._currentLevel++;
    this.cameras.main.flash(150, 96, 165, 250, true);
    this.time.delayedCall(300, () => this._beginLevel());
  }

  _failLevel() {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const comment = Phaser.Math.RND.pick(FAIL_COMMENTS);
    this._dialog.show(`FIN DE LA PRUEBA\n\n${comment}\n\nPuntuación: ${this._score} / 20\n\n${getVerdict(this._score)}`, () => {
      this._returnToReport(this._score);
    }, "Examinador Rotval");
  }

  _endGame(perfect = false) {
    this._alive = false;
    this._coverPanel.setVisible(true);
    const finalScore = this._score;
    this._dialog.show(`¡INTELECTO BRILLANTE SUPERADO!\n\nPuntuación: ${finalScore} / 20\n\n${getVerdict(finalScore)}`, () => {
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
