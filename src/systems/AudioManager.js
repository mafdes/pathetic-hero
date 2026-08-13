/**
 * AudioManager.js — Control centralizado de audio
 * Gestiona música de fondo y SFX con control de volumen global.
 */

export class AudioManager {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.scene = scene;
    this._musicVolume = 0.6;
    this._sfxVolume = 0.8;
    this._currentMusic = null;
    this._muted = false;
  }

  /**
   * Reproduce música de fondo en loop.
   * Si ya hay música, la detiene antes.
   * @param {string} key — Clave del asset de audio
   * @param {number} [fadeIn=500] — ms de fade in
   */
  playMusic(key, fadeIn = 500) {
    if (this._currentMusic) {
      this._currentMusic.stop();
      this._currentMusic.destroy();
    }
    if (!this.scene.sound.get(key) && !this.scene.cache.audio.has(key)) {
      console.warn(`[AudioManager] Audio no encontrado: ${key}`);
      return;
    }
    this._currentMusic = this.scene.sound.add(key, {
      loop: true,
      volume: this._muted ? 0 : this._musicVolume,
    });
    this._currentMusic.play();

    if (fadeIn > 0 && !this._muted) {
      this._currentMusic.setVolume(0);
      this.scene.tweens.add({
        targets: this._currentMusic,
        volume: this._musicVolume,
        duration: fadeIn,
      });
    }
  }

  /**
   * Para la música actual con fade out.
   * @param {number} [fadeOut=500]
   */
  stopMusic(fadeOut = 500) {
    if (!this._currentMusic) return;
    const music = this._currentMusic;
    this._currentMusic = null;

    if (fadeOut > 0) {
      this.scene.tweens.add({
        targets: music,
        volume: 0,
        duration: fadeOut,
        onComplete: () => {
          music.stop();
          music.destroy();
        },
      });
    } else {
      music.stop();
      music.destroy();
    }
  }

  /**
   * Reproduce un efecto de sonido (SFX).
   * @param {string} key
   * @param {object} [config]
   */
  playSFX(key, config = {}) {
    if (!this.scene.cache.audio.has(key)) return;
    if (this._muted) return;
    this.scene.sound.play(key, {
      volume: this._sfxVolume,
      ...config,
    });
  }

  setMusicVolume(vol) {
    this._musicVolume = Math.max(0, Math.min(1, vol));
    if (this._currentMusic && !this._muted) {
      this._currentMusic.setVolume(this._musicVolume);
    }
  }

  setSFXVolume(vol) {
    this._sfxVolume = Math.max(0, Math.min(1, vol));
  }

  getMusicVolume() { return this._musicVolume; }
  getSFXVolume() { return this._sfxVolume; }

  toggleMute() {
    this._muted = !this._muted;
    if (this._currentMusic) {
      this._currentMusic.setVolume(this._muted ? 0 : this._musicVolume);
    }
    return this._muted;
  }

  isMuted() { return this._muted; }
}
