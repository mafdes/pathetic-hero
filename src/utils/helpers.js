/**
 * helpers.js — Utilidades generales del juego
 */

import {
  HERO_NAME_PREFIXES,
  HERO_NAME_ADJECTIVES,
  HERO_NAME_SUFFIXES,
} from "./constants.js";

/**
 * Devuelve un número entero aleatorio entre min y max (inclusive).
 */
export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Elige un elemento aleatorio de un array.
 */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Genera un nombre de héroe ridículo combinando prefijo + nombre + sufijo.
 * @returns {string}
 */
export function generateHeroName() {
  const prefix = pick(HERO_NAME_PREFIXES);
  const name = pick(HERO_NAME_ADJECTIVES);
  const suffix = pick(HERO_NAME_SUFFIXES);
  return `${prefix} ${name} ${suffix}`;
}

/**
 * Interpola linealmente entre a y b con factor t (0–1).
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp un valor entre min y max.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Devuelve true si el dispositivo tiene pantalla táctil.
 */
export function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Pausa la ejecución durante ms milisegundos (útil en async/await).
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Formatea una puntuación 0-20 con el estilo del juego: "12 / 20"
 */
export function formatScore(score) {
  return `${score} / 20`;
}

/**
 * Dado un score 0-20 devuelve el veredicto sarcástico del tribunal.
 */
export function getVerdict(score) {
  if (score === 0) return "PATETISMO PURO";
  if (score <= 3) return "CALAMITOSO";
  if (score <= 6) return "MEDIOCRE";
  if (score <= 10) return "INSUFICIENTE";
  if (score <= 14) return "APROBADO (RASPADO)";
  if (score <= 17) return "NOTABLE";
  if (score <= 19) return "SOBRESALIENTE";
  return "PERFECTO (SOSPECHOSO)";
}
