/**
 * constants.js — Tokens de diseño globales para Pathetic Hero
 * Paleta retro inspirada en SNES/Mega Drive + estética medieval oscura
 */

// ─── Resolución Base ────────────────────────────────────────────────────────
// 960×540 es el canvas interno. Phaser lo escala con FIT para llenar la pantalla.
// Los sprites pixel art se dibujan a escala ×3 (diseñados en 320×180 lógicos).
export const BASE_WIDTH = 960;
export const BASE_HEIGHT = 540;

// ─── Paleta de Colores ───────────────────────────────────────────────────────
export const COLORS = {
  // Fondos
  BG_DARK: 0x0d0613,        // Negro profundo (fondo exterior HTML)
  BG_DEEP: 0x1a0a2e,        // Púrpura muy oscuro (fondo principal juego)
  BG_STONE: 0x3d3d6b,       // Azul pizarra (muros, piedra)
  BG_STONE_LIGHT: 0x5a5a8a, // Piedra iluminada

  // Dorados / UI principal
  GOLD: 0xd4a017,           // Oro envejecido (destacados, marcos)
  GOLD_LIGHT: 0xf0c040,     // Oro brillante (hover, selección)
  GOLD_DARK: 0x8b6914,      // Oro oscuro (sombras de marcos)

  // Pergamino / texto
  PARCHMENT: 0xc8a97a,      // Beige cálido (fondos de pergamino)
  TEXT_MAIN: 0xf0e6d3,      // Crema (texto principal)
  TEXT_SHADOW: 0x2a1a0a,    // Sombra de texto

  // Semáforo
  SUCCESS: 0x2d6a4f,        // Verde bosque (éxito, zona dorada OK)
  SUCCESS_BRIGHT: 0x4caf77, // Verde brillante
  DANGER: 0xc42b1c,         // Carmesí retro (peligro, error)
  DANGER_BRIGHT: 0xff4444,  // Rojo brillante

  // Magia / acento
  MAGIC: 0x7b2d8b,          // Púrpura mágico
  MAGIC_BRIGHT: 0xb347d4,   // Púrpura brillante
  MAGIC_GLOW: 0xd484f5,     // Brillo mágico

  // UI neutros
  UI_PANEL: 0x22143a,       // Fondo de paneles UI
  UI_BORDER: 0x6a4e8a,      // Borde de paneles
  WHITE: 0xffffff,
  BLACK: 0x000000,
};

// ─── Colores CSS (para estilo HTML externo) ─────────────────────────────────
export const CSS_COLORS = {
  BG_DARK: "#0d0613",
  BG_DEEP: "#1a0a2e",
  GOLD: "#d4a017",
  TEXT_MAIN: "#f0e6d3",
  PARCHMENT: "#c8a97a",
};

// ─── Tipografía ──────────────────────────────────────────────────────────────
export const FONTS = {
  PRIMARY: "Press Start 2P",
  FALLBACK: "monospace",
};

// Tamaños de fuente en píxeles del canvas (960×540)
export const FONT_SIZES = {
  TITLE:    "32px",   // Títulos principales
  HEADING:  "22px",   // Subtítulos de sección
  BODY:     "16px",   // Texto de juego normal
  SMALL:    "12px",   // Hints, versión, secundarios
  TINY:     "10px",   // Etiquetas muy pequeñas
};

// ─── Profundidades (Z-index Phaser) ─────────────────────────────────────────
export const DEPTHS = {
  BG: 0,
  TILEMAP: 10,
  ENTITIES: 20,
  PLAYER: 30,
  FX: 40,
  UI_BG: 50,
  UI: 60,
  DIALOG: 70,
  OVERLAY: 80,
  CURSOR: 90,
};

// ─── Tiempos y Animación ─────────────────────────────────────────────────────
export const TIMING = {
  TYPEWRITER_DELAY: 40,     // ms por carácter en typewriter
  TYPEWRITER_FAST: 20,      // ms al acelerar (hold skip)
  COOLDOWN_AFTER_RESULT: 600, // ms antes de aceptar input tras resultado
  TRANSITION_DURATION: 400, // ms para fundidos entre escenas
  CURSOR_BLINK: 500,        // ms para parpadeo de cursor
};

// ─── Pruebas del Gremio ──────────────────────────────────────────────────────
export const CHALLENGES = {
  DEXTERITY: "dexterity",
  CONSTITUTION: "constitution",
  STRENGTH: "strength",
  AGILITY: "agility",
  INTELLIGENCE: "intelligence",
};

export const CHALLENGE_LABELS = {
  [CHALLENGES.DEXTERITY]: "DESTREZA",
  [CHALLENGES.CONSTITUTION]: "CONSTITUCIÓN",
  [CHALLENGES.STRENGTH]: "FUERZA",
  [CHALLENGES.AGILITY]: "AGILIDAD",
  [CHALLENGES.INTELLIGENCE]: "INTELIGENCIA",
};

// ─── Escenas (nombres de registro en Phaser) ─────────────────────────────────
export const SCENES = {
  BOOT: "BootScene",
  PRELOAD: "PreloadScene",
  INTRO: "IntroScene",
  MAIN_MENU: "MainMenuScene",
  OPTIONS: "OptionsScene",
  CONTROLS: "ControlsScene",
  GUILD_REPORT: "GuildReportScene",
  DEXTERITY: "DexterityScene",
  CONSTITUTION: "ConstitutionScene",
  STRENGTH: "StrengthScene",
  AGILITY: "AgilityScene",
  INTELLIGENCE: "IntelligenceScene",
  CLASS_SELECTION: "ClassSelectionScene",
  ADVENTURE: "AdventureScene",
};

// ─── Generador de Nombres ────────────────────────────────────────────────────
export const HERO_NAME_PREFIXES = [
  "Sir", "Lord", "Brother", "Frater", "Magister",
  "El Gran", "El Temible", "El Mediocre",
];

export const HERO_NAME_ADJECTIVES = [
  "Baldur", "Gareth", "Edwyn", "Aldric", "Brennus",
  "Theron", "Corvus", "Malachar", "Griswald",
];

export const HERO_NAME_SUFFIXES = [
  "el Torpe", "de la Pradera", "sin Gracia",
  "el Incomprendido", "el Valiente (en su opinión)",
  "el Eterno Becario",
];
