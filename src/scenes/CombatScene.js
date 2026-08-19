/**
 * CombatScene.js — Pantalla de combate por turnos (720×1280 HD Vertical)
 *
 * Incluye:
 *  - Barras animadas de PV (Vida) y PM (Maná)
 *  - Menú de Selección de Hechizos con consumo de PM
 *  - Vulnerabilidades y resistencias elementales (Físico, Fuego, Hielo, Rayo, Arcano)
 *  - Hechizo de Curación en combate (Cura Arcana)
 *  - Números de daño flotantes y animaciones
 */

import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, DEPTHS } from "../utils/constants.js";
import { DialogBox } from "../ui/DialogBox.js";
import { LevelUpModal } from "../ui/LevelUpModal.js";
import { SoundFx } from "../systems/SoundFx.js";
import { EnemyAnimationManager } from "../systems/EnemyAnimationManager.js";

// ── Paleta de combate ─────────────────────────────────────────────────────────
const C = {
  PANEL:    0x1a0f2e,
  BORDER:   0xd4a017,
  HP_FULL:  0x4caf77,
  HP_MID:   0xf0c040,
  HP_LOW:   0xe53935,
  MP_FULL:  0x7b68ee,
  ENEMY_HP: 0xc0392b,
  PHYS:     0xf0c040,   // dorado = físico
  MAGIC:    0x7b68ee,   // violeta = magia
  DODGE:    0x4fc3f7,   // azul = esquiva
  FLEE:     0x888888,   // gris = huida
};

