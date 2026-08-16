/**
 * SaveManager.js — Persistencia en localStorage
 * Guarda y recupera la ficha del personaje entre sesiones.
 */

const SAVE_KEY = "pathetic-hero-save";
const VERSION = 1;

export class SaveManager {
  /**
   * Guarda la ficha y las estadísticas del personaje.
   * @param {import('./CharacterSheet').CharacterSheet} sheet
   * @param {import('./PlayerStats').PlayerStats} playerStats
   */
  static save(sheet, playerStats = null) {
    try {
      const data = {
        version: VERSION,
        savedAt: Date.now(),
        sheet: sheet.toJSON(),
        stats: playerStats && typeof playerStats.toJSON === 'function' ? playerStats.toJSON() : null,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("[SaveManager] No se pudo guardar:", e);
    }
  }

  /**
   * Recupera los datos guardados.
   * @returns {object|null}
   */
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== VERSION) {
        console.warn("[SaveManager] Versión de save incompatible, ignorando.");
        return null;
      }
      return data;
    } catch (e) {
      console.warn("[SaveManager] No se pudo cargar el save:", e);
      return null;
    }
  }

  /**
   * Devuelve true si hay una partida guardada válida.
   */
  static hasSave() {
    return SaveManager.load() !== null;
  }

  /**
   * Borra la partida guardada.
   */
  static clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.warn("[SaveManager] No se pudo borrar el save:", e);
    }
  }
}
