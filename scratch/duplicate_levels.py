import os
import re

# 1. Duplicar TMX en tiled/
with open('tiled/nivel1.tmx', 'r', encoding='utf-8') as f:
    tmx_content = f.read()

for lvl in range(2, 9):
    # Reemplazar target de exportación
    new_tmx = re.sub(
        r'<export target="\.\./public/assets/maps/nivel\d+\.json" format="json"/>',
        f'<export target="../public/assets/maps/nivel{lvl}.json" format="json"/>',
        tmx_content
    )
    tmx_path = f'tiled/nivel{lvl}.tmx'
    with open(tmx_path, 'w', encoding='utf-8') as f:
        f.write(new_tmx)
    print(f'Creado {tmx_path}')

# 2. Duplicar JSON en public/assets/maps/
with open('public/assets/maps/nivel1.json', 'r', encoding='utf-8') as f:
    json_content = f.read()

for lvl in range(2, 9):
    json_path = f'public/assets/maps/nivel{lvl}.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        f.write(json_content)
    print(f'Creado {json_path}')

print('¡Todos los 8 niveles duplicados con éxito!')