export class CombatScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.COMBAT });
  }

  create(data) {
    this.playerStats  = data.playerStats;
    this.onCombatEnd  = data.onCombatEnd;
    this.isDefending  = false;
    this._buttonsLocked = false;
    this._mapSceneKey = data.mapSceneKey ?? null;
    this._spellContainer = null;
    this.totalExpGained = 0;

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

    SoundFx.playCombatBgm();

    this._buildUI();
  }

  _buildUI() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const cx = W / 2;

    // ── FONDO ARENA (Restringido solo a la ventana de la arena) ───────────
    const arenaY = 125;
    const arenaH = 555;

    if (this.textures.exists("bg_combat")) {
      const bgImage = this.add.image(cx, arenaY + arenaH / 2, "bg_combat");
      bgImage.setDisplaySize(W, arenaH);
      bgImage.setDepth(DEPTHS.BG);

      // Máscara para que el fondo NO tape ni se meta detrás de la UI superior o inferior
      const maskGfx = this.make.graphics();
      maskGfx.fillStyle(0xffffff);
      maskGfx.fillRect(0, arenaY, W, arenaH);
      bgImage.setMask(maskGfx.createGeometryMask());

      // Líneas divisorias sobrias para enmarcar la arena
      const border = this.add.graphics();
      border.lineStyle(2, C.BORDER, 0.5);
      border.lineBetween(0, arenaY, W, arenaY);
      border.lineBetween(0, arenaY + arenaH, W, arenaY + arenaH);
    } else {
      const bg = this.add.graphics();
      bg.fillStyle(0x0e0814, 1);
      bg.fillRect(0, 0, W, H);
      bg.fillStyle(0x1a1030, 0.5);
      bg.fillRect(0, arenaY, W, arenaH);

      bg.lineStyle(2, C.BORDER, 0.3);
      bg.lineBetween(40, H * 0.58, W - 40, H * 0.58);
    }

    // ── HUD ENEMIGO ───────────────────────────────────────────────────────
    const enemyPanelH = 90;
    this.add.rectangle(cx, 75, W - 60, enemyPanelH, C.PANEL, 1)
      .setStrokeStyle(2, C.BORDER);

    // Nombre y tipo del enemigo
    this.enemyNameText = this.add.text(cx, 40, this.enemyData.name.toUpperCase(), {
      fontFamily: FONTS.PRIMARY, fontSize: "17px", color: "#f0c040", resolution: 2,
    }).setOrigin(0.5, 0);

    // Debilidades conocidas
    const weakLabel = this._getWeaknessLabel(this.enemyData.key);
    this.enemyWeaknessText = this.add.text(cx, 62, weakLabel, {
      fontFamily: FONTS.PRIMARY, fontSize: "11px", color: "#b388ff", resolution: 2,
    }).setOrigin(0.5, 0);

    // Barra HP enemigo
    const barX = 50;
    const barY = 82;
    const barW = W - 100;
    const barH = 14;

    this.add.rectangle(cx, barY + barH / 2, barW, barH, 0x000000, 0.8)
      .setStrokeStyle(1, 0x553333);

    this._enemyHpBarBg = this.add.rectangle(barX, barY, barW, barH, 0x2a0000, 1).setOrigin(0, 0);
    this._enemyHpBar   = this.add.rectangle(barX, barY, barW, barH, C.ENEMY_HP, 1).setOrigin(0, 0);

    this._enemyHpText = this.add.text(W - 50, 36, `${this.enemyHp}/${this.enemyData.maxHp}`, {
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#ff8888", resolution: 2,
    }).setOrigin(1, 0);

    // ── SPRITES ENEMIGOS EN ARENA ──────────────────────────────────────────
    const ex = cx;
    const ey = H * 0.44;
    // Sombra ovalada posicionada exactamente en el plano del suelo bajo las suelas
    this._enemyShadow = this.add.ellipse(ex, ey + 2, 165, 28, 0x000000, 0.45);
    const enemyKey = (this.enemyData.key || 'goblin').replace('_alpha', '');
    this._enemyGfx = EnemyAnimationManager.createEnemySprite(this, ex, ey, enemyKey);
    this._enemyGfx.setDisplaySize(260, 260);
    this._enemySpriteX = ex;
    this._enemySpriteY = ey;

    this._startEnemyIdleAnimation();

    // ── INDICADOR DE TURNO ────────────────────────────────────────────────
    this._turnText = this.add.text(cx, H * 0.55, "⚔️ TU TURNO", {
      fontFamily: FONTS.PRIMARY, fontSize: "14px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5);

    // ── HUD JUGADOR ───────────────────────────────────────────────────────
    const playerPanelY = H * 0.64;
    const playerPanelH = 125;
    this.add.rectangle(cx, playerPanelY, W - 60, playerPanelH, C.PANEL, 1)
      .setStrokeStyle(2, C.BORDER);

    // Nombre y Stats
    this.add.text(50, playerPanelY - 48, (this.playerStats._name || "Héroe").toUpperCase(), {
      fontFamily: FONTS.PRIMARY, fontSize: "17px", color: "#f0c040", resolution: 2,
    });

    const stats = this.playerStats;
    const statLine = `FUE ${stats.strength}  DES ${stats.dexterity}  CON ${stats.constitution}  SAB ${stats.wisdom}  AGI ${stats.agility}`;
    this.add.text(cx, playerPanelY - 26, statLine, {
      fontFamily: FONTS.PRIMARY, fontSize: "10px", color: "#6a4e8a", resolution: 2, align: "center",
    }).setOrigin(0.5);

    // Barras PV y PM
    const pBarX = 50;
    const pBarW = W - 100;

    // PV
    this.add.text(50, playerPanelY - 8, "PV", {
      fontFamily: FONTS.PRIMARY, fontSize: "10px", color: "#4caf77", resolution: 2,
    });
    this.add.rectangle(cx, playerPanelY + 3, pBarW, 14, 0x000000, 0.8).setStrokeStyle(1, 0x113311);
    this._playerHpBar = this.add.rectangle(pBarX, playerPanelY - 4, pBarW, 14, C.HP_FULL, 1).setOrigin(0, 0);
    this._playerHpText = this.add.text(W - 50, playerPanelY - 10, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#4caf77", resolution: 2,
    }).setOrigin(1, 0);

    // PM
    this.add.text(50, playerPanelY + 20, "PM", {
      fontFamily: FONTS.PRIMARY, fontSize: "10px", color: "#7b68ee", resolution: 2,
    });
    this.add.rectangle(cx, playerPanelY + 31, pBarW, 14, 0x000000, 0.8).setStrokeStyle(1, 0x221144);
    this._playerMpBar = this.add.rectangle(pBarX, playerPanelY + 24, pBarW, 14, C.MP_FULL, 1).setOrigin(0, 0);
    this._playerMpText = this.add.text(W - 50, playerPanelY + 18, "", {
      fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#b388ff", resolution: 2,
    }).setOrigin(1, 0);

    this._playerBarX = pBarX;
    this._playerBarW = pBarW;

    // ── ÁREA DE ACCIONES ──────────────────────────────────────────────────
    this._buildActionButtons(W, H, cx);

    // Primer render
    this._updateBars(false);
  }

  _getWeaknessLabel(key) {
    switch (key) {
      case 'lord_oscuro': return '👑 GRAN JEFE FINAL · Débil a RAYO y ARCANO';
      case 'minotauro':   return '🐂 MINI-JEFE NIVEL 4 · Débil a HIELO';
      case 'golem':       return '🗿 Débil a FUEGO y RAYO · Alta Armadura';
      case 'esqueleto':   return '💀 Débil a FUEGO y ARCANO';
      case 'mago_novato': return '⚡ Débil a FÍSICO · Resistente a Magia';
      case 'trasgo':      return '❄️ Débil a HIELO y RAYO · Resistente a Físico';
      case 'goblin_alpha':return '🔥 Débil a FUEGO y RAYO · Alta Armadura';
      default:            return '🗡️ Débil a FÍSICO y FUEGO';
    }
  }

  _getElementMultiplier(enemyKey, type) {
    if (type === 'physical') {
      if (enemyKey === 'mago_novato') return 1.8;
      if (enemyKey === 'goblin') return 1.2;
      if (enemyKey === 'trasgo' || enemyKey === 'goblin_alpha' || enemyKey === 'golem' || enemyKey === 'lord_oscuro') return 0.75;
      return 1.0;
    }
    if (type === 'fire') {
      if (enemyKey === 'goblin' || enemyKey === 'goblin_alpha' || enemyKey === 'esqueleto' || enemyKey === 'golem') return 1.6;
      return 1.0;
    }
    if (type === 'ice') {
      if (enemyKey === 'trasgo' || enemyKey === 'minotauro') return 1.6;
      if (enemyKey === 'esqueleto') return 0.5;
      return 1.0;
    }
    if (type === 'lightning') {
      if (enemyKey === 'trasgo' || enemyKey === 'goblin_alpha' || enemyKey === 'golem' || enemyKey === 'lord_oscuro') return 1.6;
      return 1.0;
    }
    if (type === 'arcane') {
      if (enemyKey === 'mago_novato') return 0.6;
      if (enemyKey === 'esqueleto' || enemyKey === 'lord_oscuro') return 1.6;
      return 1.0;
    }
    return 1.0;
  }

  _drawEnemySprite(g, x, y) {
    g.clear();
    const type = this.enemyData.key || 'goblin';
    switch (type) {
      case 'trasgo': this._drawTrasgo(g, x, y, 1.0); break;
      case 'mago_novato': this._drawMago(g, x, y, 1.0); break;
      case 'goblin_alpha': this._drawGoblin(g, x, y, true, 1.0); break;
      default: this._drawGoblin(g, x, y, false, 1.0); break;
    }
  }

  _drawGoblin(g, x, y, isBoss = false, scale = 1.0) {
    const r = 54 * scale;
    g.fillStyle(0x1b5e20, 1);
    g.fillTriangle(x - r * 1.2, y - r * 0.2, x - r * 0.4, y - r * 0.6, x - r * 0.4, y + r * 0.1);
    g.fillTriangle(x + r * 1.2, y - r * 0.2, x + r * 0.4, y - r * 0.6, x + r * 0.4, y + r * 0.1);
    g.fillStyle(isBoss ? 0x2e7d32 : 0x388e3c, 1);
    g.fillCircle(x, y, r);
    g.lineStyle(3 * scale, 0x1b5e20, 1);
    g.strokeCircle(x, y, r);
    g.fillStyle(0xe53935, 1);
    g.fillCircle(x - r * 0.3, y - r * 0.15, r * 0.18);
    g.fillCircle(x + r * 0.3, y - r * 0.15, r * 0.18);
  }

  _drawTrasgo(g, x, y, scale = 1.0) {
    const r = 56 * scale;
    g.fillStyle(0x4e342e, 1);
    g.fillCircle(x, y, r);
  }

  _drawMago(g, x, y, scale = 1.0) {
    const r = 50 * scale;
    g.fillStyle(0x4a148c, 1);
    g.fillCircle(x, y, r);
  }

  _buildActionButtons(W, H, cx) {
    const stats = this.playerStats;

    const physMin  = Math.max(1, Math.floor((stats.strength + 1) / 3) + 1);
    const physMax  = Math.floor((stats.strength + 1) / 3) + 6;
    const critPct  = Math.min((stats.dexterity + 1) * 2, 35);
    const evadePct = Math.min((stats.agility + 1) * 3, 45);
    const fleePct  = Math.min((stats.agility + 1) * 10, 80);

    const btnAreaY = H * 0.77;
    const btnW = (W - 80) / 2;
    const btnH = 105;
    const gap  = 18;
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
        "🔮 MAGIA",
        `PM ${stats.currentMp}/${stats.maxMp} · Hechizos`,
        C.MAGIC, () => this._toggleSpellMenu()),

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
      fontFamily: FONTS.PRIMARY, fontSize: "16px", color: "#f0e6d3", resolution: 2,
      align: "center", wordWrap: { width: w - 16 },
    }).setOrigin(0.5);

    const tipTxt = this.add.text(x, y + 20, tooltip, {
      fontFamily: FONTS.PRIMARY, fontSize: "10px",
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

  _toggleSpellMenu() {
    if (this._spellContainer) {
      this._spellContainer.destroy();
      this._spellContainer = null;
      return;
    }

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;

    const container = this.add.container(0, 0).setDepth(DEPTHS.UI + 5);
    this._spellContainer = container;

    // Overlay semi-transparente
    const overlay = this.add.rectangle(cx, H / 2, W, H, 0x000000, 0.7)
      .setInteractive();
    container.add(overlay);

    // Panel modal
    const modalW = W - 60;
    const modalH = 460;
    const modalY = H * 0.58;

    const panel = this.add.rectangle(cx, modalY, modalW, modalH, 0x160a26, 1)
      .setStrokeStyle(3, 0x7b68ee);
    container.add(panel);

    const title = this.add.text(cx, modalY - 190, "🔮 LIBRO DE HECHIZOS", {
      fontFamily: FONTS.PRIMARY, fontSize: "18px", color: "#d4a017", resolution: 2,
    }).setOrigin(0.5);
    container.add(title);

    const mpLabel = this.add.text(cx, modalY - 160, `Maná Disponible: ${this.playerStats.currentMp} / ${this.playerStats.maxMp} PM`, {
      fontFamily: FONTS.PRIMARY, fontSize: "12px", color: "#b388ff", resolution: 2,
    }).setOrigin(0.5);
    container.add(mpLabel);

    const spells = [
      { id: 'arcane', name: '🔮 Proyectil Arcano', cost: 2, desc: 'Daño mágico rápido' },
      { id: 'fireball', name: '🔥 Bola de Fuego', cost: 4, desc: 'Daño fuego alto' },
      { id: 'icebeam', name: '❄️ Ráfaga de Hielo', cost: 4, desc: 'Daño hielo elemental' },
      { id: 'lightning', name: '⚡ Rayo Devastador', cost: 7, desc: 'Daño mágico masivo' },
      { id: 'heal', name: '💚 Cura Arcana', cost: 3, desc: 'Restaura Vida en combate' },
    ];

    const startY = modalY - 110;
    const gapY = 56;

    spells.forEach((sp, i) => {
      const y = startY + i * gapY;
      const canAfford = this.playerStats.currentMp >= sp.cost;
      const btnColor = canAfford ? 0x2a144a : 0x140a20;
      const borderColor = canAfford ? 0x7b68ee : 0x443366;
      const textColor = canAfford ? "#f0e6d3" : "#665588";

      const btnBg = this.add.rectangle(cx, y, modalW - 40, 48, btnColor, 1)
        .setStrokeStyle(2, borderColor);

      if (canAfford) {
        btnBg.setInteractive({ useHandCursor: true });
        btnBg.on("pointerdown", () => {
          container.destroy();
          this._spellContainer = null;
          this._castSpell(sp);
        });
      }

      const txt = this.add.text(cx - (modalW / 2) + 40, y - 10, `${sp.name} (${sp.cost} PM)`, {
        fontFamily: FONTS.PRIMARY, fontSize: "14px", color: textColor, resolution: 2,
      });

      const subTxt = this.add.text(cx - (modalW / 2) + 40, y + 8, sp.desc, {
        fontFamily: FONTS.PRIMARY, fontSize: "10px", color: canAfford ? "#b388ff" : "#554466", resolution: 2,
      });

      container.add([btnBg, txt, subTxt]);
    });

    // Botón Volver
    const closeBtn = this.add.rectangle(cx, modalY + 190, 200, 40, 0x3d2d54, 1)
      .setStrokeStyle(2, 0xd4a017)
      .setInteractive({ useHandCursor: true });

    const closeTxt = this.add.text(cx, modalY + 190, "↩️ CANCELAR", {
      fontFamily: FONTS.PRIMARY, fontSize: "13px", color: "#f0e6d3", resolution: 2,
    }).setOrigin(0.5);

    closeBtn.on("pointerdown", () => {
      container.destroy();
      this._spellContainer = null;
    });

    container.add([closeBtn, closeTxt]);
  }

  _castSpell(spell) {
    if (!this.playerStats.useMp(spell.cost)) return;

    this._lockButtons();
    this._updateBars();

    if (spell.id === 'heal') {
      SoundFx.playFountain();
      const healAmount = Math.floor((this.playerStats.wisdom + 1) * 2.5) + Math.floor(Math.random() * 4) + 1;
      const actualHeal = this.playerStats.heal(healAmount);
      this._updateBars();

      this._spawnHealNumber(this.scale.width / 2, this.scale.height * 0.64 - 30, actualHeal);
      this._dialogBox.show(`💚 Canalizas Maná y te curas ${actualHeal} Puntos de Vida.`, () => {
        this._enemyTurn();
      });
      return;
    }

    SoundFx.playSpell();
    const result = this.playerStats.getSpellDamageResult(spell.id);
    let { dmg, isCrit, type } = result;

    const mult = this._getElementMultiplier(this.enemyData.key, type);
    dmg = Math.max(1, Math.floor(dmg * mult));
    const isEffective = mult > 1.1;

    this.enemyHp -= dmg;
    this._shakeEnemy();
    this._spawnDamageNumber(this._enemySpriteX, this._enemySpriteY - 60, dmg, isCrit, true, isEffective);
    this._updateBars();

    const effMsg = isEffective ? " ✨ ¡SUPER EFECTIVO!" : mult < 0.9 ? " (Resistido)" : "";
    const msg = `Lanzas ${spell.name}${effMsg} — ${dmg} de daño elemental.`;

    this.time.delayedCall(300, () => {
      this._dialogBox.show(msg, () => this._checkEnemyDefeat());
    });
  }

  _lockButtons() {
    this._buttonsLocked = true;
    this._actionBtns?.forEach(({ bg }) => bg.setAlpha(0.4));
  }

  _unlockButtons() {
    this._buttonsLocked = false;
    this._actionBtns?.forEach(({ bg }) => bg.setAlpha(1));
  }

  _updateBars(animate = true) {
    const ps = this.playerStats;

    const enemyRatio = Math.max(0, this.enemyHp / this.enemyData.maxHp);
    const newEnemyW  = Math.floor(enemyRatio * (this.scale.width - 100));

    const playerHpRatio = Math.max(0, ps.currentHp / ps.maxHp);
    const newPlayerHpW  = Math.floor(playerHpRatio * this._playerBarW);
    const playerHpColor = playerHpRatio > 0.5 ? C.HP_FULL : playerHpRatio > 0.25 ? C.HP_MID : C.HP_LOW;

    const playerMpRatio = Math.max(0, ps.currentMp / ps.maxMp);
    const newPlayerMpW  = Math.floor(playerMpRatio * this._playerBarW);

    if (animate) {
      this.tweens.add({ targets: this._enemyHpBar, displayWidth: newEnemyW, duration: 300, ease: "Cubic.Out" });
      this.tweens.add({ targets: this._playerHpBar, displayWidth: newPlayerHpW, duration: 300, ease: "Cubic.Out" });
      this.tweens.add({ targets: this._playerMpBar, displayWidth: newPlayerMpW, duration: 300, ease: "Cubic.Out" });
    } else {
      this._enemyHpBar.displayWidth  = newEnemyW;
      this._playerHpBar.displayWidth = newPlayerHpW;
      this._playerMpBar.displayWidth = newPlayerMpW;
    }

    this._enemyHpBar.setFillStyle(C.ENEMY_HP);
    this._playerHpBar.setFillStyle(playerHpColor);

    this._enemyHpText.setText(`${Math.max(0, this.enemyHp)}/${this.enemyData.maxHp}`);
    this._playerHpText.setText(`${Math.max(0, ps.currentHp)}/${ps.maxHp}`);
    this._playerMpText.setText(`${Math.max(0, ps.currentMp)}/${ps.maxMp}`);
  }

  _spawnDamageNumber(x, y, amount, isCrit, isMagic, isEffective = false) {
    const color  = isCrit ? "#ff2222" : isEffective ? "#b388ff" : "#ffffff";
    const size   = isCrit || isEffective ? "38px" : "30px";
    const prefix = isEffective ? "✨ " : "";
    const txt    = isCrit ? `💥 ${amount}!` : `${prefix}-${amount}`;

    const dmgTxt = this.add.text(x + Phaser.Math.Between(-30, 30), y, txt, {
      fontFamily: FONTS.PRIMARY, fontSize: size, color, resolution: 2,
      stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTHS.FX + 2);

    this.tweens.add({
      targets: dmgTxt, y: y - 100, alpha: 0, duration: 1200, ease: "Cubic.Out",
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

  _shakeEnemy() {
    const enemyKey = (this.enemyData?.key || 'goblin').replace('_alpha', '');
    const hurtAnimKey = `${enemyKey}_anim_hurt`;
    const standAnimKey = `${enemyKey}_anim_stand`;
    if (this.anims.exists(hurtAnimKey) && this._enemyGfx?.play) {
      this._enemyGfx.play(hurtAnimKey);
      this._enemyGfx.once("animationcomplete", () => {
        if (this.enemyHp > 0 && this._enemyGfx?.active && this.anims.exists(standAnimKey)) {
          this._enemyGfx.play(standAnimKey);
        }
      });
    }
    this.tweens.add({
      targets: this._enemyGfx, x: "+=18", duration: 50, yoyo: true, repeat: 4, ease: "Sine.easeInOut",
    });
    this.cameras.main.flash(120, 255, 60, 60, false);
  }

  _shakePlayer() {
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(100, 255, 0, 0, false);
  }

  _getEnemyAssetKey(key) {
    return EnemyAnimationManager.getValidTextureKey(this, key);
  }

  _startEnemyIdleAnimation() {
    if (this._idleTween) this._idleTween.remove();
    if (!this._enemyGfx || !this._enemyGfx.active) return;
    // Si la animación por fotogramas reales (stand01/stand02) ya está activa, no estirar/subir sintéticamente
    if (this._enemyGfx.anims && this._enemyGfx.anims.isPlaying) return;

    const baseY = this._enemySpriteY ?? (this._enemyGfx.y || 400);
    const baseW = 260;
    const baseH = 260;

    this._idleTween = this.tweens.add({
      targets: this._enemyGfx,
      y: baseY - 6,
      displayHeight: baseH + 8,
      displayWidth: baseW - 4,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  _checkEnemyDefeat() {
    if (this.enemyHp <= 0) {
      if (this._idleTween) this._idleTween.remove();
      const prevName = this.enemyData.name;
      const enemyKey = (this.enemyData.key || 'goblin').replace('_alpha', '');
      const dieAnimKey = `${enemyKey}_anim_die`;

      const proceedDefeat = () => {
        this.tweens.add({
          targets: [this._enemyGfx, this._enemyShadow], scaleY: 0, alpha: 0, duration: 400, ease: "Cubic.In",
          onComplete: () => {
            if (this.enemyIndex + 1 < this.enemyList.length) {
              this.enemyIndex++;
              this.enemyData = { ...this.enemyList[this.enemyIndex] };
              this.enemyHp   = this.enemyData.hp;

              if (this.enemyNameText) this.enemyNameText.setText(this.enemyData.name.toUpperCase());
              if (this.enemyWeaknessText) {
                this.enemyWeaknessText.setText(this._getWeaknessLabel(this.enemyData.key));
              }
              this._updateBars(false);

              const nextKey = (this.enemyData.key || 'goblin').replace('_alpha', '');
              const nextActiveKey = this._getEnemyAssetKey(nextKey);
              if (this._enemyGfx?.setTexture) {
                this._enemyGfx.setTexture(nextActiveKey);
                this._enemyGfx.setAlpha(1).setScale(1).setDisplaySize(260, 260);
                const standAnimKey = `${nextKey}_anim_stand`;
                if (this.anims.exists(standAnimKey)) this._enemyGfx.play(standAnimKey);
              }
              this._enemyShadow.setAlpha(0.4).setScale(1);
            } else {
              this._handleWin();
            }
          }
        });
      };

      if (this.anims.exists(dieAnimKey) && this._enemyGfx?.play) {
        this._enemyGfx.play(dieAnimKey);
        this.time.delayedCall(700, proceedDefeat);
      } else {
        proceedDefeat();
      }
    } else {
      this._enemyTurn();
    }
  }

  _handleAttack() {
    this._lockButtons();
    SoundFx.playHit();
    const result = this.playerStats.getPhysicalDamageResult();
    let { dmg, isCrit, type } = result;

    const mult = this._getElementMultiplier(this.enemyData.key, type);
    dmg = Math.max(1, Math.floor(dmg * mult));
    const isEffective = mult > 1.1;

    this.enemyHp -= dmg;
    this._shakeEnemy();
    this._spawnDamageNumber(this._enemySpriteX, this._enemySpriteY - 60, dmg, isCrit, false, isEffective);
    this._updateBars();

    const effMsg  = isEffective ? " ⚔️ ¡SUPER EFECTIVO!" : mult < 0.9 ? " (Resistido por armadura)" : "";
    const critMsg = isCrit ? " ¡CRÍTICO! 💥" : "";
    const msg     = `Atacas con fuerza física${effMsg}${critMsg} — ${dmg} de daño al ${this.enemyData.name}.`;

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

  _enemyTurn() {
    this._turnText.setText("💀 TURNO ENEMIGO").setColor("#e53935");

    const enemyKey = (this.enemyData?.key || 'goblin').replace('_alpha', '');
    const attackAnimKey = `${enemyKey}_anim_attack`;
    const standAnimKey = `${enemyKey}_anim_stand`;

    if (this.anims.exists(attackAnimKey) && this._enemyGfx?.play) {
      this._enemyGfx.play(attackAnimKey);
      this._enemyGfx.once("animationcomplete", () => {
        if (this.enemyHp > 0 && this._enemyGfx?.active && this.anims.exists(standAnimKey)) {
          this._enemyGfx.play(standAnimKey);
        }
      });
    }

    let evasion = this.playerStats.getEvasionChance();
    if (this.isDefending) evasion = Math.min(evasion * 2, 90);

    const evaded = Math.random() * 100 < evasion;

    this.tweens.add({
      targets: [this._enemyGfx, this._enemyShadow],
      y: "+=35", duration: 120, yoyo: true, ease: "Power2.Out",
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

  _endCombat(won) {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      if (this._mapSceneKey) {
        const mapScene = this.scene.get(this._mapSceneKey);
        if (mapScene) mapScene.events.emit('combatEnd', { won });
        this.scene.stop();
        this.scene.wake(this._mapSceneKey);
      } else if (won) {
        this.scene.start(SCENES.MAP);
      } else {
        this.scene.start(SCENES.GUILD_REPORT);
      }
    });
  }

  _getEnemyExpReward(enemyObj) {
    if (!enemyObj) return 15;
    const k = String(enemyObj.key || enemyObj.name || '').toLowerCase();
    if (k.includes('alpha') || k.includes('jefe')) return 50;
    if (k.includes('trasgo')) return 25;
    if (k.includes('mago')) return 20;
    return 15; // Goblin Explorador = 15 EXP (Level Up directo a Nivel 2!)
  }

  _handleWin() {
    SoundFx.playVictory();
    this.cameras.main.flash(400, 255, 215, 0, false);

    let totalReward = 0;
    const list = (this.enemyList && this.enemyList.length > 0) ? this.enemyList : [this.enemyData];
    list.forEach(e => {
      totalReward += this._getEnemyExpReward(e);
    });
    this.totalExpGained = totalReward;

    const res = this.playerStats.addExp(this.totalExpGained);

    const expMsg = `¡Victoria! Consigues +${this.totalExpGained} EXP.`;
    this._dialogBox.show(expMsg, () => {
      if (res.leveledUp || this.playerStats.attributePoints > 0) {
        new LevelUpModal(this, this.playerStats, () => this._endCombat(true));
      } else {
        this._endCombat(true);
      }
    });
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
