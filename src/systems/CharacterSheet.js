/**
 * CharacterSheet.js — Ficha del personaje del jugador
 * Almacena nombre, atributos y clase. Se sincroniza con SaveManager.
 */

import { CHALLENGES } from "../utils/constants.js";

const ALL_ATTRIBUTES = [
  CHALLENGES.DEXTERITY,
  CHALLENGES.CONSTITUTION,
  CHALLENGES.STRENGTH,
  CHALLENGES.AGILITY,
  CHALLENGES.INTELLIGENCE,
];

export class CharacterSheet {
  constructor() {
    /** @type {string} Nombre del personaje */
    this.name = "";

    /**
     * Atributos: null = no evaluado, 0-20 = puntuación registrada.
     * Una vez asignado, NO se puede cambiar (sin segundas oportunidades).
     * @type {Record<string, number|null>}
     */
    this.attributes = {
      [CHALLENGES.DEXTERITY]: null,
      [CHALLENGES.CONSTITUTION]: null,
      [CHALLENGES.STRENGTH]: null,
      [CHALLENGES.AGILITY]: null,
      [CHALLENGES.INTELLIGENCE]: null,
    };

    /** @type {string|null} Clave de clase seleccionada */
    this.characterClass = null;
  }

  /**
   * Registra la puntuación de un atributo.
   * Solo aplica si el atributo todavía no tiene puntuación (null).
   * @param {string} attribute
   * @param {number} score 0-20
   */
  setAttribute(attribute, score) {
    if (!ALL_ATTRIBUTES.includes(attribute)) {
      console.warn(`[CharacterSheet] Atributo desconocido: ${attribute}`);
      return;
    }
    if (this.attributes[attribute] !== null) {
      console.warn(`[CharacterSheet] El atributo "${attribute}" ya fue evaluado.`);
      return;
    }
    this.attributes[attribute] = Math.round(clamp(score, 0, 20));
  }

  /**
   * Devuelve true si todas las 5 pruebas han sido completadas.
   */
  isComplete() {
    return ALL_ATTRIBUTES.every((a) => this.attributes[a] !== null);
  }

  /**
   * Media de los atributos evaluados (ignorando null).
   */
  getAverage() {
    const values = ALL_ATTRIBUTES.map((a) => this.attributes[a]).filter(
      (v) => v !== null
    );
    if (values.length === 0) return 0;
    return values.reduce((acc, v) => acc + v, 0) / values.length;
  }

  /**
   * Serializa la ficha a un objeto plano para guardar.
   */
  toJSON() {
    return {
      name: this.name,
      attributes: { ...this.attributes },
      characterClass: this.characterClass,
    };
  }

  /**
   * Carga datos desde un objeto plano (recuperado de SaveManager).
   * @param {object} data
   */
  fromJSON(data) {
    if (!data) return;
    this.name = data.name ?? "";
    this.characterClass = data.characterClass ?? null;
    for (const attr of ALL_ATTRIBUTES) {
      const val = data.attributes?.[attr];
      this.attributes[attr] = typeof val === "number" ? val : null;
    }
  }

  /**
   * Resetea la ficha (nueva partida).
   */
  reset() {
    this.name = "";
    this.characterClass = null;
    for (const attr of ALL_ATTRIBUTES) {
      this.attributes[attr] = null;
    }
  }
}

// Helper local (no circular con helpers.js)
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
