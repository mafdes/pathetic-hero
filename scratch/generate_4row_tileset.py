import os
from PIL import Image, ImageDraw

TILE_SIZE = 32
COLS = 8
ROWS = 4
WIDTH = COLS * TILE_SIZE
HEIGHT = ROWS * TILE_SIZE

img = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

def tile_origin(index):
    c = index % COLS
    r = index // COLS
    return c * TILE_SIZE, r * TILE_SIZE

# ==============================================================================
# FILAS 1 Y 2 (ÍNDICES 0..15 / GIDs 1..16): PAREDES Y OBSTÁCULOS ⛔ (NO-PASO)
# ==============================================================================

# GID 1: Vacío / Oscuridad (0,0)
x, y = tile_origin(0)
draw.rectangle([x, y, x + 31, y + 31], fill=(13, 6, 19, 255))

# GID 2: Techo / Roof Top (1,0)
x, y = tile_origin(1)
draw.rectangle([x, y, x + 31, y + 31], fill=(15, 7, 28, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(45, 27, 70, 255), width=1)
draw.rectangle([x + 4, y + 4, x + 27, y + 27], fill=(28, 15, 50, 255))
draw.line([x + 1, y + 31, x + 30, y + 31], fill=(106, 78, 138, 255), width=1)

# GID 3: Pared Frontal de Ladrillos Púrpura (2,0)
x, y = tile_origin(2)
draw.rectangle([x, y, x + 31, y + 31], fill=(15, 7, 28, 255))
for r in range(4):
    by = y + r * 8
    draw.line([x, by, x + 31, by], fill=(45, 27, 70, 255), width=1)
    offset = 8 if (r % 2 == 1) else 0
    draw.line([x + offset, by, x + offset, by + 7], fill=(45, 27, 70, 255), width=1)
    draw.line([x + offset + 16, by, x + offset + 16, by + 7], fill=(45, 27, 70, 255), width=1)
draw.rectangle([x, y, x + 31, y + 3], fill=(106, 78, 138, 255))

# GID 4: Pared con Antorcha Encendida (3,0)
x, y = tile_origin(3)
draw.rectangle([x, y, x + 31, y + 31], fill=(15, 7, 28, 255))
for r in range(4):
    by = y + r * 8
    draw.line([x, by, x + 31, by], fill=(45, 27, 70, 255), width=1)
draw.line([x + 16, y + 16, x + 16, y + 26], fill=(120, 85, 40, 255), width=2)
draw.ellipse([x + 10, y + 6, x + 22, y + 18], fill=(255, 140, 0, 200))
draw.ellipse([x + 13, y + 8, x + 19, y + 15], fill=(255, 220, 50, 255))

# GID 5: Pared de Ladrillos Agrietada (4,0)
x, y = tile_origin(4)
draw.rectangle([x, y, x + 31, y + 31], fill=(15, 7, 28, 255))
for r in range(4):
    by = y + r * 8
    draw.line([x, by, x + 31, by], fill=(45, 27, 70, 255), width=1)
draw.line([x + 6, y + 4, x + 14, y + 18, x + 22, y + 28], fill=(212, 160, 23, 255), width=1)

# GID 6: Borde Muro Izquierda (5,0)
x, y = tile_origin(5)
draw.rectangle([x, y, x + 31, y + 31], fill=(15, 7, 28, 255))
draw.rectangle([x, y, x + 8, y + 31], fill=(45, 27, 70, 255))
draw.line([x + 8, y, x + 8, y + 31], fill=(106, 78, 138, 255), width=2)

# GID 7: Borde Muro Derecha (6,0)
x, y = tile_origin(6)
draw.rectangle([x, y, x + 31, y + 31], fill=(15, 7, 28, 255))
draw.rectangle([x + 23, y, x + 31, y + 31], fill=(45, 27, 70, 255))
draw.line([x + 23, y, x + 23, y + 31], fill=(106, 78, 138, 255), width=2)

# GID 8: Pared Cripta Azul Oscuro (7,0)
x, y = tile_origin(7)
draw.rectangle([x, y, x + 31, y + 31], fill=(10, 25, 35, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(30, 65, 85, 255), width=2)
draw.line([x, y + 16, x + 31, y + 16], fill=(30, 65, 85, 255), width=1)

# GID 9: Columna de Piedra (0,1)
x, y = tile_origin(8)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 6, y + 2, x + 25, y + 29], fill=(61, 61, 107, 255))
draw.rectangle([x + 4, y + 2, x + 27, y + 7], fill=(100, 100, 150, 255))
draw.rectangle([x + 4, y + 24, x + 27, y + 29], fill=(40, 40, 80, 255))

