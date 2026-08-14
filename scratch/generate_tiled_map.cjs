const fs = require('fs');
const path = require('path');

const width = 30;
const height = 17;
const tileWidth = 32;
const tileHeight = 32;

// Layout del nivel 1: 0 = vacio (o suelo en capa suelo), 1 = suelo, 2 = pared
const sueloData = new Array(width * height).fill(1); // Suelo completo en capa 1

// Crear mapa de paredes (perímetro + laberinto)
const paredesData = new Array(width * height).fill(0);

for (let r = 0; r < height; r++) {
  for (let c = 0; c < width; c++) {
    const idx = r * width + c;
    // Perímetro
    if (r === 0 || r === height - 1 || c === 0 || c === width - 1) {
      paredesData[idx] = 2; // Pared
    }
  }
}

// Algunas paredes internas (pasillos de mazmorra)
const innerWalls = [
  // Muros verticales / horizontales de pasillo
  { c: 5, r: 1 }, { c: 5, r: 2 }, { c: 5, r: 3 }, { c: 5, r: 4 }, { c: 5, r: 5 },
  { c: 10, r: 6 }, { c: 10, r: 7 }, { c: 10, r: 8 }, { c: 10, r: 9 }, { c: 10, r: 10 },
  { c: 15, r: 2 }, { c: 15, r: 3 }, { c: 15, r: 4 }, { c: 15, r: 5 }, { c: 15, r: 6 },
  { c: 20, r: 8 }, { c: 20, r: 9 }, { c: 20, r: 10 }, { c: 20, r: 11 }, { c: 20, r: 12 },
  { c: 25, r: 4 }, { c: 25, r: 5 }, { c: 25, r: 6 }, { c: 25, r: 7 }, { c: 25, r: 8 },
];

innerWalls.forEach(w => {
  if (w.c < width && w.r < height) {
    paredesData[w.r * width + w.c] = 2;
  }
});

// Definición completa del mapa JSON compatible con Tiled 1.10 y Phaser 3/4
const tiledMap = {
  compressionlevel: -1,
  height: height,
  width: width,
  tilewidth: tileWidth,
  tileheight: tileHeight,
  infinite: false,
  orientation: "orthogonal",
  renderorder: "right-down",
  tiledversion: "1.10.2",
  type: "map",
  version: "1.10",
  tilesets: [
    {
      firstgid: 1,
      name: "dungeon_tiles",
      image: "dungeon_tiles.jpg",
      imagewidth: 512,
      imageheight: 512,
      tilewidth: 32,
      tileheight: 32,
      tilecount: 256,
      columns: 8,
      margin: 0,
      spacing: 0
    }
  ],
  layers: [
    {
      data: sueloData,
      height: height,
      width: width,
      id: 1,
      name: "Suelo",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      x: 0,
      y: 0
    },
    {
      data: paredesData,
      height: height,
      width: width,
      id: 2,
      name: "Paredes",
      opacity: 1,
      type: "tilelayer",
      visible: true,
      x: 0,
      y: 0
    },
    {
      draworder: "topdown",
      id: 3,
      name: "Objetos",
      opacity: 1,
      type: "objectgroup",
      visible: true,
      x: 0,
      y: 0,
      objects: [
        { id: 1, name: "Jugador", type: "PlayerSpawn", x: 64, y: 64, width: 32, height: 32, visible: true },
        { id: 2, name: "Goblin Explorador", type: "Encounter", x: 224, y: 96, width: 32, height: 32, visible: true, properties: [{ name: "enemy", type: "string", value: "goblin" }] },
        { id: 3, name: "Mago Novato", type: "Encounter", x: 384, y: 224, width: 32, height: 32, visible: true, properties: [{ name: "enemy", type: "string", value: "mago_novato" }] },
        { id: 4, name: "Guardián Acorazado", type: "Encounter", x: 544, y: 352, width: 32, height: 32, visible: true, properties: [{ name: "enemy", type: "string", value: "trasgo" }] },
        { id: 5, name: "Jefe Goblin Alfa", type: "Encounter", x: 800, y: 416, width: 32, height: 32, visible: true, properties: [{ name: "enemy", type: "string", value: "goblin_alpha" }] },
        { id: 6, name: "Llave", type: "ItemKey", x: 96, y: 448, width: 32, height: 32, visible: true },
        { id: 7, name: "Puerta", type: "Door", x: 736, y: 416, width: 32, height: 32, visible: true },
        { id: 8, name: "Cofre", type: "Chest", x: 768, y: 96, width: 32, height: 32, visible: true },
        { id: 9, name: "Fuente", type: "Fountain", x: 448, y: 288, width: 32, height: 32, visible: true },
        { id: 10, name: "Escaleras Salida", type: "Stairs", x: 864, y: 416, width: 32, height: 32, visible: true }
      ]
    }
  ]
};

const outputDir = path.join(__dirname, '../tiled');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(path.join(outputDir, 'nivel1.json'), JSON.stringify(tiledMap, null, 2));

const publicMapsDir = path.join(__dirname, '../public/assets/maps');
if (!fs.existsSync(publicMapsDir)) fs.mkdirSync(publicMapsDir, { recursive: true });
fs.writeFileSync(path.join(publicMapsDir, 'nivel1.json'), JSON.stringify(tiledMap, null, 2));

console.log('Mapa de Tiled nivel1.json generado con éxito!');
