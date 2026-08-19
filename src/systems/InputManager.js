/**
 * InputManager.js — Abstracción de entrada unificada para Phaser 3
 *
 * Centraliza teclado, ratón y táctil en una interfaz común.
 * Las escenas consultan el InputManager en lugar de manejar input directamente,
 * lo que facilita cambiar el esquema de controles sin tocar la lógica del juego.
 *
 * Modos:
 *   - "keyboard"  → Flechas + Z/X/Enter/Espacio
 *   - "mouse"     → Click y posición del puntero
 *   - "touch"     → Táctil (detectado automáticamente en móvil)
 */

import { isTouchDevice } from "../utils/helpers.js";

export const INPUT_MODE = {
  KEYBOARD: "keyboard",
  MOUSE: "mouse",
  TOUCH: "touch",
};

export class InputManager {
  /**
   * @param {Phaser.Scene} scene — Escena Phaser propietaria
   * @param {string} [preferredMode] — Modo preferido del usuario (de ControlsScene)
   */
  constructor(scene, preferredMode = null) {
    this.scene = scene;

    // Si es táctil, forzar touch; si no, usar la preferencia o mouse por defecto
    if (isTouchDevice()) {
      this.mode = INPUT_MODE.TOUCH;
    } else {
      this.mode = preferredMode ?? INPUT_MODE.KEYBOARD;
    }

    this._setupKeys();
  }

  _setupKeys() {
    const kb = this.scene.input.keyboard;
    if (!kb) return;

    this.keys = kb.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      confirm: Phaser.Input.Keyboard.KeyCodes.ENTER,
      confirmAlt: Phaser.Input.Keyboard.KeyCodes.Z,
      cancel: Phaser.Input.Keyboard.KeyCodes.X,
      action: Phaser.Input.Keyboard.KeyCodes.SPACE,
      skip: Phaser.Input.Keyboard.KeyCodes.ESC,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  /** ¿Se pulsó "arriba" este frame? */
  get up() {
    return Phaser.Input.Keyboard.JustDown(this.keys.up) ||
           Phaser.Input.Keyboard.JustDown(this.keys.w);
  }

  /** ¿Se pulsó "abajo" este frame? */
  get down() {
    return Phaser.Input.Keyboard.JustDown(this.keys.down) ||
           Phaser.Input.Keyboard.JustDown(this.keys.s);
  }

  /** ¿Se pulsó "izquierda" este frame? */
  get left() {
    return Phaser.Input.Keyboard.JustDown(this.keys.left) ||
           Phaser.Input.Keyboard.JustDown(this.keys.a);
  }

  /** ¿Se pulsó "derecha" este frame? */
  get right() {
    return Phaser.Input.Keyboard.JustDown(this.keys.right) ||
           Phaser.Input.Keyboard.JustDown(this.keys.d);
  }

  /** ¿Se confirmó (Enter/Z)? */
  get confirm() {
    return Phaser.Input.Keyboard.JustDown(this.keys.confirm) ||
           Phaser.Input.Keyboard.JustDown(this.keys.confirmAlt);
  }

  /** ¿Se canceló (X/Esc)? */
  get cancel() {
    return Phaser.Input.Keyboard.JustDown(this.keys.cancel) ||
           Phaser.Input.Keyboard.JustDown(this.keys.skip);
  }

  /** ¿Se pulsó acción (Espacio)? */
  get action() {
    return Phaser.Input.Keyboard.JustDown(this.keys.action);
  }

  /** ¿Está mantenida la tecla "arriba"? */
  get upHeld() {
    return this.keys.up.isDown || this.keys.w.isDown;
  }

  /** ¿Está mantenida la tecla "abajo"? */
  get downHeld() {
    return this.keys.down.isDown || this.keys.s.isDown;
  }

  /** ¿Está mantenida la tecla "izquierda"? */
  get leftHeld() {
    return this.keys.left.isDown || this.keys.a.isDown;
  }

  /** ¿Está mantenida la tecla "derecha"? */
  get rightHeld() {
    return this.keys.right.isDown || this.keys.d.isDown;
  }

  /** ¿Está mantenida la tecla de acción (Espacio)? */
  get actionHeld() {
    return this.keys.action.isDown;
  }

  /** Devuelve la pista de control para pruebas de acción (ej. Destreza) */
  get actionHintText() {
    return isTouchDevice() ? "[ TOCA LA PANTALLA ]" : "[ ESPACIO / CLIC ]";
  }

  /** Devuelve la pista de control para movimiento en mapas */
  get movementHintText() {
    return isTouchDevice()
      ? "Toca o mantén pulsada una dirección"
      : "WASD / Flechas o Clic para moverte";
  }

  /** Devuelve true si el entorno actual es táctil */
  get isTouch() {
    return isTouchDevice();
  }

  /** Cambia el modo de input en caliente (cuando el usuario cambia en Opciones). */
  setMode(mode) {
    this.mode = mode;
  }

  /** Devuelve el modo actual. */
  getMode() {
    return this.mode;
  }

  /** Destruye los listeners de teclado. */
  destroy() {
    if (this.keys && this.scene.input.keyboard) {
      this.scene.input.keyboard.removeAllListeners();
    }
  }
}

