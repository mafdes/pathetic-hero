/**
 * constants.js — Tokens de diseño globales para Pathetic Hero (720×1280 HD Vertical)
 */

// ─── Resolución Base ────────────────────────────────────────────────────────
// 720×1280 es la resolución HD interna en orientación VERTICAL (Portrait 9:16).
export const BASE_WIDTH = 720;
export const BASE_HEIGHT = 1280;
export const GAME_VERSION = "v0.3.1";

// ─── Paleta de Colores ───────────────────────────────────────────────────────
export const COLORS = {
  BG_DARK: 0x0d0613,
  BG_DEEP: 0x1a0a2e,
  BG_STONE: 0x3d3d6b,
  BG_STONE_LIGHT: 0x5a5a8a,

  GOLD: 0xd4a017,
  GOLD_LIGHT: 0xf0c040,
  GOLD_DARK: 0x8b6914,

  PARCHMENT: 0xc8a97a,
  TEXT_MAIN: 0xf0e6d3,
  TEXT_SHADOW: 0x2a1a0a,

  SUCCESS: 0x2d6a4f,
  SUCCESS_BRIGHT: 0x4caf77,
  DANGER: 0xc42b1c,
  DANGER_BRIGHT: 0xff4444,

  MAGIC: 0x7b2d8b,
  MAGIC_BRIGHT: 0xb347d4,
  MAGIC_GLOW: 0xd484f5,

  UI_PANEL: 0x22143a,
  UI_BORDER: 0x6a4e8a,
  WHITE: 0xffffff,
  BLACK: 0x000000,
};

export const CSS_COLORS = {
  BG_DARK: "#0d0613",
  BG_DEEP: "#1a0a2e",
  GOLD: "#d4a017",
  TEXT_MAIN: "#f0e6d3",
  PARCHMENT: "#c8a97a",
};

// ─── Tipografía ──────────────────────────────────────────────────────────────
export const FONTS = {
  PRIMARY: '"Press Start 2P"',
  FALLBACK: "monospace",
};

// Tamaños de fuente legibles a 720×1280
export const FONT_SIZES = {
  TITLE:    "80px",   // Títulos principales
  HEADING:  "48px",   // Subtítulos de sección
  BODY:     "32px",   // Texto de juego normal / botones
  SMALL:    "24px",   // Hints, versión, secundarios
  TINY:     "16px",   // Etiquetas muy pequeñas
};

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

export const TIMING = {
  TYPEWRITER_DELAY: 40,
  TYPEWRITER_FAST: 20,
  COOLDOWN_AFTER_RESULT: 600,
  TRANSITION_DURATION: 400,
  CURSOR_BLINK: 500,
};

export const CHALLENGES = {
  DEXTERITY: "dexterity",
  CONSTITUTION: "constitution",
  STRENGTH: "strength",
  AGILITY: "agility",
  WISDOM: "wisdom",
  INTELLIGENCE: "wisdom",
};

export const CHALLENGE_LABELS = {
  [CHALLENGES.DEXTERITY]: "DESTREZA",
  [CHALLENGES.CONSTITUTION]: "CONSTITUCIÓN",
  [CHALLENGES.STRENGTH]: "FUERZA",
  [CHALLENGES.AGILITY]: "AGILIDAD",
  [CHALLENGES.WISDOM]: "SABIDURÍA",
};

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
  WISDOM: "IntelligenceScene",
  NAME_SELECTION: "NameSelectionScene",
  CLASS_SELECTION: "ClassSelectionScene",
  HERO_SUMMARY: "HeroSummaryScene",
  ADVENTURE: "AdventureScene",
  MAP: "MapScene",
  COMBAT: "CombatScene",
  CREDITS: "CreditsScene",
};

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
