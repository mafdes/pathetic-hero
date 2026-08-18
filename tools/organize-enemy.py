#!/usr/bin/env python3
"""
organize-enemy.py — Herramienta interactiva para seleccionar y organizar cuadros de enemies/<monster>_raw/

Uso:
  1. Generar la vista previa numerada:
     python3 tools/organize-enemy.py minotauro

  2. Pasar los números directamente por consola (opcional):
     python3 tools/organize-enemy.py minotauro --stand 1,2 --attack 3,4,5 --hurt 8,9 --die 20,21 --map 1
"""

import sys
import os
import glob
import shutil
import argparse
from PIL import Image, ImageDraw, ImageFont

def create_preview_sheet(raw_folder, preview_path):
    """Crea una hoja de vista previa numerada con todos los cuadros de _raw."""
    files = sorted(glob.glob(os.path.join(raw_folder, "frame_*.png")))
    if not files:
        print(f"❌ No se encontraron archivos frame_*.png en {raw_folder}")
        return False

    cols = 6
    rows = (len(files) + cols - 1) // cols
    tile_w, tile_h = 256, 256
    padding = 10
    label_h = 30

    sheet_w = cols * tile_w + (cols + 1) * padding
    sheet_h = rows * (tile_h + label_h) + (rows + 1) * padding

    preview_img = Image.new("RGBA", (sheet_w, sheet_h), (30, 20, 40, 255))
    draw = ImageDraw.Draw(preview_img)

    for idx, filepath in enumerate(files):
        frame_num = idx + 1
        r = idx // cols
        c = idx % cols

        x = padding + c * (tile_w + padding)
        y = padding + r * (tile_h + label_h + padding)

        # Fondo del cuadro
        draw.rectangle([x, y, x + tile_w, y + tile_h], fill=(45, 30, 60, 255), outline=(212, 160, 23, 255))

        # Pegar el sprite
        sprite = Image.open(filepath)
        preview_img.paste(sprite, (x, y), sprite if sprite.mode == "RGBA" else None)

        # Dibujar etiqueta con el número de frame grande
        label_text = f"FRAME {frame_num}"
        draw.rectangle([x, y + tile_h, x + tile_w, y + tile_h + label_h], fill=(212, 160, 23, 255))
        draw.text((x + tile_w // 2 - 35, y + tile_h + 6), label_text, fill=(0, 0, 0, 255))

    preview_img.save(preview_path)
    print(f"📸 Hoja de vista previa numerada generada en: {preview_path}")
    print(f"   Abre {preview_path} para ver qué número corresponde a cada pose.\n")
    return True

def copy_frames(raw_folder, output_folder, category_name, frame_indices):
    """Copia y meombra los fotogramas seleccionados a la carpeta final del enemigo."""
    os.makedirs(output_folder, exist_ok=True)
    if not frame_indices:
        return

    for idx, f_num in enumerate(frame_indices):
        src_file = os.path.join(raw_folder, f"frame_{int(f_num):02d}.png")
        if not os.path.exists(src_file):
            src_file = os.path.join(raw_folder, f"frame_{int(f_num)}.png")

        if os.path.exists(src_file):
            if category_name == "map":
                dst_name = "map.png"
            else:
                dst_name = f"{category_name}{idx + 1:02d}.png"
            
            dst_file = os.path.join(output_folder, dst_name)
            shutil.copyfile(src_file, dst_file)
            print(f"  ✓ Copiado Frame {f_num} ➔ {dst_name}")
        else:
            print(f"  ⚠️ No existe el archivo: {src_file}")

def main():
    parser = argparse.ArgumentParser(description="Organizador de fotogramas de enemigos")
    parser.add_argument("monster", help="Nombre del enemigo (ej: goblin, minotauro)")
    parser.add_argument("--stand", help="Lista de números de frame para stand (ej: 1,2)")
    parser.add_argument("--attack", help="Lista de números de frame para attack (ej: 3,4,5)")
    parser.add_argument("--hurt", help="Lista de números de frame para hurt (ej: 8,9)")
    parser.add_argument("--die", help="Lista de números de frame para die (ej: 15,16)")
    parser.add_argument("--map", help="Número de frame para el icono de mapa (ej: 1)")

    args = parser.parse_args()
    monster = args.monster.lower().strip()

    raw_folder = f"enemies/{monster}_raw"
    output_folder = f"enemies/{monster}"

    if not os.path.exists(raw_folder):
        print(f"❌ No existe la carpeta {raw_folder}. Primero ejecuta: npm run split:enemy enemies/{monster}.png")
        sys.exit(1)

    preview_path = os.path.join(raw_folder, "_PREVIEW.png")
    create_preview_sheet(raw_folder, preview_path)

    # Si se pasaron argumentos por flag, procesarlos directamente
    has_flags = any([args.stand, args.attack, args.hurt, args.die, args.map])

    if has_flags:
        if args.stand:
            copy_frames(raw_folder, output_folder, "stand", args.stand.split(","))
        if args.attack:
            copy_frames(raw_folder, output_folder, "attack", args.attack.split(","))
        if args.hurt:
            copy_frames(raw_folder, output_folder, "hurt", args.hurt.split(","))
        if args.die:
            copy_frames(raw_folder, output_folder, "die", args.die.split(","))
        if args.map:
            copy_frames(raw_folder, output_folder, "map", args.map.split(","))

        print(f"\n✅ Enemigo [{monster}] organizado correctamente en {output_folder}/")
        print(f"   Ejecuta 'npm run build' para empaquetar.")
        return

    # Modo interactivo
    print("--- SELECCIÓN INTERACTIVA DE POSES ---")
    print(f"Abre el archivo [{preview_path}] para ver los números de cada frame.\n")

    def parse_input(prompt_text):
        res = input(prompt_text).strip()
        if not res:
            return []
        return [int(x.strip()) for x in res.replace(" ", "").split(",") if x.strip().isdigit()]

    stand_frames = parse_input("👉 Números para STAND / Reposo (ej: 1,2): ")
    attack_frames = parse_input("👉 Números para ATTACK / Ataque (ej: 3,4,5): ")
    hurt_frames = parse_input("👉 Números para HURT / Recibir daño (ej: 8,9): ")
    die_frames = parse_input("👉 Números para DIE / Muerte (ej: 20,21): ")
    map_frames = parse_input("👉 Número para MAP / Icono de mapa (ej: 1): ")

    print("\n📦 Copiando y renombrando archivos...")
    if stand_frames: copy_frames(raw_folder, output_folder, "stand", stand_frames)
    if attack_frames: copy_frames(raw_folder, output_folder, "attack", attack_frames)
    if hurt_frames: copy_frames(raw_folder, output_folder, "hurt", hurt_frames)
    if die_frames: copy_frames(raw_folder, output_folder, "die", die_frames)
    if map_frames: copy_frames(raw_folder, output_folder, "map", map_frames)

    print(f"\n🎉 ¡Enemigo [{monster}] listo en {output_folder}/!")
    print(f"   Para compilar ejecuta: npm run build")

if __name__ == "__main__":
    main()