# GID 10: Estatua de Piedra (1,1)
x, y = tile_origin(9)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 8, y + 22, x + 23, y + 29], fill=(80, 80, 110, 255))
draw.ellipse([x + 10, y + 4, x + 21, y + 15], fill=(140, 140, 170, 255)) # cabeza
draw.polygon([(x + 8, y + 15), (x + 23, y + 15), (x + 16, y + 22)], fill=(110, 110, 140, 255)) # cuerpo

# GID 11: Barril de Madera Fijo (2,1)
x, y = tile_origin(10)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.ellipse([x + 5, y + 4, x + 26, y + 27], fill=(110, 75, 50, 255), outline=(60, 40, 25, 255), width=2)
draw.line([x + 7, y + 11, x + 24, y + 11], fill=(160, 160, 160, 255), width=2)
draw.line([x + 7, y + 20, x + 24, y + 20], fill=(160, 160, 160, 255), width=2)

# GID 12: Caja de Madera Fija (3,1)
x, y = tile_origin(11)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 4, y + 4, x + 27, y + 27], fill=(130, 90, 60, 255), outline=(70, 45, 25, 255), width=2)
draw.line([x + 4, y + 4, x + 27, y + 27], fill=(70, 45, 25, 255), width=2)

# GID 13: Verja de Hierro / Barandilla (4,1)
x, y = tile_origin(12)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
for i in range(4):
    bx = x + 4 + i * 7
    draw.line([bx, y + 2, bx, y + 29], fill=(160, 160, 180, 255), width=2)
draw.line([x + 2, y + 6, x + 29, y + 6], fill=(160, 160, 180, 255), width=2)
draw.line([x + 2, y + 25, x + 29, y + 25], fill=(160, 160, 180, 255), width=2)

# GID 14: Pared Verde Musgo (5,1)
x, y = tile_origin(13)
draw.rectangle([x, y, x + 31, y + 31], fill=(15, 28, 18, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(35, 65, 40, 255), width=1)
draw.ellipse([x + 6, y + 8, x + 16, y + 18], fill=(45, 100, 50, 255))

# GID 15: Pared Arcana Morada (6,1)
x, y = tile_origin(14)
draw.rectangle([x, y, x + 31, y + 31], fill=(35, 10, 45, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(140, 40, 180, 255), width=2)
draw.ellipse([x + 10, y + 10, x + 21, y + 21], fill=(180, 60, 220, 255))

# GID 16: Muro de Roca Lava (7,1)
x, y = tile_origin(15)
draw.rectangle([x, y, x + 31, y + 31], fill=(40, 15, 10, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(180, 50, 20, 255), width=1)
draw.line([x + 4, y + 16, x + 27, y + 16], fill=(240, 90, 30, 255), width=2)


# ==============================================================================
# FILAS 3 Y 4 (ÍNDICES 16..31 / GIDs 17..32): SUELOS Y CAMINOS ✅ (SÍ-PASO)
# ==============================================================================

# GID 17: Suelo Piedra Púrpura Estándar (0,2) - ¡El Suelo Principal!
x, y = tile_origin(16)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(61, 40, 92, 255), width=1)
draw.line([x + 16, y + 1, x + 16, y + 15], fill=(48, 30, 80, 255))
draw.line([x + 1, y + 16, x + 30, y + 16], fill=(48, 30, 80, 255))

# GID 18: Suelo Cripta Azul Oscuro (1,2)
x, y = tile_origin(17)
draw.rectangle([x, y, x + 31, y + 31], fill=(20, 40, 46, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(36, 72, 82, 255), width=1)
draw.line([x + 1, y + 16, x + 30, y + 16], fill=(28, 55, 64, 255))

# GID 19: Suelo con Runa Grabada (2,2)
x, y = tile_origin(18)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(61, 40, 92, 255), width=1)
draw.polygon([(x + 16, y + 6), (x + 26, y + 16), (x + 16, y + 26), (x + 6, y + 16)], outline=(123, 45, 139, 255), fill=(55, 28, 85, 255))
draw.rectangle([x + 14, y + 14, x + 18, y + 18], fill=(212, 160, 23, 255))

# GID 20: Suelo Agrietado (3,2)
x, y = tile_origin(19)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(61, 40, 92, 255), width=1)
draw.line([x + 5, y + 5, x + 12, y + 14, x + 10, y + 22, x + 20, y + 27], fill=(15, 7, 28, 255), width=2)

# GID 21: Alfombra Roja Real (4,2)
x, y = tile_origin(20)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 2, y + 2, x + 29, y + 29], fill=(180, 30, 40, 255))
draw.rectangle([x + 2, y + 2, x + 29, y + 29], outline=(240, 192, 64, 255), width=2)

