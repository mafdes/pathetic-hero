import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, DEPTHS } from "../utils/constants.js";
import { PlayerStats } from "../systems/PlayerStats.js";
import { DialogBox } from "../ui/DialogBox.js";
import { SaveManager } from "../systems/SaveManager.js";
import { CharacterSheet } from "../systems/CharacterSheet.js";
import { getLevel } from "../data/levels.js";
import { SoundFx } from "../systems/SoundFx.js";

export class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MAP });
  }

  create(data) {
    this.sheet = new CharacterSheet();
    const saved = SaveManager.load();
    if (saved) this.sheet.fromJSON(saved);

    this.playerStats = new PlayerStats(this.sheet.attributes);
    this.playerName = this.sheet.name || "Aspirante";
    this._dialogBox = new DialogBox(this);

    // Input handlers for dialog
    this.input.on("pointerdown", () => {
      if (this._dialogBox.isVisible()) this._dialogBox.advance();
    });
    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this._dialogBox.isVisible()) this._dialogBox.advance();
    });
    this.input.keyboard?.on("keydown-ENTER", () => {
      if (this._dialogBox.isVisible()) this._dialogBox.advance();
    });

    // Check All-Zero Denial Gate
    if (this.playerStats.isAllZero()) {
      this._showAllZeroGate();
      return;
    }

    // Cargar datos del nivel (por defecto nivel 1)
    const levelId = data?.levelId ?? 1;
    this._levelData = getLevel(levelId);

    // Inventario del jugador en esta mazmorra
    this.playerInventory = { keys: 0 };

    // Zonas reservadas para UI (usadas en _buildDungeon para el offsetY)
    this._HEADER_H = 96;   // px que ocupa el header
    this._FOOTER_H = 64;   // px que ocupa el footer

    this._setupTextures();
    this._buildDungeon();
    this._createUI();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Activar BGM de exploración en bucle
    SoundFx.playExplorationBgm();

    // ── Escuchar el retorno del combate (sleep/wake) ──────────────────────
    this.events.on('wake', () => {
      SoundFx.playExplorationBgm();
    });

    this.events.on('combatEnd', (result) => {
      if (!this._pendingCombat) return;
      const { ent, c, r } = this._pendingCombat;
      this._pendingCombat = null;
      if (result.won) {
        delete this.entities[`${c},${r}`];
        if (ent.sprite) ent.sprite.destroy();
        if (ent.badge) ent.badge.destroy();
        this._movePlayerTo(c, r);
      } else {
        // Derrota → ir al informe del gremio
        this.scene.start(SCENES.GUILD_REPORT);
      }
    });
  }

  _showAllZeroGate() {
    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this._dialogBox.show(
      "¡SOLICITUD DENEGADA POR EL TRIBUNAL!\n\n'Tras revisión exhaustiva de su expediente, enviarle a una mazmorra con 0 en todos los atributos sería un crimen ecológico contra los monstruos.'\n\nEl Gremio le prohíbe poner un pie fuera de las oficinas.",
      () => {
        this.scene.start(SCENES.GUILD_REPORT);
      },
      "Tribunal de Admisión"
    );
  }

  _setupTextures() {
    const size = 56;
    this.tileSize = size;
    const g = this.add.graphics();

    const theme = this._levelData.theme ?? {
      floor:       0x22143a,
      floorBorder: 0x3d285c,
      wall:        0x0f071c,
      wallBorder:  0x6a4e8a,
      wallFill:    0x2d1b46,
    };

    if (this.textures.exists('tile-floor')) this.textures.remove('tile-floor');
    if (this.textures.exists('tile-wall'))  this.textures.remove('tile-wall');

    // Floor
    g.clear();
    g.fillStyle(theme.floor, 1);
    g.fillRect(0, 0, size, size);
    g.lineStyle(2, theme.floorBorder, 0.7);
    g.strokeRect(0, 0, size, size);
    g.generateTexture('tile-floor', size, size);

    // Wall
    g.clear();
    g.fillStyle(theme.wall, 1);
    g.fillRect(0, 0, size, size);
    g.lineStyle(3, theme.wallBorder, 0.8);
    g.strokeRect(2, 2, size - 4, size - 4);
    g.fillStyle(theme.wallFill, 1);
    g.fillRect(8, 8, size - 16, size - 16);
    g.generateTexture('tile-wall', size, size);

    // Player
    g.clear();
    g.fillStyle(COLORS.GOLD, 1);
    g.fillCircle(size / 2, size / 2, size / 2.5);
    g.lineStyle(3, COLORS.WHITE, 0.9);
    g.strokeCircle(size / 2, size / 2, size / 2.5);
    g.generateTexture('entity-player', size, size);

    // Goblin
    g.clear();
    g.fillStyle(0x388e3c, 1);
    g.fillCircle(size / 2, size / 2, size / 2.6);
    g.fillStyle(0xe53935, 1);
    g.fillCircle(size / 2 - 6, size / 2 - 5, 4);
    g.fillCircle(size / 2 + 6, size / 2 - 5, 4);
    g.lineStyle(3, 0x1b5e20, 1);
    g.strokeCircle(size / 2, size / 2, size / 2.6);
    g.generateTexture('entity-goblin', size, size);

    // Door
    g.clear();
    g.fillStyle(0x5d4037, 1);
    g.fillRect(4, 4, size - 8, size - 8);
    g.lineStyle(3, COLORS.GOLD, 0.9);
    g.strokeRect(4, 4, size - 8, size - 8);
    g.fillStyle(COLORS.GOLD, 1);
    g.fillCircle(size - 14, size / 2, 4);
    g.generateTexture('entity-door', size, size);

    // Trap
    g.clear();
    g.lineStyle(3, 0xb0bec5, 0.9);
    g.strokeCircle(size / 2, size / 2, 14);
    g.lineBetween(size / 2 - 10, size / 2, size / 2 + 10, size / 2);
    g.lineBetween(size / 2, size / 2 - 10, size / 2, size / 2 + 10);
    g.generateTexture('entity-trap', size, size);

    // Rune
    g.clear();
    g.fillStyle(0x7b1fa2, 0.5);
    g.fillCircle(size / 2, size / 2, 16);
    g.lineStyle(3, 0xba68c8, 1);
    g.strokeCircle(size / 2, size / 2, 16);
    g.generateTexture('entity-rune', size, size);

    // Fountain
    g.clear();
    g.fillStyle(0x0288d1, 0.7);
    g.fillCircle(size / 2, size / 2, 16);
    g.lineStyle(3, 0x4fc3f7, 1);
    g.strokeCircle(size / 2, size / 2, 16);
    g.generateTexture('entity-fountain', size, size);

    // Stairs
    g.clear();
    g.fillStyle(COLORS.GOLD, 1);
    for (let i = 0; i < 4; i++) {
      g.fillRect(8 + i * 8, 8 + i * 8, size - 16 - i * 8, 6);
    }
    g.generateTexture('entity-stairs', size, size);

    // Key (llave dorada)
    g.clear();
    g.fillStyle(0xf0c040, 1);
    g.fillCircle(size / 2 - 8, size / 2 - 4, 10);   // cabeza de llave
    g.lineStyle(4, 0xd4a017, 1);
    g.strokeCircle(size / 2 - 8, size / 2 - 4, 10);
    g.fillStyle(0xf0c040, 1);
    g.fillRect(size / 2, size / 2 - 2, 18, 5);       // mango
    g.fillRect(size / 2 + 12, size / 2 + 3, 4, 5);   // diente
    g.fillRect(size / 2 + 17, size / 2 + 3, 4, 5);   // diente
    g.generateTexture('entity-key', size, size);

    // Chest (cofre de madera y oro)
    g.clear();
    g.fillStyle(0x795548, 1);
    g.fillRect(6, 12, size - 12, size - 20);
    g.lineStyle(3, 0xf0c040, 1);
    g.strokeRect(6, 12, size - 12, size - 20);
    g.fillStyle(0xf0c040, 1);
    g.fillRect(size / 2 - 4, size / 2 - 2, 8, 8);
    g.generateTexture('entity-chest', size, size);

    g.destroy();
  }

  _buildDungeon() {
    const level = this._levelData;

    // ── Mapa estructural (ASCII, solo # y tiles de un único char) ──────────
    this.mapLayout = level.map;
    this.rows      = level.map.length;
    this.cols      = level.map[0].length;
    this.tileSize  = level.tileSize ?? 52;

    const W = this.scale.width;
    const H = this.scale.height;
    const mapWidth  = this.cols * this.tileSize;
    const mapHeight = this.rows * this.tileSize;

    // Centrar el mapa en el espacio disponible entre header y footer
    const availH = H - this._HEADER_H - this._FOOTER_H;
    this.offsetX = (W - mapWidth) / 2;
    this.offsetY = this._HEADER_H + Math.max(0, (availH - mapHeight) / 2);

    this.grid         = [];
    this.entities     = {};
    this.fogTiles     = {};
    this.visitedTiles = new Set();
    this.playerPos    = { x: 1, y: 1 };
    this.isMoving     = false;
    this.visionRadius = 4;

    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      const line = this.mapLayout[r];
      for (let c = 0; c < this.cols; c++) {
        const char = line[c];
        const wx = this.offsetX + c * this.tileSize + this.tileSize / 2;
        const wy = this.offsetY + r * this.tileSize + this.tileSize / 2;

        // ── Tile base ─────────────────────────────────────────────────────
        if (char === '#') {
          this.add.image(wx, wy, 'tile-wall');
          this.grid[r][c] = { type: 'wall' };
        } else {
          this.add.image(wx, wy, 'tile-floor');
          this.grid[r][c] = { type: 'floor' };
        }

        // ── Capa de Niebla ───────────────────────────────────────────────
        const fog = this.add.rectangle(wx, wy, this.tileSize, this.tileSize, 0x07040a, 1)
          .setDepth(DEPTHS.FX);
        this.fogTiles[`${c},${r}`] = fog;

        // ── Entidades del tile (items estáticos) ─────────────────────────
        if (char === '@') {
          this.playerPos = { x: c, y: r };
        } else if (char === 'E') {
          // Encuentro — los datos vienen de level.encounters
          const encData = level.encounters?.[`${c},${r}`];
          const count   = encData?.enemies?.length ?? 1;
          const sprite  = this.add.image(wx, wy, 'entity-goblin');

          let badge = null;
          if (count > 1) {
            badge = this.add.text(wx + 14, wy - 14, `x${count}`, {
              fontFamily: FONTS.PRIMARY, fontSize: "13px", color: "#ff4444", resolution: 2,
              stroke: "#000000", strokeThickness: 3,
            }).setOrigin(0.5).setDepth(DEPTHS.PLAYER + 1).setVisible(false);
          }

          this.entities[`${c},${r}`] = {
            type:      'encounter',
            encounter: encData ?? null,
            sprite,
            badge,
          };
        } else if (char === 'K') {
          // Llave recogible
          const sprite = this.add.image(wx, wy, 'entity-key');
          this.entities[`${c},${r}`] = { type: 'key', sprite };
        } else if (char === 'D') {
          const sprite = this.add.image(wx, wy, 'entity-door');
          this.entities[`${c},${r}`] = { type: 'door', sprite };
        } else if (char === 'T') {
          const sprite = this.add.image(wx, wy, 'entity-trap');
          this.entities[`${c},${r}`] = { type: 'trap', sprite };
        } else if (char === 'R') {
          const sprite = this.add.image(wx, wy, 'entity-rune');
          this.entities[`${c},${r}`] = { type: 'rune', sprite };
        } else if (char === 'F') {
          const sprite = this.add.image(wx, wy, 'entity-fountain');
          this.entities[`${c},${r}`] = { type: 'fountain', sprite };
        } else if (char === 'C') {
          const sprite = this.add.image(wx, wy, 'entity-chest');
          this.entities[`${c},${r}`] = { type: 'chest', sprite };
        } else if (char === 'S') {
          const sprite = this.add.image(wx, wy, 'entity-stairs');
          this.entities[`${c},${r}`] = { type: 'stairs', sprite };
        }
      }
    }

    const pwx = this.offsetX + this.playerPos.x * this.tileSize + this.tileSize / 2;
    const pwy = this.offsetY + this.playerPos.y * this.tileSize + this.tileSize / 2;
    this.playerSprite = this.add.image(pwx, pwy, 'entity-player').setDepth(DEPTHS.PLAYER);

    this._updateFogOfWar();
  }

  _updateFogOfWar() {
    const px = this.playerPos.x;
    const py = this.playerPos.y;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const key = `${c},${r}`;
        const fog = this.fogTiles[key];
        const ent = this.entities[key];

        const dist = Math.hypot(c - px, r - py);

        if (dist <= this.visionRadius) {
          this.visitedTiles.add(key);
          if (fog) fog.setAlpha(0);
          if (ent && ent.sprite) ent.sprite.setVisible(true);
          if (ent && ent.badge) ent.badge.setVisible(true);
        } else if (this.visitedTiles.has(key)) {
          if (fog) fog.setAlpha(0.65); // Niebla suave para lo ya visitado
          if (ent && ent.sprite) {
            // Entidades (enemigos/trampas) permanecen ocultas en penumbra lejana
            const isSecret = ent.type === 'encounter' || ent.type === 'goblin' || ent.type === 'trap';
            ent.sprite.setVisible(!isSecret);
            if (ent.badge) ent.badge.setVisible(!isSecret);
          }
        } else {
          if (fog) fog.setAlpha(1.0); // Oscuridad absoluta
          if (ent && ent.sprite) ent.sprite.setVisible(false);
          if (ent && ent.badge) ent.badge.setVisible(false);
        }
      }
    }
  }

  _createUI() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;
    const HH = this._HEADER_H;  // altura del header
    const FH = this._FOOTER_H;  // altura del footer

    // ── HEADER: dos filas ─────────────────────────────────────────────────
    // Fila 1 (y=0..52): nombre del jugador (izq) + PV (der)
    // Fila 2 (y=52..HH): nombre del nivel centrado + icono de llave
    this.add.rectangle(cx, HH / 2, W, HH, 0x0e0814, 1)
      .setStrokeStyle(0);  // sin borde — linea separadora abajo
    this.add.rectangle(cx, HH, W, 2, 0xd4a017, 1); // línea dorada separadora

    // Nombre del jugador (con ancho máximo para evitar solapamientos con PV)
    this.add.text(20, 10, this.playerName.toUpperCase(), {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0c040", resolution: 2,
      wordWrap: { width: W - 180 }
    });

    // HP (esquina superior derecha)
    this.hpText = this.add.text(W - 20, 10, `PV ${this.playerStats.currentHp}/${this.playerStats.maxHp}`, {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#4caf77", resolution: 2,
    }).setOrigin(1, 0);

    // Nombre del nivel (fila 2, alineado a la izquierda)
    this.add.text(20, 46, this._levelData.name ?? '', {
      fontFamily: FONTS.PRIMARY, fontSize: "13px", color: "#6a4e8a", resolution: 2,
    }).setOrigin(0, 0);

    // Icono de llave (fila 2, esquina superior derecha)
    this._keyHudIcon = this.add.text(W - 20, 46, "🗝️ LLAVE", {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#f0c040", resolution: 2,
    }).setOrigin(1, 0).setAlpha(0);

    // ── FOOTER: pista de control ──────────────────────────────────────────
    this.add.rectangle(cx, H - FH / 2, W, FH, 0x0e0814, 1);
    this.add.rectangle(cx, H - FH, W, 2, 0x3d2a5a, 1); // línea separadora
    this.add.text(cx, H - FH / 2, "Toca en la dirección que quieres moverte", {
      fontFamily: FONTS.PRIMARY, fontSize: "15px", color: "#6a4e8a", resolution: 2,
    }).setOrigin(0.5);

    // ── INPUT: tap-directional ────────────────────────────────────────────────
    // El juego calcula en qué dirección tocas RELATIVA al jugador y da UN paso.
    this.input.on("pointerdown", (pointer) => {
      if (this.isMoving || this._dialogBox.isVisible()) return;

      // Coordenadas del jugador en píxeles
      const playerPx = this.offsetX + this.playerPos.x * this.tileSize + this.tileSize / 2;
      const playerPy = this.offsetY + this.playerPos.y * this.tileSize + this.tileSize / 2;

      const relX = pointer.x - playerPx;
      const relY = pointer.y - playerPy;

      // Ignorar si el toque está sobre el propio jugador
      if (Math.abs(relX) < this.tileSize * 0.4 && Math.abs(relY) < this.tileSize * 0.4) return;

      // Eje dominante → dirección de UN paso
      let dx = 0, dy = 0;
      if (Math.abs(relX) > Math.abs(relY)) {
        dx = relX > 0 ? 1 : -1;
      } else {
        dy = relY > 0 ? 1 : -1;
      }

      this._tryMove(dx, dy);
    });
  }

  _findPath(startC, startR, targetC, targetR) {
    if (startC === targetC && startR === targetR) return [];
    if (targetC < 0 || targetC >= this.cols || targetR < 0 || targetR >= this.rows) return [];
    if (this.grid[targetR][targetC].type === 'wall') return [];

    const queue = [[startC, startR, []]];
    const visited = new Set();
    visited.add(`${startC},${startR}`);
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

    while (queue.length > 0) {
      const [c, r, path] = queue.shift();

      if (c === targetC && r === targetR) {
        return path;
      }

      for (const [dx, dy] of dirs) {
        const nc = c + dx;
        const nr = r + dy;
        const key = `${nc},${nr}`;

        if (nc >= 0 && nc < this.cols && nr >= 0 && nr < this.rows && !visited.has(key)) {
          visited.add(key);
          if (this.grid[nr][nc].type !== 'wall') {
            queue.push([nc, nr, [...path, { c: nc, r: nr }]]);
          }
        }
      }
    }
    return [];
  }

  _walkPath(path) {
    if (!path || path.length === 0 || this._dialogBox.isVisible()) return;
    const nextStep = path.shift();
    const entKey = `${nextStep.c},${nextStep.r}`;
    const entity = this.entities[entKey];

    if (entity) {
      this._handleInteraction(entity, nextStep.c, nextStep.r);
      return;
    }

    this._movePlayerTo(nextStep.c, nextStep.r, () => {
      if (path.length > 0 && !this._dialogBox.isVisible()) {
        this._walkPath(path);
      }
    });
  }

  _updateUI() {
    if (this.hpText) {
      this.hpText.setText(`PV: ${this.playerStats.currentHp}/${this.playerStats.maxHp}`);
    }
  }

  update() {
    if (this.isMoving || this._dialogBox.isVisible()) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasd.left)) {
      this._tryMove(-1, 0);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasd.right)) {
      this._tryMove(1, 0);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.up)) {
      this._tryMove(0, -1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasd.down)) {
      this._tryMove(0, 1);
    }
  }

  _tryMove(dx, dy) {
    const nc = this.playerPos.x + dx;
    const nr = this.playerPos.y + dy;

    if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) return;
    if (this.grid[nr][nc].type === 'wall') return;

    const key = `${nc},${nr}`;
    const ent = this.entities[key];

    if (ent) {
      this._handleInteraction(ent, nc, nr);
      return;
    }

    this._movePlayerTo(nc, nr);
  }

  _movePlayerTo(c, r, callback) {
    this.isMoving = true;
    this.playerPos = { x: c, y: r };
    const tx = this.offsetX + c * this.tileSize + this.tileSize / 2;
    const ty = this.offsetY + r * this.tileSize + this.tileSize / 2;

    SoundFx.playStep();
    this.tweens.add({
      targets: this.playerSprite,
      x: tx,
      y: ty,
      duration: 120,
      onComplete: () => {
        this.isMoving = false;
        this._updateUI();
        this._updateFogOfWar();
        if (callback) callback();
      }
    });
  }

  _handleInteraction(ent, c, r) {
    // ── Encuentro (multi-enemigo, datos desde levels.js) ─────────────────────
    if (ent.type === 'encounter') {
      const enc = ent.encounter ??
        { label: 'Encuentro', enemies: [{ name: 'Goblin', hp: 18, maxHp: 18, attack: 4 }] };

      // Guardar contexto para restaurar al volver del combate
      this._pendingCombat = { ent, c, r };

      // Sleep (pausa y oculta) este scene, lanza combate encima
      this.scene.sleep();
      this.scene.launch(SCENES.COMBAT, {
        playerStats: this.playerStats,
        encounter:   enc,
        enemy:       enc.enemies[0],
        mapSceneKey: SCENES.MAP,   // CombatScene lo usa para emitir 'combatEnd'
      });
      return;
    }

    // Alias legacy por si algo todavía pasa type:'goblin'
    if (ent.type === 'goblin') {
      const enemyInfo = ent.enemyData || { name: 'Goblin', hp: 18, maxHp: 18, attack: 4 };
      this._pendingCombat = { ent, c, r };
      this.scene.sleep();
      this.scene.launch(SCENES.COMBAT, {
        playerStats: this.playerStats,
        encounter:   { label: '', enemies: [enemyInfo] },
        enemy:       enemyInfo,
        mapSceneKey: SCENES.MAP,
      });
      return;
    }

    if (ent.type === 'key') {
      // Recoger la llave
      SoundFx.playKey();
      this.playerInventory.keys += 1;
      delete this.entities[`${c},${r}`];
      if (ent.sprite) ent.sprite.destroy();

      // Mostrar indicador en HUD con animación
      this._keyHudIcon.setAlpha(1);
      this.tweens.add({
        targets: this._keyHudIcon,
        scaleX: 1.15, scaleY: 1.15,
        duration: 200, yoyo: true, repeat: 2,
      });

      this._dialogBox.show(
        "🗝️ ¡Has encontrado la llave del ala de salida!\n\nAhora puedes abrir la puerta bloqueada.",
        () => this._movePlayerTo(c, r),
        "Objeto encontrado"
      );
      return;
    }

    if (ent.type === 'door') {
      if (this.playerInventory.keys > 0) {
        // Consumir la llave y abrir la puerta
        SoundFx.playDoor();
        this.playerInventory.keys -= 1;
        if (this.playerInventory.keys === 0) this._keyHudIcon.setAlpha(0);

        this._dialogBox.show(
          "Usas la llave. La cerradura cede con un clic y la puerta se abre.",
          () => {
            delete this.entities[`${c},${r}`];
            if (ent.sprite) ent.sprite.destroy();
            this._movePlayerTo(c, r);
          },
          "Puerta desbloqueada"
        );
      } else {
        this._dialogBox.show(
          "La puerta está cerrada con llave.\n\nBusca la llave en algún lugar de la mazmorra.",
          null,
          "Puerta bloqueada"
        );
      }
      return;
    }

    if (ent.type === 'trap') {
      SoundFx.playTrap();
      const passed = this.playerStats.checkAttribute('dexterity', 12);
      delete this.entities[`${c},${r}`];
      if (ent.sprite) ent.sprite.destroy();

      if (passed) {
        this._dialogBox.show("¡Esquivas el cepo con un salto torpe!", () => {
          this._movePlayerTo(c, r);
        }, "Prueba de Destreza");
      } else {
        this.playerStats.takeDamage(3);
        this._updateUI();
        this._dialogBox.show("¡CLACK! El cepo te cae en el pie (-3 PV).", () => {
          if (this.playerStats.currentHp > 0) {
            this._movePlayerTo(c, r);
          } else {
            this._dialogBox.show("Has caído inconsciente por las heridas.", () => {
              this.scene.start(SCENES.GUILD_REPORT);
            });
          }
        }, "Trampa de Cepo");
      }
      return;
    }

    if (ent.type === 'rune') {
      const passed = this.playerStats.checkAttribute('wisdom', 12);
      delete this.entities[`${c},${r}`];
      if (ent.sprite) ent.sprite.destroy();

      if (passed) {
        this.playerStats.heal(3);
        this._updateUI();
        this._dialogBox.show("¡Descifras la runa y una brisa mágica te restaura 3 PV!", () => {
          this._movePlayerTo(c, r);
        }, "Runa de Sabiduría");
      } else {
        this.playerStats.takeDamage(2);
        this._updateUI();
        this._dialogBox.show("Un chispazo arcano te quema las pestañas (-2 PV).", () => {
          this._movePlayerTo(c, r);
        }, "Runa Fallida");
      }
      return;
    }

    if (ent.type === 'fountain') {
      SoundFx.playFountain();
      const healed = this.playerStats.heal(3);
      this._updateUI();

      // Eliminar la entidad de la fuente para que se convierta en suelo libre
      delete this.entities[`${c},${r}`];
      if (ent.sprite) ent.sprite.destroy();

      this._dialogBox.show(`Bebes agua pura de la fuente y recuperas ${healed} PV.`, () => {
        this._movePlayerTo(c, r);
      }, "Fuente de Agua");
      return;
    }

    if (ent.type === 'chest') {
      SoundFx.playKey();
      const healed = this.playerStats.heal(5);
      this._updateUI();

      // Eliminar la entidad del cofre para que se convierta en suelo libre
      delete this.entities[`${c},${r}`];
      if (ent.sprite) ent.sprite.destroy();

      this._dialogBox.show(`¡Abres el cofre y encuentras una poción de sanación (+5 PV)!`, () => {
        this._movePlayerTo(c, r);
      }, "Cofre Tesoro");
      return;
    }

    if (ent.type === 'stairs') {
      SoundFx.playVictory();
      this._dialogBox.show(
        "¡HAS COMPLETADO LA MAZMORRA DE PRUEBA!\n\nEl Tribunal del Gremio asiente con cierta resignación por tu inesperada supervivencia.",
        () => {
          this.scene.start(SCENES.HERO_SUMMARY);
        },
        "¡Victoria!"
      );
      return;
    }
  }
}
