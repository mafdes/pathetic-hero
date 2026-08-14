/**
 * GoblinSpriteBuilder.js — Generador de Sprites Pixel Art Transparentes para el Goblin.
 * 
 * Genera fotograma a fotograma en textura Canvas de Phaser con transparencia 100% limpia (cero fondo).
 * Soporta animación de respiración idle, ataque con garrote, recibir golpe y caída derrotado.
 */

export function buildGoblinTextureFrames(scene) {
  const w = 64;
  const h = 64;

  const frames = ['goblin_idle_0', 'goblin_idle_1', 'goblin_attack', 'goblin_hurt', 'goblin_die'];

  frames.forEach((frameKey, frameIdx) => {
    if (scene.textures.exists(frameKey)) scene.textures.remove(frameKey);

    const canvasTexture = scene.textures.createCanvas(frameKey, w, h);
    const ctx = canvasTexture.getContext();
    ctx.clearRect(0, 0, w, h);

    // Paleta de colores Pixel Art
    const C = {
      SKIN: '#388e3c',
      SKIN_DARK: '#1b5e20',
      SKIN_LIGHT: '#66bb6a',
      EYES: '#ffeb3b',
      PUPIL: '#d50000',
      LEATHER: '#5d4037',
      METAL: '#78909c',
      WOOD: '#8d6e63',
      SPIKE: '#eeeeee',
    };

    // Auxiliar para pintar píxeles individuales o bloques
    const p = (x, y, color, size = 1) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, size, size);
    };

    const rect = (x, y, width, height, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);
    };

    // VARIACIONES POR FOTOGRAMA
    if (frameKey === 'goblin_idle_0' || frameKey === 'goblin_idle_1') {
      const breathY = (frameKey === 'goblin_idle_1') ? -1 : 0;
      const earAngle = (frameKey === 'goblin_idle_1') ? 1 : 0;

      // Sombra proyectada sutil bajo pies (transparente)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(32, 58, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pies / Botas
      rect(22, 50, 6, 6, C.LEATHER);
      rect(36, 50, 6, 6, C.LEATHER);

      // Piernas
      rect(24, 44, 4, 6, C.SKIN_DARK);
      rect(36, 44, 4, 6, C.SKIN_DARK);

      // Torso & Tapa de cuero
      rect(20, 28 + breathY, 24, 16, C.LEATHER);
      rect(22, 30 + breathY, 20, 12, C.SKIN);
      rect(26, 32 + breathY, 12, 10, C.LEATHER);

      // Brazos
      rect(14, 30 + breathY, 6, 12, C.SKIN); // Brazo izquierdo (Escudo)
      rect(44, 30 + breathY, 6, 12, C.SKIN); // Brazo derecho (Garrote)

      // Escudo (Izquierda)
      rect(8, 28 + breathY, 8, 16, C.WOOD);
      rect(7, 27 + breathY, 10, 2, C.METAL);
      rect(7, 43 + breathY, 10, 2, C.METAL);
      p(12, 35 + breathY, C.METAL, 2); // Umbo central

      // Garrote con púas (Derecha)
      rect(48, 22 + breathY, 4, 20, C.WOOD);
      rect(46, 18 + breathY, 8, 10, C.WOOD);
      p(45, 20 + breathY, C.SPIKE, 2);
      p(54, 22 + breathY, C.SPIKE, 2);

      // Cabeza
      rect(20, 12 + breathY, 24, 18, C.SKIN);
      rect(22, 10 + breathY, 20, 2, C.SKIN_LIGHT);
      rect(22, 28 + breathY, 20, 3, C.SKIN_DARK);

      // Orejas puntiagudas de Goblin
      // Oreja Izq
      rect(8, 14 + breathY + earAngle, 12, 4, C.SKIN);
      rect(4, 12 + breathY + earAngle, 6, 3, C.SKIN_DARK);
      // Oreja Der
      rect(44, 14 + breathY - earAngle, 12, 4, C.SKIN);
      rect(54, 12 + breathY - earAngle, 6, 3, C.SKIN_DARK);

      // Ojos amarillos mirándote de frente
      rect(24, 18 + breathY, 5, 4, C.EYES);
      rect(35, 18 + breathY, 5, 4, C.EYES);
      rect(26, 19 + breathY, 2, 2, C.PUPIL);
      rect(36, 19 + breathY, 2, 2, C.PUPIL);

      // Nariz puntiaguda y Boca con Colmillo
      rect(30, 20 + breathY, 4, 5, C.SKIN_DARK);
      rect(26, 25 + breathY, 12, 2, C.SKIN_DARK);
      p(27, 24 + breathY, C.SPIKE, 2); // Colmillo sale hacia arriba
      p(35, 24 + breathY, C.SPIKE, 2);

    } else if (frameKey === 'goblin_attack') {
      // FOTOGRAMA DE ATAQUE (Garrote descargando hacia adelante)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(32, 58, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      rect(20, 48, 6, 8, C.LEATHER);
      rect(38, 48, 6, 8, C.LEATHER);
      rect(22, 30, 24, 18, C.SKIN);
      rect(24, 32, 20, 14, C.LEATHER);

      // Cabeza gritando
      rect(20, 16, 24, 18, C.SKIN);
      rect(8, 18, 12, 4, C.SKIN_DARK);
      rect(44, 14, 12, 4, C.SKIN_DARK);

      // Ojos rojos de furia
      rect(24, 20, 5, 4, C.PUPIL);
      rect(35, 20, 5, 4, C.PUPIL);

      // Boca abierta gritando
      rect(26, 26, 12, 6, '#000000');
      p(27, 26, C.SPIKE, 2);
      p(35, 26, C.SPIKE, 2);

      // Garrote descargando hacia adelante arriba
      rect(44, 2, 8, 28, C.WOOD);
      rect(42, 0, 12, 12, C.WOOD);
      p(40, 2, C.SPIKE, 3);
      p(54, 4, C.SPIKE, 3);

    } else if (frameKey === 'goblin_hurt') {
      // FOTOGRAMA DE DOLOR (Flinch hacia atrás)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(32, 58, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      rect(18, 48, 6, 8, C.LEATHER);
      rect(32, 48, 6, 8, C.LEATHER);
      rect(18, 28, 24, 20, C.SKIN);

      rect(14, 10, 24, 18, C.SKIN);
      rect(2, 12, 12, 4, C.SKIN_DARK);
      rect(38, 8, 12, 4, C.SKIN_DARK);

      p(18, 14, C.EYES, 3);
      p(28, 14, C.EYES, 3);
      rect(20, 22, 12, 3, '#000000');

    } else if (frameKey === 'goblin_die') {
      // FOTOGRAMA DE DERROTA (Tendido en el suelo)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(32, 54, 24, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      rect(10, 46, 44, 12, C.SKIN_DARK);
      rect(14, 44, 36, 10, C.LEATHER);
      rect(40, 42, 14, 14, C.SKIN);

      p(44, 46, '#ffffff', 2);
      p(48, 46, '#ffffff', 2);
    }

    canvasTexture.refresh();
  });
}