# GID 22: Suelo de Madera (5,2)
x, y = tile_origin(21)
draw.rectangle([x, y, x + 31, y + 31], fill=(80, 50, 35, 255))
for i in range(4):
    draw.line([x, y + i * 8, x + 31, y + i * 8], fill=(50, 30, 20, 255), width=1)

# GID 23: Suelo Claro / Marfil (6,2)
x, y = tile_origin(22)
draw.rectangle([x, y, x + 31, y + 31], fill=(80, 75, 95, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(120, 115, 140, 255), width=1)

# GID 24: Suelo con Musgo (7,2)
x, y = tile_origin(23)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.ellipse([x + 4, y + 6, x + 18, y + 18], fill=(45, 90, 50, 220))
draw.ellipse([x + 16, y + 16, x + 28, y + 26], fill=(35, 75, 40, 220))

# GID 25: Escaleras Bajada (0,3)
x, y = tile_origin(24)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
for i in range(4):
    sy = y + 4 + i * 6
    draw.rectangle([x + 4 + i * 3, sy, x + 27 - i * 3, sy + 4], fill=(212, 160, 23, 255) if i == 0 else (61, 40, 92, 255))

# GID 26: Escaleras Subida (1,3)
x, y = tile_origin(25)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
for i in range(4):
    sy = y + 22 - i * 6
    draw.rectangle([x + 4 + i * 3, sy, x + 27 - i * 3, sy + 4], fill=(212, 160, 23, 255) if i == 3 else (70, 50, 100, 255))

# GID 27: Agua / Estanque (2,3)
x, y = tile_origin(26)
draw.rectangle([x, y, x + 31, y + 31], fill=(10, 50, 80, 255))
draw.line([x + 4, y + 8, x + 14, y + 8], fill=(79, 195, 247, 255), width=1)
draw.line([x + 18, y + 20, x + 28, y + 20], fill=(79, 195, 247, 255), width=1)

# GID 28: Huesos Decorativos (3,3)
x, y = tile_origin(27)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.ellipse([x + 8, y + 8, x + 16, y + 16], fill=(220, 220, 210, 255))
draw.line([x + 6, y + 22, x + 24, y + 14], fill=(220, 220, 210, 255), width=2)

# GID 29: Suelo Baldosa Enjaulada (4,3)
x, y = tile_origin(28)
draw.rectangle([x, y, x + 31, y + 31], fill=(34, 20, 58, 255))
draw.rectangle([x + 4, y + 4, x + 27, y + 27], outline=(100, 100, 120, 255), width=2)

# GID 30: Suelo Volcánico / Ceniza (5,3)
x, y = tile_origin(29)
draw.rectangle([x, y, x + 31, y + 31], fill=(45, 25, 25, 255))
draw.line([x + 4, y + 12, x + 20, y + 20], fill=(220, 80, 40, 255), width=1)

# GID 31: Caminito de Piedra (6,3)
x, y = tile_origin(30)
draw.rectangle([x, y, x + 31, y + 31], fill=(25, 15, 40, 255))
draw.ellipse([x + 6, y + 6, x + 14, y + 14], fill=(60, 45, 80, 255))
draw.ellipse([x + 16, y + 16, x + 26, y + 26], fill=(60, 45, 80, 255))

# GID 32: Suelo de Hielo / Cristal (7,3)
x, y = tile_origin(31)
draw.rectangle([x, y, x + 31, y + 31], fill=(60, 90, 120, 255))
draw.rectangle([x, y, x + 31, y + 31], outline=(140, 190, 230, 255), width=1)

# Guardar
os.makedirs('public/assets/tilesets', exist_ok=True)
png_path = 'public/assets/tilesets/dungeon_tiles.png'
img.save(png_path)

print(f'Tileset de 4 filas generado con éxito en {png_path} ({WIDTH}x{HEIGHT} px, 32 tiles en total)!')
