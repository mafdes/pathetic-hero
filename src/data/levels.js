/**
 * levels.js — Definición de niveles de la mazmorra.
 *
 * ARQUITECTURA:
 *  - map:       ASCII puro — solo estructura (muro/suelo/puertas/items estáticos)
 *               Caracteres: # muro  . suelo  @ inicio  D puerta  S escaleras
 *                           F fuente  R runa  C cofre  T trampa  E encuentro
 *                           K llave   (ítem recogible — abre puertas D)
 *  - encounters: tabla separada que mapea posiciones "col,row" a datos de encuentro.
 *               Cada encuentro define los enemigos que aparecen al entrar en esa tile.
 *
 * Flujo llave-puerta:
 *   1. Jugador pisa K → recoge la llave (se guarda en playerInventory.keys)
 *   2. Jugador intenta pasar por D → si tiene llave, la consume y abre la puerta
 *
 * Para editar el mapa visual usa: map-editor.html (pon 'E' donde quieras un encuentro)
 * Para editar encuentros, edita el array encounters[] de cada nivel.
 */

// ── CATÁLOGO DE ENEMIGOS ────────────────────────────────────────────────────
// Arquetipos base con debilidades tácticas (weakness: 'magic' | 'physical')
export const ENEMY_TYPES = {
  goblin: {
    key:      'goblin',
    sprite:   'entity-goblin',
    name:     'Goblin Explorador',
    hp:       16, maxHp: 16,
    attack:   4,
    weakness: null, // Equilibrado
    xp:       5,
    desc:     'Pequeño, escabullidizo y ruidoso.',
  },
  goblin_alpha: {
    key:      'goblin_alpha',
    sprite:   'entity-goblin',
    name:     'Goblin Jefe',
    hp:       32, maxHp: 32,
    attack:   7,
    weakness: null,
    xp:       15,
    desc:     'Ligeramente más grande y con casco robado.',
  },
  trasgo: {
    key:      'trasgo',
    sprite:   'entity-goblin',
    name:     'Trasgo Archivero',
    hp:       26, maxHp: 26,
    attack:   6,
    weakness: 'magic', // Armadura pesada → conductor de magia ✨
    xp:       10,
    desc:     'Lleva cota de malla pesada. La magia lo electrocuta.',
  },
  mago_novato: {
    key:      'mago_novato',
    sprite:   'entity-goblin',
    name:     'Mago Novato del Gremio',
    hp:       14, maxHp: 14,
    attack:   8,
    weakness: 'physical', // Túnica ligera → cae ante la fuerza bruta ⚔️
    xp:       12,
    magic:    true,
    desc:     'Aprendió tres hechizos. Sin armadura física.',
  },
  esqueleto: {
    key:      'esqueleto',
    sprite:   'entity-goblin',
    name:     'Esqueleto Guardián',
    hp:       20, maxHp: 20,
    attack:   5,
    weakness: 'magic', // Frágil a la luz arcana ✨
    xp:       8,
    desc:     'Huesos antiguos sensibles al choque arcano.',
  },
  minotauro: {
    key:      'minotauro',
    sprite:   'entity-goblin',
    name:     'Minotauro del Laberinto',
    hp:       55, maxHp: 55,
    attack:   10,
    weakness: 'magic', // Embaste brutal, piel gruesa vulnerable a la magia ✨
    xp:       50,
    boss:     true,
    desc:     'Subjefe implacable. Un cornazo tuyo te manda al informe del gremio.',
  },
};

// ── HELPER ──────────────────────────────────────────────────────────────────
/** Crea un enemigo a partir de un arquetipo, con overrides opcionales */
function enemy(typeKey, overrides = {}) {
  return { ...ENEMY_TYPES[typeKey], ...overrides };
}

