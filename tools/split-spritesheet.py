#!/usr/bin/env python3
import sys
import os
import argparse
from PIL import Image

def crop_and_center_sprite(cropped, target_size=256):
    """Recorta los bordes transparentes sobrantes alrededor del objeto y lo centra en un canvas de target_size x target_size."""
    bbox = cropped.getbbox()
    if bbox:
        cropped = cropped.crop(bbox)
    else:
        return None

    c_w, c_h = cropped.size
    if c_w == 0 or c_h == 0:
        return None

    max_dim = int(target_size * 0.90)
    if c_w > max_dim or c_h > max_dim:
        ratio = min(max_dim / c_w, max_dim / c_h)
        c_w = max(1, int(c_w * ratio))
        c_h = max(1, int(c_h * ratio))
        cropped = cropped.resize((c_w, c_h), Image.NEAREST)

    frame_canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    paste_x = (target_size - c_w) // 2
    paste_y = target_size - c_h  # Pies ajustados al borde inferior exacto (y=256)

    frame_canvas.paste(cropped, (paste_x, paste_y), cropped)
    return frame_canvas

def find_clean_islands(img, min_size=20):
    """Detecta automáticamente cada objeto/fotograma no transparente en la imagen."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    width, height = img.size
    alpha = img.split()[-1]
    pixel_data = alpha.load()

    visited = [[False for _ in range(height)] for _ in range(width)]
    boxes = []

    step = 2
    for y in range(0, height, step):
        for x in range(0, width, step):
            if not visited[x][y] and pixel_data[x, y] > 15:
                min_x, min_y, max_x, max_y = x, y, x, y
                queue = [(x, y)]
                visited[x][y] = True

                while queue:
                    curr_x, curr_y = queue.pop(0)
                    min_x = min(min_x, curr_x)
                    min_y = min(min_y, curr_y)
                    max_x = max(max_x, curr_x)
                    max_y = max(max_y, curr_y)

                    for dx, dy in [(-step, 0), (step, 0), (0, -step), (0, step)]:
                        nx, ny = curr_x + dx, curr_y + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if not visited[nx][ny] and pixel_data[nx, ny] > 15:
                                visited[nx][ny] = True
                                queue.append((nx, ny))

                w = max_x - min_x + 1
                h = max_y - min_y + 1

                if w >= min_size and h >= min_size:
                    boxes.append((min_x, min_y, min(width, max_x + step), min(height, max_y + step)))

    # Ordenar por posición (de arriba a abajo, e izquierda a derecha)
    boxes.sort(key=lambda b: (b[1] // 70, b[0]))
    return boxes

def split_spritesheet(img_path, target_size=256):
    if not os.path.exists(img_path):
        print(f"❌ Error: El archivo '{img_path}' no existe.")
        sys.exit(1)

    filename = os.path.basename(img_path)
    base_name = os.path.splitext(filename)[0]
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(script_dir)

    raw_output_dir = os.path.join(root_dir, 'enemies', f"{base_name}_raw")
    os.makedirs(raw_output_dir, exist_ok=True)

    img = Image.open(img_path).convert("RGBA")
    print(f"🖼️  Analizando spritesheet: {filename} ({img.width}x{img.height} px)...")

    boxes = find_clean_islands(img)
    print(f"✂️  Detectados {len(boxes)} elementos no transparentes en la imagen...")

    extracted_files = []

    for idx, box in enumerate(boxes, 1):
        cropped = img.crop(box)
        canvas = crop_and_center_sprite(cropped, target_size=target_size)

        if canvas is None:
            continue

        out_name = f"frame_{idx:02d}.png"
        out_path = os.path.join(raw_output_dir, out_name)
        canvas.save(out_path)
        extracted_files.append(out_path)

    print(f"\n✅ Se han guardado los {len(extracted_files)} elementos recortados en: enemies/{base_name}_raw/")
    for f in extracted_files:
        print(f"   • enemies/{base_name}_raw/{os.path.basename(f)}")

    print(f"\n💡 Simplemente elige los frames que te sirvan, renómbralos (ej: stand01.png, attack01.png...) y muévelos a enemies/{base_name}/")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Divisor automático de hojas de sprites.")
    parser.add_argument("image", help="Ruta a la imagen de la hoja de sprites (ej. enemies/goblin.png)")
    parser.add_argument("--size", type=int, default=256, help="Tamaño del canvas transparente (default 256)")

    args = parser.parse_args()
    split_spritesheet(args.image, target_size=args.size)
