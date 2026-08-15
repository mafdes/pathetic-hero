import os
from PIL import Image, ImageDraw

TILE_SIZE = 32
COLS = 8
ROWS = 8
WIDTH = COLS * TILE_SIZE
HEIGHT = ROWS * TILE_SIZE

img = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

def tile_origin(index):
    c = index % COLS
    r = index // COLS
    return c * TILE_SIZE, r * TILE_SIZE

# --- TILE 0 (GID 1): Blank / Void ---
x, y = tile_origin(0)
draw.rectangle([x, y, x + 31, y + 31], fill=(13, 6, 19, 255))

# --- TILE 1 (GID 2): Suelo Piedra Púrpura (Standard Floor) ---
x, y = tile_origin(1)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(61, 40, 92, 255), width=1)
# Grid texture inside tile
draw.line([x + 16, y + 1, x + 16, y + 15], fill=(48, 30, 80, 255))
draw.line([x + 1, y + 16, x + 30, y + 16], fill=(48, 30, 80, 255))
draw.line([x + 8, y + 17, x + 8, y + 30], fill=(48, 30, 80, 255))
draw.line([x + 24, y + 17, x + 24, y + 30], fill=(48, 30, 80, 255))
# Highlights
draw.point([(x + 3, y + 3), (x + 19, y + 3), (x + 11, y + 19), (x + 27, y + 19)], fill=(80, 55, 120, 255))

# --- TILE 2 (GID 3): Suelo Piedra Azul Oscuro (Dark Blue Floor) ---
x, y = tile_origin(2)
draw.rectangle([x, y, x + 31, y + 31], fill=(20, 40, 46, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(36, 72, 82, 255), width=1)
draw.line([x + 1, y + 16, x + 30, y + 16], fill=(28, 55, 64, 255))
draw.line([x + 16, y + 1, x + 16, y + 15], fill=(28, 55, 64, 255))
draw.line([x + 16, y + 17, x + 16, y + 30], fill=(28, 55, 64, 255))

# --- TILE 3 (GID 4): Suelo Decorado / Runas Grabadas ---
x, y = tile_origin(3)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(61, 40, 92, 255), width=1)
# Diamond rune in middle
draw.polygon([(x + 16, y + 6), (x + 26, y + 16), (x + 16, y + 26), (x + 6, y + 16)], outline=(123, 45, 139, 255), fill=(55, 28, 85, 255))
draw.rectangle([x + 14, y + 14, x + 18, y + 18], fill=(212, 160, 23, 255))

# --- TILE 4 (GID 5): Suelo Agrietado ---
x, y = tile_origin(4)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(61, 40, 92, 255), width=1)
# Crack lines
draw.line([x + 5, y + 5, x + 12, y + 14, x + 10, y + 22, x + 20, y + 27], fill=(15, 7, 28, 255), width=2)
draw.line([x + 12, y + 14, x + 22, y + 12], fill=(15, 7, 28, 255), width=1)

# --- TILE 5 (GID 6): Pared Superior / Tope Roof ---
x, y = tile_origin(5)
draw.rectangle([x, y, x + 31, y + 31], fill=(15, 7, 28, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(45, 27, 70, 255), width=1)
draw.rectangle([x + 4, y + 4, x + 27, y + 27], fill=(28, 15, 50, 255))
draw.rectangle([x + 8, y + 8, x + 23, y + 23], fill=(15, 7, 28, 255))
draw.line([x + 1, y + 31, x + 30, y + 31], fill=(106, 78, 138, 255), width=1)

# --- TILE 6 (GID 7): Pared Frontal Ladrillo (Front Wall) ---
x, y = tile_origin(6)
draw.rectangle([x, y, x + 31, y + 31], fill=(15, 7, 28, 255))
# Brick rows
for r in range(4):
    by = y + r * 8
    draw.line([x, by, x + 31, by], fill=(45, 27, 70, 255), width=1)
    offset = 8 if (r % 2 == 1) else 0
    draw.line([x + offset, by, x + offset, by + 7], fill=(45, 27, 70, 255), width=1)
    draw.line([x + offset + 16, by, x + offset + 16, by + 7], fill=(45, 27, 70, 255), width=1)
# Shading/highlight
draw.rectangle([x, y, x + 31, y + 3], fill=(106, 78, 138, 255))
draw.rectangle([x, y + 4, x + 31, y + 6], fill=(45, 27, 70, 255))

# --- TILE 7 (GID 8): Pared con Antorcha ---
x, y = tile_origin(7)
# Copy brick wall base
draw.rectangle([x, y, x + 31, y + 31], fill=(15, 7, 28, 255))
for r in range(4):
    by = y + r * 8
    draw.line([x, by, x + 31, by], fill=(45, 27, 70, 255), width=1)
# Torch handle
draw.line([x + 16, y + 16, x + 16, y + 26], fill=(120, 85, 40, 255), width=2)
# Torch flame glow
draw.ellipse([x + 10, y + 6, x + 22, y + 18], fill=(255, 140, 0, 200))
draw.ellipse([x + 13, y + 8, x + 19, y + 15], fill=(255, 220, 50, 255))

# --- TILE 8 (GID 9): Puerta Madera Cerrada ---
x, y = tile_origin(8)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255)) # background floor
draw.rectangle([x + 3, y + 2, x + 28, y + 29], fill=(93, 64, 55, 255)) # wood frame
draw.rectangle([x + 3, y + 2, x + 28, y + 29], outline=(212, 160, 23, 255), width=2) # gold border
draw.line([x + 15, y + 2, x + 15, y + 29], fill=(60, 38, 30, 255), width=2) # door split
draw.ellipse([x + 20, y + 14, x + 24, y + 18], fill=(212, 160, 23, 255)) # handle knob