// ── NIVELES (Plan de 8 niveles con biomas visuales) ─────────────────────────
export const LEVELS = [
  // ──────────────────────────────────────────────────────────────────────────
  // NIVEL 1 — Mazmorra del Gremio (Planta B1: Sala de Iniciación)
  // Tema visual: Púrpura Místico
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Planta B1 — Sala de Iniciación',
    theme: {
      floor:       0x22143a,
      floorBorder: 0x3d285c,
      wall:        0x0f071c,
      wallBorder:  0x6a4e8a,
      wallFill:    0x2d1b46,
    },
    map: [
      "#############",
      "#@..........#",
      "#.##.######.#",
      "#....#.E....#", // (7,3) Emboscada doble goblins
      "#.##.#.####.#",
      "#.#..#......#",
      "#.#.##.####.#",
      "#...T......##",
      "###.######..#",
      "#R..#...E#..#", // (8,9) Mago novato (débil a físico)
      "#.###.##.#.##",
      "#.....#F.#..#",
      "#.###.####.##",
      "##..T....#C.#",
      "#.####D###..#",
      "#....#.E....#", // (7,15) Trasgo acorazado + Esqueleto (débiles a magia)
      "#.##.#..####.",
      "#K...#..E..S#", // (8,17) Jefe Final de Planta: Goblin Alfa 👑
      "#############",
    ],

    // Muestra de todos los arquetipos para probar el sistema táctico
    encounters: {
      "7,3": {
        label: 'Emboscada Doble Goblin',
        enemies: [
          enemy('goblin', { name: 'Goblin Explorador', hp: 16, maxHp: 16 }),
          enemy('goblin', { name: 'Goblin Emboscador', hp: 16, maxHp: 16 }),
        ],
      },
      "8,9": {
        label: 'Mago en Prácticas',
        enemies: [
          enemy('mago_novato', { name: 'Mago Novato del Gremio' }), // ⚔️ Débil a Físico
        ],
      },
      "7,15": {
        label: 'Guardián Acorazado y Esqueleto',
        enemies: [
          enemy('trasgo',    { name: 'Trasgo Archivero', hp: 24, maxHp: 24 }), // ✨ Débil a Magia
          enemy('esqueleto', { name: 'Esqueleto Reanimado', hp: 20, maxHp: 20 }), // ✨ Débil a Magia
        ],
      },
      "8,17": {
        label: 'Jefe de Planta B1',
        enemies: [
          enemy('goblin_alpha', { name: 'Jefe Goblin Alfa', hp: 36, maxHp: 36, attack: 8 }), // Boss final Nivel 1
        ],
      },
    },

    tileSize: 52,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // NIVEL 2 — Archivos de la Cripta (Planta B2)
  // Tema visual: Cripta Verde-Cian
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 2,
    name: 'Planta B2 — Archivos de la Cripta',
    theme: {
      floor:       0x14282e,
      floorBorder: 0x244852,
      wall:        0x07151c,
      wallBorder:  0x4e788a,
      wallFill:    0x1b3446,
    },
    map: [
      "#############",
      "#...........#",
      "#.###.#####.#",
      "#.#.E.#.....#",
      "#.#.###.###.#",
      "#...T.....E.#",
      "#.#####.###.#",
      "#.......#...#",
      "#.###.###.#.#",
      "#.#.E.....#.#",
      "#.#.#######.#",
      "#R..#...F...#",
      "#.###.#####.#",
      "#.....#.C...#",
      "#.###.#.###.#",
      "#.#...#...E.#",
      "#.#.#####.#.#",
      "#@..#.....S.#",
      "#############",
    ],
    encounters: {
      "5,3": {
        label: 'Archivista Hostil',
        enemies: [
          enemy('trasgo', { name: 'Trasgo Archivista' }),
          enemy('esqueleto'),
        ],
      },
      "10,5": {
        label: 'Patrulla Esquelética',
        enemies: [
          enemy('esqueleto'),
          enemy('esqueleto'),
        ],
      },
      "5,9": {
        label: 'Mago en Prácticas',
        enemies: [
          enemy('mago_novato'),
          enemy('goblin', { name: 'Goblin Escudero' }),
        ],
      },
      "10,15": {
        label: 'Jefe de Planta',
        enemies: [
          enemy('goblin_alpha'),
          enemy('goblin'),
          enemy('goblin'),
        ],
      },
    },
    tileSize: 52,
  },
];

/** Devuelve los datos del nivel por ID (1-based) */
export function getLevel(id) {
  return LEVELS.find(l => l.id === id) ?? LEVELS[0];
}
