/**
 * EnemyAnimationManager.js — Gestor dinámico de animaciones de enemigos para Phaser
 * 
 * Importa el manifest (assets/enemies/manifest.json) y precarga todas las
 * texturas e imágenes de forma síncrona en el Loader de Phaser.
 */

import enemyManifest from "../../public/assets/enemies/manifest.json";

export class EnemyAnimationManager {
  /**
   * Obtiene los datos completos del manifest
   */
  static getManifest() {
    return enemyManifest;
  }

  /**
   * Carga sincrónicamente todas las imágenes descritas en el manifest durante el preload() de Phaser
   * @param {Phaser.Scene} scene 
   */
  static preloadEnemyAssets(scene) {
    if (!enemyManifest || !enemyManifest.enemies) return;

    Object.values(enemyManifest.enemies).forEach(enemy => {
      // 1. Cargar el sprite de mapa (map.png)
      if (enemy.mapSprite) {
        const mapTextureKey = `${enemy.id}_map_0`;
        if (!scene.textures.exists(mapTextureKey)) {
          scene.load.image(mapTextureKey, enemy.mapSprite);
        }
      }

      // 2. Cargar todas las imágenes de animación (stand, attack, hurt, die, dodge, etc.)
      if (enemy.animations) {
        Object.entries(enemy.animations).forEach(([animKey, animConfig]) => {
          animConfig.frames.forEach((framePath, idx) => {
            const textureKey = `${enemy.id}_${animKey}_${idx}`;
            if (!scene.textures.exists(textureKey)) {
              scene.load.image(textureKey, framePath);
            }
          });
        });
      }
    });
  }

  /**
   * Registra las animaciones en el AnimationManager de Phaser (anims.create)
   * @param {Phaser.Scene} scene 
   */
  static registerAnimations(scene) {
    if (!enemyManifest || !enemyManifest.enemies) return;

    Object.values(enemyManifest.enemies).forEach(enemy => {
      if (!enemy.animations) return;

      Object.entries(enemy.animations).forEach(([animKey, animConfig]) => {
        const phaserAnimKey = `${enemy.id}_anim_${animKey}`;

        if (scene.anims.exists(phaserAnimKey)) return;

        const frameKeys = animConfig.frames.map((_, idx) => ({
          key: `${enemy.id}_${animKey}_${idx}`
        }));

        if (frameKeys.length > 0) {
          scene.anims.create({
            key: phaserAnimKey,
            frames: frameKeys,
            frameRate: animConfig.frameRate || 8,
            repeat: animConfig.repeat !== undefined ? animConfig.repeat : 0
          });
        }
      });
    });
  }

  /**
   * Crea un sprite de enemigo con soporte para animaciones de varios frames o micro-animación Tween de respiración
   * @param {Phaser.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   * @param {string} enemyId 
   * @returns {Phaser.GameObjects.Sprite}
   */
  static getValidTextureKey(scene, enemyId) {
    const cleanId = (enemyId || 'goblin').replace('_alpha', '');
    const candidates = [
      `${cleanId}_stand_0`,
      `${cleanId}_idle_0`,
      `${cleanId}_map_0`,
      `${cleanId}_attack_0`,
      `${cleanId}_hurt_0`,
      `${cleanId}_die_0`,
      'entity-goblin'
    ];
    for (const key of candidates) {
      if (scene.textures.exists(key)) return key;
    }
    return 'entity-goblin';
  }

  static createEnemySprite(scene, x, y, enemyId) {
    const cleanId = (enemyId || 'goblin').replace('_alpha', '');
    const validTextureKey = this.getValidTextureKey(scene, cleanId);

    const sprite = scene.add.sprite(x, y, validTextureKey);
    sprite.setOrigin(0.5, 1.0);

    const standAnimKey = `${cleanId}_anim_stand`;
    const idleAnimKey = `${cleanId}_anim_idle`;

    if (scene.anims.exists(standAnimKey)) {
      sprite.play(standAnimKey);
      const anim = scene.anims.get(standAnimKey);
      if (anim && anim.frames && anim.frames.length === 1) {
        this.applyBreathingTween(scene, sprite);
      }
    } else if (scene.anims.exists(idleAnimKey)) {
      sprite.play(idleAnimKey);
      const anim = scene.anims.get(idleAnimKey);
      if (anim && anim.frames && anim.frames.length === 1) {
        this.applyBreathingTween(scene, sprite);
      }
    } else {
      this.applyBreathingTween(scene, sprite);
    }

    return sprite;
  }

  /**
   * Aplica un Tween de respiración (Squash & Stretch) a un sprite de 1 solo frame
   * @param {Phaser.Scene} scene 
   * @param {Phaser.GameObjects.Sprite} sprite 
   */
  static applyBreathingTween(scene, sprite) {
    if (sprite.data && sprite.data.get('breathingTween')) {
      return;
    }

    const tween = scene.tweens.add({
      targets: sprite,
      scaleY: 1.04,
      scaleX: 0.97,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    if (!sprite.data) sprite.setDataEnabled();
    sprite.data.set('breathingTween', tween);
  }
}
