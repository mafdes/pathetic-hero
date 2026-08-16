import xml.etree.ElementTree as ET
import json
import os

def convert_tmx_to_json(tmx_file, json_file):
    tree = ET.parse(tmx_file)
    root = tree.getroot()

    width = int(root.attrib['width'])
    height = int(root.attrib['height'])
    tilewidth = int(root.attrib['tilewidth'])
    tileheight = int(root.attrib['tileheight'])

    layers_json = []

    for elem in root:
        if elem.tag == 'layer':
            layer_id = int(elem.attrib['id'])
            layer_name = elem.attrib.get('name', 'Terreno')
            data_elem = elem.find('data')
            if data_elem is not None and data_elem.attrib.get('encoding') == 'csv':
                csv_text = data_elem.text.strip()
                data = [int(v.strip()) for v in csv_text.replace('\n', ',').split(',') if v.strip()]
            else:
                data = []

            layers_json.append({
                "id": layer_id,
                "name": layer_name,
                "type": "tilelayer",
                "visible": True,
                "opacity": 1,
                "x": 0,
                "y": 0,
                "width": width,
                "height": height,
                "data": data
            })
        elif elem.tag == 'objectgroup':
            og_id = int(elem.attrib['id'])
            og_name = elem.attrib.get('name', 'Objetos')
            objects_list = []

            for obj in elem.findall('object'):
                obj_id = int(obj.attrib['id'])
                obj_name = obj.attrib.get('name', '')
                obj_type = obj.attrib.get('type', '')
                obj_x = float(obj.attrib.get('x', 0))
                obj_y = float(obj.attrib.get('y', 0))
                obj_w = float(obj.attrib.get('width', 32))
                obj_h = float(obj.attrib.get('height', 32))

                props_list = []
                props_elem = obj.find('properties')
                if props_elem is not None:
                    for p in props_elem.findall('property'):
                        props_list.append({
                            "name": p.attrib.get('name', ''),
                            "type": p.attrib.get('type', 'string'),
                            "value": p.attrib.get('value', '')
                        })

                objects_list.append({
                    "id": obj_id,
                    "name": obj_name,
                    "type": obj_type,
                    "x": obj_x,
                    "y": obj_y,
                    "width": obj_w,
                    "height": obj_h,
                    "visible": True,
                    "properties": props_list
                })

            layers_json.append({
                "id": og_id,
                "name": og_name,
                "type": "objectgroup",
                "visible": True,
                "opacity": 1,
                "draworder": "topdown",
                "x": 0,
                "y": 0,
                "objects": objects_list
            })

    tiled_json = {
        "compressionlevel": -1,
        "height": height,
        "width": width,
        "tilewidth": tilewidth,
        "tileheight": tileheight,
        "infinite": False,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.10.2",
        "type": "map",
        "version": "1.10",
        "tilesets": [
            {
                "firstgid": 1,
                "name": "dungeon_tiles",
                "image": "dungeon_tiles.png",
                "imagewidth": 256,
                "imageheight": 128,
                "tilewidth": 32,
                "tileheight": 32,
                "tilecount": 32,
                "columns": 8,
                "margin": 0,
                "spacing": 0
            }
        ],
        "layers": layers_json
    }

    os.makedirs(os.path.dirname(json_file), exist_ok=True)
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(tiled_json, f, indent=2)
    print(f"Convertido {tmx_file} ➔ {json_file}")

# Convertir todos los niveles 1..8
for lvl in range(1, 9):
    tmx_p = f"tiled/nivel{lvl}.tmx"
    json_p = f"public/assets/maps/nivel{lvl}.json"
    if os.path.exists(tmx_p):
        convert_tmx_to_json(tmx_p, json_p)

print("¡Convertidos todos los niveles a JSON perfectamente!")
