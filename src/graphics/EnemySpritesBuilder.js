/**
 * EnemySpritesBuilder.js — Generador de Sprites Pixel Art Transparentes para TODOS los enemigos.
 * 
 * Genera fotograma a fotograma en texturas Canvas de Phaser con transparencia 100% limpia (cero fondo).
 * Crea animaciones de reposo, ataque, dolor y muerte para:
 * 1. Goblin
 * 2. Mago Novato
 * 3. Trasgo Archivero (Acorazado)
 * 4. Esqueleto Guardián
 * 5. Minotauro del Laberinto (Mini-Jefe Nivel 4)
 * 6. Golem de Piedra (Nivel 6/7)
 * 7. Lord Oscuro (Gran Jefe Final Nivel 8)
 */

export function buildAllEnemyTextureFrames(scene) {
  const w = 64;
  const h = 64;

  const types = ['goblin', 'mago_novato', 'trasgo', 'esqueleto', 'minotauro', 'golem', 'lord_oscuro'];
  const states = ['idle_0', 'idle_1', 'attack', 'hurt', 'die'];

  types.forEach((typeKey) => {
    states.forEach((stateKey) => {
      const frameKey = `${typeKey}_${stateKey}`;
      if (scene.textures.exists(frameKey)) scene.textures.remove(frameKey);

      const canvasTexture = scene.textures.createCanvas(frameKey, w, h);
      const ctx = canvasTexture.getContext();
      ctx.clearRect(0, 0, w, h);

      const p = (x, y, color, size = 1) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
      };

      const rect = (x, y, width, height, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
      };

      // ── 1. GOBLIN ──────────────────────────────────────────────────────────
      if (typeKey === 'goblin') {
        const C = { SKIN: '#388e3c', DARK: '#1b5e20', EYES: '#ffeb3b', LEATHER: '#5d4037', METAL: '#78909c', WOOD: '#8d6e63', SPIKE: '#eee' };
        if (stateKey.startsWith('idle')) {
          const bY = (stateKey === 'idle_1') ? -1 : 0;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; ctx.beginPath(); ctx.ellipse(32, 58, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
          rect(22, 50, 6, 6, C.LEATHER); rect(36, 50, 6, 6, C.LEATHER);
          rect(24, 44, 4, 6, C.DARK); rect(36, 44, 4, 6, C.DARK);
          rect(20, 28 + bY, 24, 16, C.LEATHER); rect(22, 30 + bY, 20, 12, C.SKIN);
          rect(14, 30 + bY, 6, 12, C.SKIN); rect(44, 30 + bY, 6, 12, C.SKIN);
          rect(8, 28 + bY, 8, 16, C.WOOD); rect(7, 27 + bY, 10, 2, C.METAL);
          rect(48, 22 + bY, 4, 20, C.WOOD); rect(46, 18 + bY, 8, 10, C.WOOD); p(45, 20 + bY, C.SPIKE, 2);
          rect(20, 12 + bY, 24, 18, C.SKIN); rect(8, 14 + bY, 12, 4, C.SKIN); rect(44, 14 + bY, 12, 4, C.SKIN);
          rect(24, 18 + bY, 5, 4, C.EYES); rect(35, 18 + bY, 5, 4, C.EYES); rect(26, 19 + bY, 2, 2, '#d50000'); rect(36, 19 + bY, 2, 2, '#d50000');
          rect(26, 25 + bY, 12, 2, C.DARK); p(27, 24 + bY, C.SPIKE, 2);
        } else if (stateKey === 'attack') {
          rect(20, 30, 24, 20, C.SKIN); rect(20, 16, 24, 18, C.SKIN); rect(8, 18, 12, 4, C.DARK); rect(44, 14, 12, 4, C.DARK);
          rect(24, 20, 5, 4, '#d50000'); rect(35, 20, 5, 4, '#d50000'); rect(26, 26, 12, 6, '#000');
          rect(44, 2, 8, 28, C.WOOD); rect(42, 0, 12, 12, C.WOOD); p(40, 2, C.SPIKE, 3);
        } else if (stateKey === 'hurt') {
          rect(18, 28, 24, 20, C.SKIN); rect(14, 10, 24, 18, C.SKIN); rect(2, 12, 12, 4, C.DARK); rect(38, 8, 12, 4, C.DARK);
          p(18, 14, C.EYES, 3); p(28, 14, C.EYES, 3); rect(20, 22, 12, 3, '#000');
        } else if (stateKey === 'die') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.beginPath(); ctx.ellipse(32, 54, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
          rect(10, 46, 44, 12, C.DARK); rect(40, 42, 14, 14, C.SKIN); p(44, 46, '#fff', 2); p(48, 46, '#fff', 2);
        }
      }

      // ── 2. MAGO NOVATO ─────────────────────────────────────────────────────
      else if (typeKey === 'mago_novato') {
        const C = { ROBE: '#512da8', DARK_ROBE: '#311b92', HOOD: '#7b1fa2', GOLD: '#ffd54f', ARCANE: '#00e5ff', STAFF: '#6d4c41' };
        if (stateKey.startsWith('idle')) {
          const bY = (stateKey === 'idle_1') ? -1 : 0;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; ctx.beginPath(); ctx.ellipse(32, 58, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
          rect(20, 28 + bY, 24, 26, C.ROBE); rect(22, 30 + bY, 20, 22, C.DARK_ROBE); rect(28, 28 + bY, 8, 26, C.GOLD);
          rect(12, 12 + bY, 4, 44, C.STAFF); rect(10, 8 + bY, 8, 8, C.ARCANE); p(12, 6 + bY, '#ffffff', 4);
          rect(20, 14 + bY, 24, 16, C.DARK_ROBE); rect(18, 4 + bY, 28, 12, C.HOOD); rect(24, 0 + bY, 16, 6, C.HOOD);
          rect(24, 18 + bY, 5, 4, C.ARCANE); rect(35, 18 + bY, 5, 4, C.ARCANE);
        } else if (stateKey === 'attack') {
          rect(20, 28, 24, 26, C.ROBE); rect(20, 14, 24, 16, C.DARK_ROBE); rect(18, 4, 28, 12, C.HOOD);
          rect(8, 0, 4, 48, C.STAFF); rect(4, -4, 12, 12, C.ARCANE); p(6, -6, '#ffffff', 6);
          rect(24, 18, 5, 4, C.ARCANE); rect(35, 18, 5, 4, C.ARCANE);
        } else if (stateKey === 'hurt') {
          rect(18, 30, 24, 24, C.ROBE); rect(16, 16, 24, 16, C.DARK_ROBE); rect(14, 6, 28, 12, C.HOOD);
          rect(22, 20, 5, 4, '#ff1744'); rect(33, 20, 5, 4, '#ff1744');
        } else if (stateKey === 'die') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.beginPath(); ctx.ellipse(32, 56, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
          rect(12, 48, 40, 10, C.ROBE); rect(16, 46, 32, 8, C.DARK_ROBE); p(42, 48, C.ARCANE, 3);
        }
      }

      // ── 3. TRASGO ARCHIVERO ──────────────────────────────────────────────
      else if (typeKey === 'trasgo') {
        const C = { STEEL: '#607d8b', DARK_STEEL: '#37474f', LIGHT_STEEL: '#90a4ae', RED: '#d50000', LEATHER: '#4e342e' };
        if (stateKey.startsWith('idle')) {
          const bY = (stateKey === 'idle_1') ? -1 : 0;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.beginPath(); ctx.ellipse(32, 58, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
          rect(20, 48, 8, 8, C.DARK_STEEL); rect(36, 48, 8, 8, C.DARK_STEEL);
          rect(18, 26 + bY, 28, 22, C.STEEL); rect(22, 28 + bY, 20, 18, C.DARK_STEEL);
          rect(6, 24 + bY, 14, 24, C.LIGHT_STEEL); rect(8, 26 + bY, 10, 20, C.DARK_STEEL); rect(11, 34 + bY, 4, 4, C.RED);
          rect(18, 8 + bY, 28, 20, C.STEEL); rect(20, 6 + bY, 24, 4, C.LIGHT_STEEL);
          rect(22, 16 + bY, 20, 4, C.DARK_STEEL); rect(24, 17 + bY, 16, 2, C.RED);
        } else if (stateKey === 'attack') {
          rect(18, 26, 28, 22, C.STEEL); rect(18, 8, 28, 20, C.STEEL); rect(24, 17, 16, 2, C.RED);
          rect(44, 4, 6, 36, C.LEATHER); rect(40, 2, 14, 14, C.LIGHT_STEEL);
        } else if (stateKey === 'hurt') {
          rect(16, 28, 28, 22, C.STEEL); rect(14, 10, 28, 20, C.STEEL); rect(20, 19, 16, 2, '#ff5252');
        } else if (stateKey === 'die') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; ctx.beginPath(); ctx.ellipse(32, 56, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
          rect(10, 46, 44, 12, C.STEEL); rect(14, 44, 36, 10, C.DARK_STEEL);
        }
      }

      // ── 4. ESQUELETO GUARDIÁN ─────────────────────────────────────────────
      else if (typeKey === 'esqueleto') {
        const C = { BONE: '#e0e0e0', DARK_BONE: '#9e9e9e', EYE: '#ffeb3b', SWORD: '#cfd8dc', SHIELD: '#78909c' };
        if (stateKey.startsWith('idle')) {
          const bY = (stateKey === 'idle_1') ? -1 : 0;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.beginPath(); ctx.ellipse(32, 58, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
          rect(24, 46, 3, 10, C.BONE); rect(37, 46, 3, 10, C.BONE);
          rect(28, 28 + bY, 8, 18, C.DARK_BONE);
          for (let i = 0; i < 4; i++) rect(22, 30 + i * 4 + bY, 20, 2, C.BONE);
          rect(10, 26 + bY, 10, 20, C.SHIELD); rect(48, 20 + bY, 3, 26, C.SWORD); rect(46, 20 + bY, 7, 3, C.DARK_BONE);
          rect(22, 10 + bY, 20, 16, C.BONE); rect(24, 24 + bY, 16, 4, C.DARK_BONE);
          rect(25, 15 + bY, 4, 4, '#1a1a1a'); rect(35, 15 + bY, 4, 4, '#1a1a1a');
          p(26, 16 + bY, C.EYE, 2); p(36, 16 + bY, C.EYE, 2);
        } else if (stateKey === 'attack') {
          rect(28, 28, 8, 18, C.DARK_BONE); for (let i = 0; i < 4; i++) rect(22, 30 + i * 4, 20, 2, C.BONE);
          rect(22, 10, 20, 16, C.BONE); p(26, 16, C.EYE, 2); p(36, 16, C.EYE, 2);
          rect(44, 12, 16, 4, C.SWORD); rect(42, 10, 4, 8, C.DARK_BONE);
        } else if (stateKey === 'hurt') {
          rect(26, 30, 8, 18, C.DARK_BONE); rect(20, 12, 20, 16, C.BONE);
          p(24, 18, '#d50000', 2); p(34, 18, '#d50000', 2);
        } else if (stateKey === 'die') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.beginPath(); ctx.ellipse(32, 56, 20, 4, 0, 0, Math.PI * 2); ctx.fill();
          rect(14, 52, 36, 4, C.BONE); rect(20, 48, 8, 8, C.BONE);
        }
      }

      // ── 5. MINOTAURO DEL LABERINTO (MINI-JEFE NIVEL 4) ────────────────────
      else if (typeKey === 'minotauro') {
        const C = { FUR: '#4e342e', DARK_FUR: '#271c19', HORN: '#ffb300', RING: '#ffd54f', EYE: '#d50000', AXE: '#b0bec5' };
        if (stateKey.startsWith('idle')) {
          const bY = (stateKey === 'idle_1') ? -1 : 0;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; ctx.beginPath(); ctx.ellipse(32, 58, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
          rect(18, 46, 10, 10, C.DARK_FUR); rect(36, 46, 10, 10, C.DARK_FUR);
          rect(16, 24 + bY, 32, 22, C.FUR); rect(18, 26 + bY, 28, 18, C.DARK_FUR);
          rect(18, 10 + bY, 28, 18, C.FUR);
          rect(6, 6 + bY, 14, 6, C.HORN); rect(4, 2 + bY, 6, 6, C.HORN);
          rect(44, 6 + bY, 14, 6, C.HORN); rect(54, 2 + bY, 6, 6, C.HORN);
          rect(24, 20 + bY, 16, 8, C.DARK_FUR); rect(30, 26 + bY, 4, 4, C.RING);
          rect(23, 14 + bY, 5, 4, C.EYE); rect(36, 14 + bY, 5, 4, C.EYE);
          rect(50, 8 + bY, 4, 42, C.DARK_FUR); rect(44, 4 + bY, 16, 16, C.AXE);
        } else if (stateKey === 'attack') {
          rect(16, 24, 32, 22, C.FUR); rect(18, 10, 28, 18, C.FUR);
          rect(23, 14, 5, 4, C.EYE); rect(36, 14, 5, 4, C.EYE);
          rect(44, -2, 6, 46, C.DARK_FUR); rect(38, -6, 18, 18, C.AXE);
        } else if (stateKey === 'hurt') {
          rect(14, 26, 32, 22, C.FUR); rect(16, 12, 28, 18, C.FUR);
          rect(21, 16, 5, 4, '#ff1744'); rect(34, 16, 5, 4, '#ff1744');
        } else if (stateKey === 'die') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.beginPath(); ctx.ellipse(32, 56, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
          rect(8, 44, 48, 14, C.DARK_FUR); rect(40, 38, 18, 18, C.FUR);
        }
      }

      // ── 6. GOLEM DE PIEDRA (NIVEL 6/7) ────────────────────────────────────
      else if (typeKey === 'golem') {
        const C = { STONE: '#78909c', DARK_STONE: '#455a64', RUNE: '#00e5ff', EYE: '#00e5ff' };
        if (stateKey.startsWith('idle')) {
          const bY = (stateKey === 'idle_1') ? -1 : 0;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; ctx.beginPath(); ctx.ellipse(32, 58, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
          rect(14, 20 + bY, 36, 26, C.STONE); rect(18, 22 + bY, 28, 22, C.DARK_STONE);
          rect(28, 26 + bY, 8, 14, C.RUNE); // NÚCLEO MÁGICO
          rect(18, 6 + bY, 28, 16, C.STONE);
          rect(24, 12 + bY, 5, 4, C.EYE); rect(35, 12 + bY, 5, 4, C.EYE);
        } else if (stateKey === 'attack') {
          rect(14, 20, 36, 26, C.STONE); rect(18, 6, 28, 16, C.STONE);
          rect(24, 12, 5, 4, C.EYE); rect(35, 12, 5, 4, C.EYE);
          rect(2, 10, 16, 20, C.DARK_STONE); // PUÑO GIGANTE
        } else if (stateKey === 'hurt') {
          rect(12, 22, 36, 26, C.STONE); rect(16, 8, 28, 16, C.STONE);
        } else if (stateKey === 'die') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.beginPath(); ctx.ellipse(32, 56, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
          rect(10, 46, 44, 12, C.DARK_STONE);
        }
      }

      // ── 7. LORD OSCURO (GRAN JEFE FINAL NIVEL 8) ──────────────────────────
      else if (typeKey === 'lord_oscuro') {
        const C = { ARMOR: '#1a002c', PURPLE: '#4a148c', GOLD: '#ffd54f', EYE: '#ff1744', CAPE: '#311b92', SWORD: '#00e5ff' };
        if (stateKey.startsWith('idle')) {
          const bY = (stateKey === 'idle_1') ? -1 : 0;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.beginPath(); ctx.ellipse(32, 58, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
          // Capa gigante mística
          rect(10, 18 + bY, 44, 38, C.CAPE); rect(14, 20 + bY, 36, 34, C.PURPLE);
          // Armadura del Lord
          rect(18, 22 + bY, 28, 24, C.ARMOR); rect(26, 24 + bY, 12, 20, C.GOLD);
          // Yelmo oscuro con corona dorada
          rect(18, 4 + bY, 28, 20, C.ARMOR); rect(16, 2 + bY, 32, 6, C.GOLD);
          // Ojos rojos carmesí
          rect(23, 12 + bY, 6, 4, C.EYE); rect(35, 12 + bY, 6, 4, C.EYE);
          p(25, 13 + bY, '#ffffff', 2); p(37, 13 + bY, '#ffffff', 2);
          // Gran Mandoble Mágico Arcano
          rect(50, 2 + bY, 4, 48, C.SWORD); rect(46, 38 + bY, 12, 4, C.GOLD);
        } else if (stateKey === 'attack') {
          rect(10, 18, 44, 38, C.CAPE); rect(18, 22, 28, 24, C.ARMOR); rect(18, 4, 28, 20, C.ARMOR);
          rect(23, 12, 6, 4, C.EYE); rect(35, 12, 6, 4, C.EYE);
          // Espadazo cósmico devastador
          rect(36, -6, 6, 52, C.SWORD); rect(32, 30, 14, 4, C.GOLD);
        } else if (stateKey === 'hurt') {
          rect(12, 20, 44, 38, C.CAPE); rect(16, 6, 28, 20, C.ARMOR);
          rect(21, 14, 6, 4, '#ff5252'); rect(33, 14, 6, 4, '#ff5252');
        } else if (stateKey === 'die') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.beginPath(); ctx.ellipse(32, 56, 28, 7, 0, 0, Math.PI * 2); ctx.fill();
          rect(6, 42, 52, 16, C.ARMOR); rect(28, 38, 12, 12, C.GOLD);
        }
      }

      canvasTexture.refresh();
    });
  });
}
