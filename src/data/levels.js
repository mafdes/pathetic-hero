/**
 * levels.js — Catálogo Definitivo de Enemigos y Configuración de Niveles (Nivel 1 al 8).
 *
 * ARQUITECTURA:
 *  - Los niveles 1 a 8 leen mapas Tiled desde `public/assets/maps/nivelX.json`.
 *  - Cada enemigo tiene stats fijos, debilidades elementales y recompensas de EXP.
 */

// ── CATÁLOGO DE ENEMIGOS DE LA MAZMORRA ─────────────────────────────────────
export const ENEMY_TYPES = {
  goblin: {
    key:      'goblin',
    name:     'Goblin Explorador',
    hp:       10, maxHp: 10,
    attack:   3,
    xp:       15,
    desc:     'Pequeño y escabullidizo. Débil a Físico y Fuego.',
  },
  mago_novato: {
    key:      'mago_novato',
    name:     'Mago Novato',
    hp:       8, maxHp: 8,
    attack:   4,
    xp:       20,
    desc:     'Sin armadura física. Muy débil a los golpes físicos.',
  },
  trasgo: {
    key:      'trasgo',
    name:     'Trasgo Archivero',
    hp:       14, maxHp: 14,
    attack:   5,
    xp:       25,
    desc:     'Lleva armadura de hierro. Débil a los hechizos de Hielo y Rayo.',
  },
  goblin_alpha: {
    key:      'goblin_alpha',
    name:     'Jefe Goblin Alfa',
    hp:       22, maxHp: 22,
    attack:   6,
    xp:       50,
    boss:     true,
    desc:     'Líder tribal temido. Débil a Fuego y Rayo.',
  },
  esqueleto: {
    key:      'esqueleto',
    name:     'Esqueleto Guardián',
    hp:       16, maxHp: 16,
    attack:   5,
    xp:       30,
    desc:     'Guerrero de huesos antiguos. Vulnerable a Magia Arcana y Fuego.',
  },
  minotauro: {
    key:      'minotauro',
    name:     'Minotauro del Laberinto (Mini-Jefe Nivel 4)',
    hp:       38, maxHp: 38,
    attack:   9,
    xp:       80,
    boss:     true,
    desc:     'Subjefe colosal del Ecuador de la mazmorra. Débil a Hielo.',
  },
  golem: {
    key:      'golem',
    name:     'Guardián Golem de Piedra',
    hp:       28, maxHp: 28,
    attack:   8,
    xp:       60,
    desc:     'Constructo de roca dura. Débil a Fuego y Rayo.',
  },
  lord_oscuro: {
    key:      'lord_oscuro',
    name:     'LORD OSCURO DEL TRIBUNAL (JEFE FINAL NIVEL 8)',
    hp:       65, maxHp: 65,
    attack:   14,
    xp:       150,
    boss:     true,
    desc:     'El tirano supremo de la mazmorra. ¡Derrótalo para completar la campaña!',
  },
};

/** Crea un enemigo a partir de un arquetipo, con overrides opcionales */
export function enemy(typeKey, overrides = {}) {
  const base = ENEMY_TYPES[typeKey] || ENEMY_TYPES.goblin;
  return { ...base, ...overrides };
}

/** Configuración estructural y metadatos de los 8 niveles de mazmorra */
export const LEVELS = [
  { id: 1, name: 'Planta B1 — Sala de Iniciación', boss: 'goblin_alpha' },
  { id: 2, name: 'Planta B2 — Archivos de la Cripta', boss: 'trasgo' },
  { id: 3, name: 'Planta B3 — Pasillos Oscuros', boss: 'esqueleto' },
  { id: 4, name: 'Planta B4 — Catacumbas de los Héroes (ECUADOR)', boss: 'minotauro' },
  { id: 5, name: 'Planta B5 — Laboratorio Abandonado', boss: 'mago_novato' },
  { id: 6, name: 'Planta B6 — Prisión del Gremio', boss: 'golem' },
  { id: 7, name: 'Planta B7 — Ala Prohibida Arcana', boss: 'golem' },
  { id: 8, name: 'Planta B8 — Gran Tribunal del Señor Oscuro (FINAL)', boss: 'lord_oscuro' },
];

/** Devuelve los datos del nivel por ID (1-based) */
export function getLevel(id) {
  return LEVELS.find(l => l.id === id) ?? LEVELS[0];
}
