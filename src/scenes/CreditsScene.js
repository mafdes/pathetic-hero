import * as Phaser from "phaser";
import { COLORS, FONTS, SCENES, TIMING, DEPTHS } from "../utils/constants.js";
import { PixelButton } from "../ui/PixelButton.js";

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.CREDITS });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.cameras.main.fadeIn(TIMING.TRANSITION_DURATION, 0, 0, 0);

    // Header
    this.add.text(W / 2, 120, "CRÉDITOS Y ATRIBUCIONES", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "28px",
      color: "#d4a017",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    this.add.rectangle(W / 2, 160, W - 100, 2, COLORS.GOLD_DARK).setDepth(DEPTHS.UI);

    // Subtítulo de Origen
    this.add.text(W / 2, 185, "~ Evolución del prototipo satírico 'heroic-failure' ~", {
      fontFamily: FONTS.PRIMARY,
      fontSize: "14px",
      color: "#c8a97a",
      resolution: 2,
    }).setOrigin(0.5).setDepth(DEPTHS.UI);

    // Contenido de créditos
    const creditsText = [
      { role: "🎨 ARTE DE COFRES, LLAVES Y MONEDAS", name: "Jan Schneider (itch.io)", link: "jan-schneider.itch.io/chest-and-coins" },
      { role: "🎵 MÚSICA Y SFX RETRO 8-BIT", name: "OpenGameArt.org & Retro Audio", link: "opengameart.org" },
      { role: "🔤 TIPOGRAFÍA PIXEL ART", name: "Press Start 2P by CodeMan38", link: "fonts.google.com" },
      { role: "💡 PROTOTIPO E IDEA ORIGINAL", name: "heroic-failure (HTML5 Prototype)", link: "github.com/mafdes/heroic-failure" },
      { role: "🗡️ DESARROLLO Y MOTOR PHASER 4", name: "Pathetic Hero Team", link: "" },
    ];

    const startY = 240;
    const gap = 150;

    creditsText.forEach((c, i) => {
      const y = startY + i * gap;

      this.add.text(W / 2, y, c.role, {
        fontFamily: FONTS.PRIMARY,
        fontSize: "16px",
        color: "#6a4e8a",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);

      this.add.text(W / 2, y + 32, c.name, {
        fontFamily: FONTS.PRIMARY,
        fontSize: "20px",
        color: "#f0e6d3",
        resolution: 2,
      }).setOrigin(0.5).setDepth(DEPTHS.UI);

      if (c.link) {
        this.add.text(W / 2, y + 60, c.link, {
          fontFamily: FONTS.PRIMARY,
          fontSize: "13px",
          color: "#d4a017",
          resolution: 2,
        }).setOrigin(0.5).setDepth(DEPTHS.UI);
      }
    });

    // Botón Volver
    new PixelButton(
      this,
      W / 2,
      H - 120,
      "VOLVER AL MENÚ",
      () => {
        this.cameras.main.fadeOut(TIMING.TRANSITION_DURATION, 0, 0, 0);
        this.time.delayedCall(TIMING.TRANSITION_DURATION, () => {
          this.scene.start(SCENES.MAIN_MENU);
        });
      },
      { width: 440, height: 70, fontSize: "22px" }
    );
  }
}
