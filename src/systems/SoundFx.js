/**
 * SoundFx.js — Sintetizador WebAudio 8-Bit para Pathetic Hero
 *
 * Genera efectos de sonido y melodías retro en tiempo real por código
 * utilizando la Web Audio API nativa del navegador. Cero descargas.
 */

class SoundFxEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.3;

    // Escuchar el primer clic/toque para desbloquear el AudioContext (política de autoplay del navegador)
    if (typeof window !== "undefined") {
      const unlock = () => {
        this._initCtx();
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume();
        }
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      };
      window.addEventListener("pointerdown", unlock);
      window.addEventListener("keydown", unlock);
    }
    this._activeBgmInterval = null;
    this._bgmMode = null;
  }

  _initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  _ensureCtx() {
    this._initCtx();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx && !this.muted;
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.muted) this.stopBgm();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopBgm();
    return this.muted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // ── MÚSICA DE FONDO 8-BIT EN BUCLE (BGM) ──────────────────────────────────
  playExplorationBgm() {
    if (this._bgmMode === "exploration") return;
    this.stopBgm();
    if (!this._ensureCtx()) return;

    this._bgmMode = "exploration";
    const notes = [110, 130.81, 164.81, 196.0, 174.61, 146.83]; // A2, C3, E3, G3, F3, D3
    let noteIdx = 0;

    const playStep = () => {
      if (this._bgmMode !== "exploration" || !this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const freq = notes[noteIdx % notes.length];
      noteIdx++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.volume * 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    };

    playStep();
    this._activeBgmInterval = setInterval(playStep, 400);
  }

  playCombatBgm() {
    if (this._bgmMode === "combat") return;
    this.stopBgm();
    if (!this._ensureCtx()) return;

    this._bgmMode = "combat";
    const notes = [164.81, 196.0, 246.94, 329.63, 293.66, 246.94, 196.0, 164.81]; // E3, G3, B3, E4, D4...
    let noteIdx = 0;

    const playStep = () => {
      if (this._bgmMode !== "combat" || !this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      const freq = notes[noteIdx % notes.length];
      noteIdx++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.volume * 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    };

    playStep();
    this._activeBgmInterval = setInterval(playStep, 200);
  }

  stopBgm() {
    if (this._activeBgmInterval) {
      clearInterval(this._activeBgmInterval);
      this._activeBgmInterval = null;
    }
    this._bgmMode = null;
  }

  // ── EFECTOS RETRO 8-BIT ──────────────────────────────────────────────────

  /** Paso del personaje */
  playStep() {
    if (!this._ensureCtx()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.04);

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /** Golpe / Ataque físico */
  playHit() {
    if (!this._ensureCtx()) return;
    const now = this.ctx.currentTime;

    // Onda cuadrada con caída rápida de frecuencia
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /** Hechizo / Magia */
  playSpell() {
    if (!this._ensureCtx()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

    gain.gain.setValueAtTime(this.volume * 0.35, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** Recoger Llave / Moneda */
  playKey() {
    if (!this._ensureCtx()) return;
    const now = this.ctx.currentTime;

    const playTone = (freq, startTime, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(this.volume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playTone(987.77, now, 0.08);         // B5
    playTone(1318.51, now + 0.08, 0.15); // E6
  }

  /** Abrir Puerta */
  playDoor() {
    if (!this._ensureCtx()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.2);

    gain.gain.setValueAtTime(this.volume * 0.35, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Trampa activada */
  playTrap() {
    if (!this._ensureCtx()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Fuente de curación */
  playFountain() {
    if (!this._ensureCtx()) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = now + idx * 0.06;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(this.volume * 0.25, st);
      gain.gain.exponentialRampToValueAtTime(0.01, st + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + 0.12);
    });
  }

  /** Fanfarria de victoria */
  playVictory() {
    if (!this._ensureCtx()) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.1 },  // C5
      { f: 659.25, d: 0.1 },  // E5
      { f: 783.99, d: 0.1 },  // G5
      { f: 1046.50, d: 0.3 }  // C6
    ];

    let t = now;
    notes.forEach(({ f, d }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(this.volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + d);
      t += d + 0.02;
    });
  }

  /** Melodía de derrota */
  playDefeat() {
    if (!this._ensureCtx()) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 392.00, d: 0.15 }, // G4
      { f: 329.63, d: 0.15 }, // E4
      { f: 261.63, d: 0.15 }, // C4
      { f: 196.00, d: 0.35 }  // G3
    ];

    let t = now;
    notes.forEach(({ f, d }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(this.volume * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + d);
      t += d + 0.03;
    });
  }

  /** Clic de botón */
  playButtonClick() {
    if (!this._ensureCtx()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export const SoundFx = new SoundFxEngine();