# --- TILE 9 (GID 10): Puerta Abierta / Marco ---
x, y = tile_origin(9)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 2, y + 1, x + 29, y + 30], outline=(212, 160, 23, 255), width=2)
draw.rectangle([x + 6, y + 4, x + 25, y + 31], fill=(15, 7, 28, 255)) # arch interior darkness

# --- TILE 10 (GID 11): Escaleras Bajada ---
x, y = tile_origin(10)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
for i in range(4):
    sy = y + 4 + i * 6
    draw.rectangle([x + 4 + i * 3, sy, x + 27 - i * 3, sy + 4], fill=(212, 160, 23, 255) if i == 0 else (61, 40, 92, 255))
    draw.line([x + 4 + i * 3, sy + 5, x + 27 - i * 3, sy + 5], fill=(15, 7, 28, 255), width=1)

# --- TILE 11 (GID 12): Escaleras Subida ---
x, y = tile_origin(11)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
for i in range(4):
    sy = y + 22 - i * 6
    draw.rectangle([x + 4 + i * 3, sy, x + 27 - i * 3, sy + 4], fill=(212, 160, 23, 255) if i == 3 else (70, 50, 100, 255))

# --- TILE 12 (GID 13): Cofre Cerrado ---
x, y = tile_origin(12)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 5, y + 8, x + 26, y + 25], fill=(121, 85, 72, 255))
draw.rectangle([x + 5, y + 8, x + 26, y + 25], outline=(240, 192, 64, 255), width=2)
draw.rectangle([x + 13, y + 14, x + 18, y + 19], fill=(240, 192, 64, 255)) # lock

# --- TILE 13 (GID 14): Cofre Abierto / Tesoro ---
x, y = tile_origin(13)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 5, y + 12, x + 26, y + 25], fill=(121, 85, 72, 255))
draw.rectangle([x + 5, y + 12, x + 26, y + 25], outline=(240, 192, 64, 255), width=2)
draw.ellipse([x + 8, y + 8, x + 23, y + 16], fill=(255, 215, 0, 255)) # gold inside

# --- TILE 14 (GID 15): Llave Dorada ---
x, y = tile_origin(14)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.ellipse([x + 6, y + 8, x + 16, y + 18], fill=(240, 192, 64, 255), outline=(212, 160, 23, 255), width=2)
draw.rectangle([x + 14, y + 11, x + 25, y + 15], fill=(240, 192, 64, 255))
draw.rectangle([x + 20, y + 15, x + 22, y + 19], fill=(240, 192, 64, 255))
draw.rectangle([x + 23, y + 15, x + 25, y + 19], fill=(240, 192, 64, 255))

# --- TILE 15 (GID 16): Trampa Cepo ---
x, y = tile_origin(15)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.ellipse([x + 6, y + 6, x + 25, y + 25], outline=(176, 190, 197, 255), width=2)
draw.line([x + 8, y + 16, x + 23, y + 16], fill=(176, 190, 197, 255), width=2)
draw.line([x + 16, y + 8, x + 16, y + 23], fill=(176, 190, 197, 255), width=2)
draw.polygon([(x + 10, y + 10), (x + 13, y + 14), (x + 7, y + 14)], fill=(176, 190, 197, 255))
draw.polygon([(x + 21, y + 21), (x + 18, y + 17), (x + 24, y + 17)], fill=(176, 190, 197, 255))

