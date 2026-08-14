/**
 * CombatScene.js — Pantalla de combate por turnos (720×1280 HD Vertical)
 *
 * UX mejorada:
 *  - Barras de vida animadas (no texto crudo)
 *  - Números de daño flotantes con tween
 *  - Tooltip de rango de daño en cada botón
 *  - % de huida y esquiva visibles
 *  - Feedback visual: flash de color, shake del enemigo, pulso en HP bajo
 *  - Layout sin solapamiento garantizado
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, DEPTHS } from "../utils/constants.js";
import { DialogBox } from "../ui/DialogBox.js";
import { SoundFx } from "../systems/SoundFx.js";
import { buildGoblinTextureFrames } from "../graphics/GoblinSpriteBuilder.js";
import { buildAllEnemyTextureFrames } from "../graphics/EnemySpritesBuilder.js";

// ── Paleta de combate ─────────────────────────────────────────────────────────
const C = {
  PANEL:    0x1a0f2e,
  BORDER:   0xd4a017,
  HP_FULL:  0x4caf77,
  HP_MID:   0xf0c040,
  HP_LOW:   0xe53935,
  ENEMY_HP: 0xc0392b,
  PHYS:     0xf0c040,   // dorado = físico
  MAGIC:    0x7b68ee,   // violeta = magia
  DODGE:    0x4fc3f7,   // azul = esquiva
  FLEE:     0x888888,   // gris = huida
  HIT_FLASH:0xff4444,
};

export class CombatScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.COMBAT });
  }

  // ─────────────────────────────────────────────────────────────────────────
  create(data) {
    this.playerStats  = data.playerStats;
    this.onCombatEnd  = data.onCombatEnd;
    this.isDefending  = false;
    this._buttonsLocked = false;
    this._mapSceneKey = data.mapSceneKey ?? null;

    // Equipo de enemigos (soporta 1 o más enemigos en secuencia)
    const rawEnemies  = data.encounter?.enemies ?? [data.enemy];
    this.enemyList    = rawEnemies.map(e => ({ ...e, hp: e.hp, maxHp: e.maxHp ?? e.hp }));
    this.enemyIndex   = 0;
    this.enemyData    = { ...this.enemyList[0] };
    this.enemyHp      = this.enemyData.hp;

    this._dialogBox = new DialogBox(this);

    this.cameras.main.setBackgroundColor(0x0e0814);
    this.cameras.main.fadeIn(200, 0, 0, 0);

    this.input.on("pointerdown", () => {
      if (this._dialogBox.isVisible()) this._dialogBox.advance();
    });
    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this._dialogBox.isVisible()) this._dialogBox.advance();
    });
    this.input.keyboard?.on("keydown-ENTER", () => {
      if (this._dialogBox.isVisible()) this._dialogBox.advance();
    });

    // Iniciar BGM de combate
    SoundFx.playCombatBgm();

    this._buildUI();
  }

  // ─────────────────────────────────────────────────────────────────────────
  _buildUI() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;

    // ── FONDO ARENA ──────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x0e0814, 1);
    bg.fillRect(0, 0, W, H);
    // Gradiente sutil del suelo
    bg.fillStyle(0x1a1030, 0.5);
    bg.fillRect(0, H * 0.55, W, H * 0.45);

    // Línea del suelo
    bg.lineStyle(2, C.BORDER, 0.3);
    bg.lineBetween(40, H * 0.58, W - 40, H * 0.58);

    // ── HUD ENEMIGO ───────────────────────────────────────────────────────
    // Panel
    const enemyPanelH = 90;
    this.add.rectangle(cx, 75, W - 60, enemyPanelH, C.PANEL, 1)
      .setStrokeStyle(2, C.BORDER);
    // ── CABECERA Y DATOS DEL ENEMIGO ──────────────────────────────────────
    this.add.rectangle(cx, 40, W, 80, C.PANEL_BG, 0.95)
      .setStrokeStyle(2, C.BORDER);

    // Grupo de enemigos (ej: ENEMIGO 1/2)
    const totalEnemies = this.enemyList.length;
    const groupLabel = totalEnemies > 1 ? `ENEMIGO ${this.enemyIndex + 1}/${totalEnemies} (PRIMERA LÍNEA)` : 'ENEMIGO DE PLANTA';
    this.enemyGroupText = this.add.text(cx, 10, groupLabel, {
      fontFamily: FONTS.PRIMARY, fontSize: "10px", color: "#a0a0c0", resolution: 2,
    }).setOrigin(0.5, 0);

    const isBoss = !!this.enemyData.boss;
    const nameColor = isBoss ? "#ff3333" : "#d4a017";
    this.enemyNameText = this.add.text(cx, 26, this.enemyData.name.toUpperCase(), {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: nameColor, resolution: 2,
    }).setOrigin(0.5, 0);

    // Badge Debilidad táctica
    const weakness = this.enemyData.weakness;
    const weakLabel = weakness === 'magic' ? '✨ DÉBIL A MAGIA' : weakness === 'physical' ? '⚔️ DÉBIL A FÍSICO' : '';
    const weakColor = weakness === 'magic' ? '#b388ff' : '#f0c040';
    this.enemyWeaknessText = this.add.text(cx, 46, weakLabel, {
      fontFamily: FONTS.PRIMARY, fontSize: "10px", color: weakColor, resolution: 2,
    }).setOrigin(0.5, 0);

    // Barra HP enemigo
    const barX = 50;
    const barY = 62;
    const barW = W - 100;
    const barH = 14;

    this.add.rectangle(cx, barY + barH / 2, barW, barH, 0x000000, 0.8)
      .setStrokeStyle(1, 0x553333);

    this._enemyHpBarBg = this.add.rectangle(barX, barY, barW, barH, 0x2a0000, 1).setOrigin(0, 0);
    this._enemyHpBar   = this.add.rectangle(barX, barY, barW, barH, C.ENEMY_HP, 1).setOrigin(0, 0);

    // Texto HP numérico
    this._enemyHpText = this.add.text(W - 50, 36, `${this.enemyHp}/${this.enemyData.maxHp}`, {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#ff8888", resolution: 2,
    }).setOrigin(1, 0);

    // ── SPRITES ENEMIGOS EN ARENA (TRANSPARENTE PIXEL ART FOTOGRAMAS) ──────
    const ex = cx;
    const ey = H * 0.32;

    // Enemigo Secundario en Reserva (Fondo a la derecha)
    this._reserveEnemyGfx = null;
    this._reserveShadow   = null;
    if (this.enemyList.length > 1) {
      this._reserveShadow = this.add.ellipse(ex + 100, ey + 45, 100, 25, 0x000000, 0.3);
      const resKey = this.enemyList[1].key || 'goblin';
      const resFrame = `${resKey}_idle_0`;
      if (this.textures.exists(resFrame)) {
        this._reserveEnemyGfx = this.add.sprite(ex + 100, ey - 15, resFrame)
          .setScale(2.2)
          .setAlpha(0.65);
      } else {
        this._reserveEnemyGfx = this.add.graphics();
        this._drawReserveEnemySprite(this._reserveEnemyGfx, ex + 100, ey - 15);
      }
    }

    // Enemigo Principal en Primera Línea (Centro)
    this._enemyShadow = this.add.ellipse(ex, ey + 70, 160, 40, 0x000000, 0.4);
    const activeKey = this._getEnemyAssetKey(this.enemyData.key);
    if (this.textures.exists(activeKey)) {
      this._enemyGfx = this.add.image(ex, ey, activeKey).setDisplaySize(260, 260);
    } else {
      this._enemyGfx = this.add.graphics();
      this._drawEnemySprite(this._enemyGfx, ex, ey);
    }
    this._enemySpriteX = ex;
    this._enemySpriteY = ey;

    // Animación de respiración Idle del enemigo principal
    this._startEnemyIdleAnimation();

    // HP baja del enemigo → pulso rojo
    this._enemyPulse = null;

    // ── INDICADOR DE TURNO ────────────────────────────────────────────────
    this._turnText = this.add.text(cx, H * 0.57, "⚔️ TU TURNO", {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5);

    // ── HUD JUGADOR ───────────────────────────────────────────────────────
    const playerPanelY = H * 0.64;
    const playerPanelH = 110;
    this.add.rectangle(cx, playerPanelY, W - 60, playerPanelH, C.PANEL, 1)
      .setStrokeStyle(2, C.BORDER);

    // Nombre
    this.add.text(50, playerPanelY - 38, (this.playerStats._name || "Héroe").toUpperCase(), {
      fontFamily: FONTS.PRIMARY, fontSize: "18px", color: "#f0c040", resolution: 2,
    });

    // Stats inline: muestra los atributos clave
    const stats = this.playerStats;
    const statLine = `FUE ${stats.strength}  DES ${stats.dexterity}  CON ${stats.constitution}  SAB ${stats.wisdom}  AGI ${stats.agility}`;
    this.add.text(cx, playerPanelY - 15, statLine, {
      fontFamily: FONTS.PRIMARY, fontSize: "11px", color: "#6a4e8a", resolution: 2,
      align: "center",
    }).setOrigin(0.5);

    // HP label
    this.add.text(50, playerPanelY + 5, "PV", {
      fontFamily: FONTS.PRIMARY, fontSize: "10px", color: "#6a4e8a", resolution: 2,
    });

    // Barra HP jugador
    const pBarX = 50;
    const pBarY = playerPanelY + 20;
    const pBarW = W - 100;
    const pBarH = 20;

    this.add.rectangle(cx, pBarY + pBarH / 2, pBarW, pBarH, 0x000000, 0.8)
      .setStrokeStyle(1, 0x333355);
    this._playerHpBarBg = this.add.rectangle(pBarX, pBarY, pBarW, pBarH, 0x002200, 1).setOrigin(0, 0);
    this._playerHpBar   = this.add.rectangle(pBarX, pBarY, pBarW, pBarH, C.HP_FULL, 1).setOrigin(0, 0);

    this._playerHpText = this.add.text(W - 50, playerPanelY + 5, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#4caf77", resolution: 2,
    }).setOrigin(1, 0);

    this._playerBarX = pBarX;
    this._playerBarW = pBarW;
    this._playerBarH = pBarH;

    // ── ÁREA DE ACCIONES ──────────────────────────────────────────────────
    this._buildActionButtons(W, H, cx);

    // Primer render
    this._updateBars(false);
  }

  _drawEnemySprite(g, x, y) {
    g.clear();
    const type = this.enemyData.key || 'goblin';
    switch (type) {
      case 'trasgo':
        this._drawTrasgo(g, x, y, 1.0);
        break;
      case 'mago_novato':
        this._drawMago(g, x, y, 1.0);
        break;
      case 'esqueleto':
        this._drawEsqueleto(g, x, y, 1.0);
        break;
      case 'minotauro':
        this._drawMinotauro(g, x, y, 1.0);
        break;
      case 'goblin_alpha':
        this._drawGoblin(g, x, y, true, 1.0);
        break;
      default:
        this._drawGoblin(g, x, y, false, 1.0);
        break;
    }
  }

  _drawReserveEnemySprite(g, x, y) {
    g.clear();
    const nextEnemy = this.enemyList[this.enemyIndex + 1] || this.enemyData;
    const type = nextEnemy.key || 'goblin';
    switch (type) {
      case 'trasgo':
        this._drawTrasgo(g, x, y, 0.65);
        break;
      case 'mago_novato':
        this._drawMago(g, x, y, 0.65);
        break;
      case 'esqueleto':
        this._drawEsqueleto(g, x, y, 0.65);
        break;
      case 'minotauro':
        this._drawMinotauro(g, x, y, 0.65);
        break;
      default:
        this._drawGoblin(g, x, y, false, 0.65);
        break;
    }
  }

  // ── RENDERERS DE ARQUETIPOS ENEMIGOS ───────────────────────────────────────
  _drawGoblin(g, x, y, isBoss = false, scale = 1.0) {
    const r = 54 * scale;
    // Orejas puntiagudas
    g.fillStyle(0x1b5e20, 1);
    g.fillTriangle(x - r * 1.2, y - r * 0.2, x - r * 0.4, y - r * 0.6, x - r * 0.4, y + r * 0.1);
    g.fillTriangle(x + r * 1.2, y - r * 0.2, x + r * 0.4, y - r * 0.6, x + r * 0.4, y + r * 0.1);

    // Cabeza verde
    g.fillStyle(isBoss ? 0x2e7d32 : 0x388e3c, 1);
    g.fillCircle(x, y, r);
    g.lineStyle(3 * scale, 0x1b5e20, 1);
    g.strokeCircle(x, y, r);

    // Casco si es Jefe Alfa
    if (isBoss) {
      g.fillStyle(0x78909c, 1);
      g.fillRect(x - r * 0.8, y - r * 0.9, r * 1.6, r * 0.5);
      g.lineStyle(3 * scale, 0xffb300, 1);
      g.strokeRect(x - r * 0.8, y - r * 0.9, r * 1.6, r * 0.5);
    }

    // Ojos rojos
    g.fillStyle(0xe53935, 1);
    g.fillCircle(x - r * 0.3, y - r * 0.15, r * 0.18);
    g.fillCircle(x + r * 0.3, y - r * 0.15, r * 0.18);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(x - r * 0.25, y - r * 0.2, r * 0.07);
    g.fillCircle(x + r * 0.35, y - r * 0.2, r * 0.07);

    // Colmillos amarillos
    g.fillStyle(0xfff59d, 1);
    g.fillTriangle(x - r * 0.2, y + r * 0.4, x - r * 0.1, y + r * 0.2, x, y + r * 0.4);
    g.fillTriangle(x, y + r * 0.4, x + r * 0.1, y + r * 0.2, x + r * 0.2, y + r * 0.4);
  }

  _drawTrasgo(g, x, y, scale = 1.0) {
    const r = 56 * scale;
    // Hombros con armadura pesada
    g.fillStyle(0x455a64, 1);
    g.fillRect(x - r * 1.1, y, r * 2.2, r * 0.8);
    g.lineStyle(3 * scale, 0x90a4ae, 1);
    g.strokeRect(x - r * 1.1, y, r * 2.2, r * 0.8);

    // Casco metálico
    g.fillStyle(0x607d8b, 1);
    g.fillCircle(x, y - r * 0.1, r * 0.9);
    g.lineStyle(4 * scale, 0x37474f, 1);
    g.strokeCircle(x, y - r * 0.1, r * 0.9);

    // Visor de yelmo acorazado
    g.fillStyle(0x263238, 1);
    g.fillRect(x - r * 0.6, y - r * 0.25, r * 1.2, r * 0.3);
    // Ranura con ojo rojo brillante
    g.fillStyle(0xff1744, 1);
    g.fillRect(x - r * 0.4, y - r * 0.15, r * 0.8, r * 0.1);
  }

  _drawMago(g, x, y, scale = 1.0) {
    const r = 54 * scale;
    // Túnica violeta mística
    g.fillStyle(0x512da8, 1);
    g.fillTriangle(x - r * 1.2, y + r * 0.9, x, y - r * 0.5, x + r * 1.2, y + r * 0.9);

    // Cabeza mística
    g.fillStyle(0x311b92, 1);
    g.fillCircle(x, y - r * 0.1, r * 0.65);

    // Gorro puntiagudo de mago
    g.fillStyle(0x7b1fa2, 1);
    g.fillTriangle(x - r * 0.7, y - r * 0.3, x, y - r * 1.4, x + r * 0.7, y - r * 0.3);
    // Adorno dorado en gorro
    g.fillStyle(0xffd54f, 1);
    g.fillCircle(x, y - r * 0.3, r * 0.15);

    // Ojos de energía arcana
    g.fillStyle(0x00e5ff, 1);
    g.fillCircle(x - r * 0.2, y - r * 0.15, r * 0.14);
    g.fillCircle(x + r * 0.2, y - r * 0.15, r * 0.14);
  }

  _drawEsqueleto(g, x, y, scale = 1.0) {
    const r = 52 * scale;
    // Cráneo óseo
    g.fillStyle(0xe0e0e0, 1);
    g.fillCircle(x, y - r * 0.1, r * 0.8);
    g.lineStyle(3 * scale, 0x9e9e9e, 1);
    g.strokeCircle(x, y - r * 0.1, r * 0.8);

    // Cuencas oscuras
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(x - r * 0.28, y - r * 0.2, r * 0.22);
    g.fillCircle(x + r * 0.28, y - r * 0.2, r * 0.22);

    // Puntos de luz en cuencas
    g.fillStyle(0xffeb3b, 1);
    g.fillCircle(x - r * 0.25, y - r * 0.2, r * 0.08);
    g.fillCircle(x + r * 0.25, y - r * 0.2, r * 0.08);

    // Mandíbula y dientes
    g.fillStyle(0xbdbdbd, 1);
    g.fillRect(x - r * 0.35, y + r * 0.2, r * 0.7, r * 0.3);
    g.lineStyle(2 * scale, 0x424242, 1);
    for (let i = -2; i <= 2; i++) {
      g.lineBetween(x + i * (r * 0.12), y + r * 0.2, x + i * (r * 0.12), y + r * 0.5);
    }
  }

  _drawMinotauro(g, x, y, scale = 1.0) {
    const r = 68 * scale;
    // Cuernos dorados amenazantes
    g.fillStyle(0xffb300, 1);
    g.fillTriangle(x - r * 1.3, y - r * 0.9, x - r * 0.4, y - r * 0.3, x - r * 0.4, y - r * 0.8);
    g.fillTriangle(x + r * 1.3, y - r * 0.9, x + r * 0.4, y - r * 0.3, x + r * 0.4, y - r * 0.8);

    // Cabeza de Minotauro
    g.fillStyle(0x4e342e, 1);
    g.fillCircle(x, y, r);
    g.lineStyle(4 * scale, 0x271c19, 1);
    g.strokeCircle(x, y, r);

    // Hocico
    g.fillStyle(0x3e2723, 1);
    g.fillCircle(x, y + r * 0.3, r * 0.45);

    // Aro en la nariz
    g.lineStyle(3 * scale, 0xffd54f, 1);
    g.strokeCircle(x, y + r * 0.5, r * 0.18);

    // Ojos rojos de rabia
    g.fillStyle(0xd50000, 1);
    g.fillCircle(x - r * 0.3, y - r * 0.2, r * 0.18);
    g.fillCircle(x + r * 0.3, y - r * 0.2, r * 0.18);
  }

  // ── BOTONES DE ACCIÓN ─────────────────────────────────────────────────────
  _buildActionButtons(W, H, cx) {
    const stats = this.playerStats;

    // Rangos de daño para tooltips
    const physMin  = Math.max(1, Math.floor((stats.strength + 1) / 3) + 1);
    const physMax  = Math.floor((stats.strength + 1) / 3) + 6;
    const magMin   = Math.max(1, Math.floor((stats.wisdom + 1) / 3) + 1);
    const magMax   = Math.floor((stats.wisdom + 1) / 3) + 8;
    const critPct  = Math.min((stats.dexterity + 1) * 2, 35);
    const evadePct = Math.min((stats.agility + 1) * 3, 45);
    const fleePct  = Math.min((stats.agility + 1) * 10, 80);

    const btnAreaY = H * 0.76;
    const btnW = (W - 80) / 2;
    const btnH = 110;
    const gap  = 20;
    const col1 = 40 + btnW / 2;
    const col2 = 40 + btnW + gap + btnW / 2;
    const row1 = btnAreaY;
    const row2 = btnAreaY + btnH + gap;

    this._actionBtns = [
      this._makeActionBtn(col1, row1, btnW, btnH,
        "⚔️ ATACAR",
        `Daño: ${physMin}–${physMax} (crit ${critPct}%)`,
        C.PHYS, () => this._handleAttack()),

      this._makeActionBtn(col2, row1, btnW, btnH,
        "✨ CONJURO",
        `Daño: ${magMin}–${magMax} (crit ${critPct}%)`,
        C.MAGIC, () => this._handleSpell()),

      this._makeActionBtn(col1, row2, btnW, btnH,
        "🛡 ESQUIVAR",
        `Reduce daño x2 · Evasión +${evadePct}%`,
        C.DODGE, () => this._handleDefend()),

      this._makeActionBtn(col2, row2, btnW, btnH,
        "🏃 HUIR",
        `Éxito: ${fleePct}%`,
        C.FLEE, () => this._handleFlee()),
    ];
  }

  _makeActionBtn(x, y, w, h, label, tooltip, color, callback) {
    const bg = this.add.rectangle(x, y, w, h, C.PANEL, 1)
      .setStrokeStyle(2, color)
      .setInteractive({ useHandCursor: true });

    const labelTxt = this.add.text(x, y - 14, label, {
      fontFamily: FONTS.PRIMARY, fontSize: "17px", color: "#f0e6d3", resolution: 2,
      align: "center", wordWrap: { width: w - 16 },
    }).setOrigin(0.5);

    const tipTxt = this.add.text(x, y + 22, tooltip, {
      fontFamily: FONTS.PRIMARY, fontSize: "11px",
      color: `#${color.toString(16).padStart(6, "0")}`,
      resolution: 2, align: "center", wordWrap: { width: w - 20 },
    }).setOrigin(0.5);

    bg.on("pointerover", () => {
      if (this._buttonsLocked) return;
      bg.setFillStyle(0x2a1a42);
      this.tweens.add({ targets: bg, scaleX: 1.03, scaleY: 1.03, duration: 80 });
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(C.PANEL);
      this.tweens.add({ targets: bg, scaleX: 1, scaleY: 1, duration: 80 });
    });
    bg.on("pointerdown", () => {
      if (this._buttonsLocked || this._dialogBox.isVisible()) return;
      this.tweens.add({ targets: bg, scaleX: 0.96, scaleY: 0.96, duration: 60, yoyo: true });
      callback();
    });

    return { bg, labelTxt, tipTxt };
  }

  _lockButtons() {
    this._buttonsLocked = true;
    this._actionBtns?.forEach(({ bg }) => bg.setAlpha(0.4));
  }
  _unlockButtons() {
    this._buttonsLocked = false;
    this._actionBtns?.forEach(({ bg }) => bg.setAlpha(1));
  }

  // ── BARRAS DE VIDA ANIMADAS ───────────────────────────────────────────────
  _updateBars(animate = true) {
    const ps = this.playerStats;

    // Ratio enemigo
    const enemyRatio = Math.max(0, this.enemyHp / this.enemyData.maxHp);
    const newEnemyW  = Math.floor(enemyRatio * (this.scale.width - 100));
    const enemyColor = C.ENEMY_HP;

    // Ratio jugador
    const playerRatio = Math.max(0, ps.currentHp / ps.maxHp);
    const newPlayerW  = Math.floor(playerRatio * this._playerBarW);
    const playerColor = playerRatio > 0.5 ? C.HP_FULL : playerRatio > 0.25 ? C.HP_MID : C.HP_LOW;

    if (animate) {
      this.tweens.add({ targets: this._enemyHpBar, displayWidth: newEnemyW, duration: 300, ease: "Cubic.Out" });
      this.tweens.add({ targets: this._playerHpBar, displayWidth: newPlayerW, duration: 300, ease: "Cubic.Out" });
    } else {
      this._enemyHpBar.displayWidth  = newEnemyW;
      this._playerHpBar.displayWidth = newPlayerW;
    }

    this._enemyHpBar.setFillStyle(enemyColor);
    this._playerHpBar.setFillStyle(playerColor);

    this._enemyHpText.setText(`${Math.max(0, this.enemyHp)}/${this.enemyData.maxHp}`);
    this._playerHpText.setText(`${Math.max(0, ps.currentHp)}/${ps.maxHp}`);

    // Pulso de peligro cuando el jugador tiene < 25% de vida
    if (playerRatio < 0.25 && !this._lowHpPulse) {
      this._lowHpPulse = this.tweens.add({
        targets: this._playerHpBar,
        alpha: 0.4,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else if (playerRatio >= 0.25 && this._lowHpPulse) {
      this._lowHpPulse.remove();
      this._lowHpPulse = null;
      this._playerHpBar.setAlpha(1);
    }
  }

  // ── NÚMERO FLOTANTE DE DAÑO ───────────────────────────────────────────────
  _spawnDamageNumber(x, y, amount, isCrit, isMagic, isEffective = false) {
    const color  = isCrit ? "#ff2222" : isEffective ? (isMagic ? "#b388ff" : "#f0c040") : "#ffffff";
    const size   = isCrit || isEffective ? "38px" : "30px";
    const prefix = isEffective ? (isMagic ? "✨ " : "⚔️ ") : "";
    const txt    = isCrit ? `💥 ${amount}!` : `${prefix}-${amount}`;

    const dmgTxt = this.add.text(x + Phaser.Math.Between(-30, 30), y, txt, {
      fontFamily: FONTS.PRIMARY, fontSize: size, color, resolution: 2,
      stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTHS.FX + 2);

    this.tweens.add({
      targets: dmgTxt,
      y: y - 100,
      alpha: 0,
      duration: 1200,
      ease: "Cubic.Out",
      onComplete: () => dmgTxt.destroy(),
    });
  }

  _spawnHealNumber(x, y, amount) {
    const txt = this.add.text(x, y, `+${amount} PV`, {
      fontFamily: FONTS.PRIMARY, fontSize: "28px", color: "#4caf77", resolution: 2,
      stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTHS.FX + 2);

    this.tweens.add({
      targets: txt, y: y - 80, alpha: 0, duration: 1000, ease: "Cubic.Out",
      onComplete: () => txt.destroy(),
    });
  }

  // ── ANIMACIONES DE IMPACTO ────────────────────────────────────────────────
  _shakeEnemy() {
    const gfx = this._enemyGfx;
    this.tweens.add({
      targets: gfx, x: "+=18", duration: 50,
      yoyo: true, repeat: 4, ease: "Sine.easeInOut",
    });
    // Flash rojo
    this.cameras.main.flash(120, 255, 60, 60, false);

    // Mueca de dolor en el sprite del Enemigo activo
    const typeKey = this.enemyData.key || 'goblin';
    const hurtFrame = `${typeKey}_hurt`;
    if (this._enemyGfx && this._enemyGfx.setTexture && this.textures.exists(hurtFrame)) {
      this._enemyGfx.stop();
      this._enemyGfx.setTexture(hurtFrame);
      this.time.delayedCall(300, () => {
        if (this._enemyGfx && this._enemyGfx.play && this.enemyHp > 0) {
          this._enemyGfx.play(`${typeKey}_idle_anim`);
        }
      });
    }
  }

  _shakePlayer() {
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(100, 255, 0, 0, false);
  }

  // ── ACCIONES DEL JUGADOR ─────────────────────────────────────────────────
  _getEnemyAssetKey(key) {
    switch (key) {
      case 'trasgo':      return 'enemy_trasgo';
      case 'mago_novato': return 'enemy_mago';
      case 'esqueleto':   return 'enemy_esqueleto';
      case 'minotauro':   return 'enemy_minotauro';
      default:            return 'enemy_goblin';
    }
  }

  _startEnemyIdleAnimation() {
    if (this._idleTween) this._idleTween.remove();
    this._idleTween = this.tweens.add({
      targets: [this._enemyGfx, this._enemyShadow],
      scaleY: 1.05,
      scaleX: 0.97,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  _checkEnemyDefeat() {
    if (this.enemyHp <= 0) {
      const prevName = this.enemyData.name;

      // Fotograma de muerte y disolución
      const typeKey = this.enemyData.key || 'goblin';
      const dieFrame = `${typeKey}_die`;
      if (this._enemyGfx && this._enemyGfx.setTexture && this.textures.exists(dieFrame)) {
        this._enemyGfx.stop();
        this._enemyGfx.setTexture(dieFrame);
      }

      this.tweens.add({
        targets: [this._enemyGfx, this._enemyShadow],
        scaleY: 0,
        alpha: 0,
        duration: 350,
        ease: "Cubic.In",
      });

      if (this.enemyIndex + 1 < this.enemyList.length) {
        this.enemyIndex++;
        this.enemyData = { ...this.enemyList[this.enemyIndex] };
        this.enemyHp   = this.enemyData.hp;

        if (this.enemyNameText) this.enemyNameText.setText(this.enemyData.name.toUpperCase());
        if (this.enemyWeaknessText) {
          const w = this.enemyData.weakness;
          this.enemyWeaknessText.setText(w === 'magic' ? '✨ DÉBIL A MAGIA' : w === 'physical' ? '⚔️ DÉBIL A FÍSICO' : '');
          this.enemyWeaknessText.setColor(w === 'magic' ? '#b388ff' : '#f0c040');
        }
        if (this.enemyGroupText) {
          this.enemyGroupText.setText(`ENEMIGO ${this.enemyIndex + 1}/${this.enemyList.length} (PRIMERA LÍNEA)`);
        }
        this._updateBars(false);

        // Si había reserva gráfica en pantalla, hacerla avanzar con animación al centro
        if (this._reserveEnemyGfx) {
          const ex = this._enemySpriteX;
          const ey = this._enemySpriteY;
          this.tweens.add({
            targets: [this._reserveEnemyGfx, this._reserveShadow],
            x: "-=100", y: "+=15", duration: 350, ease: "Cubic.Out",
            onComplete: () => {
              const nextKey = this.enemyData.key || 'goblin';
              const idleFrame = `${nextKey}_idle_0`;
              const animKey = `${nextKey}_idle_anim`;

              if (this._enemyGfx && this.textures.exists(idleFrame)) {
                this._enemyGfx.setTexture(idleFrame).setScale(3.5).setAlpha(1);
                if (!this.anims.exists(animKey)) {
                  this.anims.create({
                    key: animKey,
                    frames: [ { key: `${nextKey}_idle_0` }, { key: `${nextKey}_idle_1` } ],
                    frameRate: 2.5,
                    repeat: -1,
                  });
                }
                this._enemyGfx.play(animKey);
              }

              if (this.enemyIndex + 1 >= this.enemyList.length) {
                if (this._reserveEnemyGfx) { this._reserveEnemyGfx.destroy(); this._reserveEnemyGfx = null; }
                if (this._reserveShadow) { this._reserveShadow.destroy(); this._reserveShadow = null; }
              } else {
                const resKey = this.enemyList[this.enemyIndex + 1].key || 'goblin';
                const resFrame = `${resKey}_idle_0`;
                if (this._reserveEnemyGfx && this._reserveEnemyGfx.setTexture && this.textures.exists(resFrame)) {
                  this._reserveEnemyGfx.setTexture(resFrame).setScale(2.2).setPosition(ex + 100, ey - 15).setAlpha(0.65);
                }
              }
            }
          });
        }

        const countInfo = `(${this.enemyIndex + 1}/${this.enemyList.length})`;
        this._dialogBox.show(
          `¡${prevName} cae derrotado! ${countInfo}\n¡${this.enemyData.name} da un paso al frente!`,
          () => this._enemyTurn()
        );
      } else {
        this._handleWin();
      }
    } else {
      this._enemyTurn();
    }
  }

  _handleAttack() {
    this._lockButtons();
    SoundFx.playHit();
    const result = this.playerStats.getPhysicalDamageResult(); // {dmg, isCrit}
    let { dmg, isCrit } = result;

    const isEffective = this.enemyData.weakness === 'physical';
    if (isEffective) dmg = Math.floor(dmg * 1.5);

    this.enemyHp -= dmg;

    this._shakeEnemy();
    this._spawnDamageNumber(this._enemySpriteX, this._enemySpriteY - 60, dmg, isCrit, false, isEffective);
    this._updateBars();

    const effMsg  = isEffective ? " ⚔️ ¡SUPER EFECTIVO!" : "";
    const critMsg = isCrit ? " ¡CRÍTICO! 💥" : "";
    const msg     = `Atacas con fuerza${effMsg}${critMsg} — ${dmg} de daño al ${this.enemyData.name}.`;

    this.time.delayedCall(300, () => {
      this._dialogBox.show(msg, () => this._checkEnemyDefeat());
    });
  }

  _handleSpell() {
    this._lockButtons();
    SoundFx.playSpell();
    const result = this.playerStats.getMagicDamageResult();
    let { dmg, isCrit } = result;

    const isEffective = this.enemyData.weakness === 'magic';
    if (isEffective) dmg = Math.floor(dmg * 1.5);

    this.enemyHp -= dmg;

    this._shakeEnemy();
    this._spawnDamageNumber(this._enemySpriteX, this._enemySpriteY - 60, dmg, isCrit, true, isEffective);
    this._updateBars();

    const effMsg  = isEffective ? " ✨ ¡SUPER EFECTIVO!" : "";
    const flavour = this.playerStats.wisdom === 0
      ? `Murmuras algo ininteligible — funciona de casualidad.`
      : `Lanzas magia arcana${effMsg}${isCrit ? " ¡CRÍTICO! 💥" : ""}`;
    const msg = `${flavour} — ${dmg} de daño mágico.`;

    this.time.delayedCall(300, () => {
      this._dialogBox.show(msg, () => this._checkEnemyDefeat());
    });
  }

  _handleDefend() {
    this._lockButtons();
    SoundFx.playButtonClick();
    this.isDefending = true;
    const evadePct = Math.min((this.playerStats.agility + 1) * 3 * 2, 90);
    this._dialogBox.show(
      `Te pones a la defensiva. Esquiva aumentada al ${evadePct}% y daño reducido a la mitad.`,
      () => this._enemyTurn()
    );
  }

  _handleFlee() {
    this._lockButtons();
    SoundFx.playButtonClick();
    const fleePct = Math.min((this.playerStats.agility + 1) * 10, 80);
    if (Math.random() * 100 < fleePct) {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this._dialogBox.show("¡Pones pies en polvorosa y escapas cobardemente!", () => {
        this.time.delayedCall(300, () => this.scene.start(SCENES.MAP));
      });
    } else {
      this._dialogBox.show(
        `Intentas huir (${fleePct}% de éxito) pero tropiezas de bruces. El turno pasa al enemigo.`,
        () => this._enemyTurn()
      );
    }
  }

  // ── TURNO DEL ENEMIGO ─────────────────────────────────────────────────────
  _enemyTurn() {
    this._turnText.setText("💀 TURNO ENEMIGO").setColor("#e53935");

    let evasion = this.playerStats.getEvasionChance();
    if (this.isDefending) evasion = Math.min(evasion * 2, 90);

    const evaded = Math.random() * 100 < evasion;

    // Cambiar al fotograma de ataque del enemigo
    const typeKey = this.enemyData.key || 'goblin';
    const attackFrame = `${typeKey}_attack`;
    if (this._enemyGfx && this._enemyGfx.setTexture && this.textures.exists(attackFrame)) {
      this._enemyGfx.stop();
      this._enemyGfx.setTexture(attackFrame);
      this.time.delayedCall(350, () => {
        if (this._enemyGfx && this._enemyGfx.play && this.enemyHp > 0) {
          this._enemyGfx.play(`${typeKey}_idle_anim`);
        }
      });
    }

    // Animación de Embestida de Ataque del Enemigo
    this.tweens.add({
      targets: [this._enemyGfx, this._enemyShadow],
      y: "+=35",
      duration: 120,
      yoyo: true,
      ease: "Power2.Out",
    });

    this.time.delayedCall(400, () => {
      if (evaded) {
        this._dialogBox.show(
          `El ${this.enemyData.name} ataca — ¡lo esquivas con un paso atrás!`,
          () => this._endEnemyTurn()
        );
      } else {
        let dmg = this.enemyData.attack;
        if (this.isDefending) dmg = Math.max(1, Math.floor(dmg / 2));
        const dead = this.playerStats.takeDamage(dmg);

        SoundFx.playHit();
        this._shakePlayer();
        this._spawnDamageNumber(this.scale.width / 2, this.scale.height * 0.64 - 30, dmg, false, false);
        this._updateBars();

        const msg = dead
          ? `El ${this.enemyData.name} te aplasta con ${dmg} de daño. ¡Has caído!`
          : `El ${this.enemyData.name} te golpea por ${dmg} de daño. (PV: ${this.playerStats.currentHp}/${this.playerStats.maxHp})`;

        this._dialogBox.show(msg, () => {
          if (dead) {
            this._handleLose();
          } else {
            this._endEnemyTurn();
          }
        });
      }
    });
  }

  _endEnemyTurn() {
    this.isDefending = false;
    this._turnText.setText("⚔️ TU TURNO").setColor("#d4a017");
    this._unlockButtons();
  }

  // ── VICTORIA / DERROTA ────────────────────────────────────────────────────
  _endCombat(won) {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      if (this._mapSceneKey) {
        // Emitir resultado al MapScene dormido y luego despertar
        const mapScene = this.scene.get(this._mapSceneKey);
        if (mapScene) mapScene.events.emit('combatEnd', { won });
        this.scene.stop();           // detener CombatScene
        this.scene.wake(this._mapSceneKey); // despertar MapScene
      } else if (won) {
        this.scene.start(SCENES.MAP);
      } else {
        this.scene.start(SCENES.GUILD_REPORT);
      }
    });
  }

  _handleWin() {
    SoundFx.playVictory();
    this.cameras.main.flash(400, 255, 215, 0, false);
    this._dialogBox.show(
      `¡${this.enemyData.name} derrotado! El Gremio toma nota (con escepticismo).`,
      () => this._endCombat(true)
    );
  }

  _handleLose() {
    SoundFx.playDefeat();
    this.cameras.main.shake(500, 0.02);
    this._dialogBox.show(
      "¡Has caído derrotado! El Gremio registra otro fracaso ilustre en sus archivos.",
      () => this._endCombat(false)
    );
  }
}