# --- TILE 16 (GID 17): Fuente Agua Mágica ---
x, y = tile_origin(16)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.ellipse([x + 4, y + 4, x + 27, y + 27], fill=(2, 136, 209, 255), outline=(79, 195, 247, 255), width=2)
draw.ellipse([x + 10, y + 10, x + 21, y + 21], fill=(79, 195, 247, 255))
draw.ellipse([x + 13, y + 13, x + 18, y + 18], fill=(255, 255, 255, 255))

# --- TILE 17 (GID 18): Runa Mágica ---
x, y = tile_origin(17)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.ellipse([x + 4, y + 4, x + 27, y + 27], fill=(123, 31, 162, 150), outline=(186, 104, 200, 255), width=2)
draw.line([x + 16, y + 8, x + 16, y + 24], fill=(255, 255, 255, 255), width=2)
draw.line([x + 10, y + 12, x + 22, y + 20], fill=(255, 255, 255, 255), width=2)

# --- TILE 18 (GID 19): Columna / Pilar ---
x, y = tile_origin(18)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 6, y + 2, x + 25, y + 29], fill=(61, 61, 107, 255))
draw.rectangle([x + 4, y + 2, x + 27, y + 7], fill=(100, 100, 150, 255))
draw.rectangle([x + 4, y + 24, x + 27, y + 29], fill=(40, 40, 80, 255))

# --- TILE 19 (GID 20): Agua / Estanque ---
x, y = tile_origin(19)
draw.rectangle([x, y, x + 31, y + 31], fill=(10, 50, 80, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(20, 90, 130, 255), width=1)
draw.line([x + 4, y + 8, x + 14, y + 8], fill=(79, 195, 247, 255), width=1)
draw.line([x + 18, y + 20, x + 28, y + 20], fill=(79, 195, 247, 255), width=1)

# --- TILE 20 (GID 21): Alfombra Roja ---
x, y = tile_origin(20)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 2, y + 2, x + 29, y + 29], fill=(180, 30, 40, 255))
draw.rectangle([x + 2, y + 2, x + 29, y + 29], outline=(240, 192, 64, 255), width=2)

# --- TILE 21 (GID 22): Barril ---
x, y = tile_origin(21)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.ellipse([x + 5, y + 4, x + 26, y + 27], fill=(110, 75, 50, 255), outline=(60, 40, 25, 255), width=2)
draw.line([x + 7, y + 11, x + 24, y + 11], fill=(160, 160, 160, 255), width=2)
draw.line([x + 7, y + 20, x + 24, y + 20], fill=(160, 160, 160, 255), width=2)

# --- TILE 22 (GID 23): Caja ---
x, y = tile_origin(22)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 4, y + 4, x + 27, y + 27], fill=(130, 90, 60, 255), outline=(70, 45, 25, 255), width=2)
draw.line([x + 4, y + 4, x + 27, y + 27], fill=(70, 45, 25, 255), width=2)
draw.line([x + 27, y + 4, x + 4, y + 27], fill=(70, 45, 25, 255), width=2)

# --- TILE 23 (GID 24): Huesos / Esqueleto ---
x, y = tile_origin(23)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.ellipse([x + 8, y + 8, x + 16, y + 16], fill=(220, 220, 210, 255)) # skull
draw.line([x + 6, y + 22, x + 24, y + 14], fill=(220, 220, 210, 255), width=2) # bone
draw.line([x + 10, y + 12, x + 22, y + 24], fill=(220, 220, 210, 255), width=2)

# Save both PNG and replace JPG for backward compatibility
os.makedirs('public/assets/tilesets', exist_ok=True)
png_path = 'public/assets/tilesets/dungeon_tiles.png'
jpg_path = 'public/assets/tilesets/dungeon_tiles.jpg'

img.save(png_path)
# Also save as RGB JPEG to overwrite the broken 1024x1024 AI image
rgb_img = Image.new('RGB', (WIDTH, HEIGHT), (13, 6, 19))
rgb_img.paste(img, (0, 0), mask=img.split()[3])
rgb_img.save(jpg_path, quality=100)

print(f'Tileset generated successfully at {png_path} ({WIDTH}x{HEIGHT} px, grid 32x32)!')
