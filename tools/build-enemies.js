import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const INPUT_DIR = path.join(ROOT_DIR, 'enemies');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public', 'assets', 'enemies');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

// Categorías de enemigos por defecto para bootstrap
const DEFAULT_ENEMIES = [
  'goblin',
  'mago_novato',
  'trasgo',
  'esqueleto',
  'minotauro',
  'golem',
  'lord_oscuro'
];

// Helper CRC32 para la generación de PNG puro en Node
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

// Generador de PNG 64x64 pixel art básico en memoria (sin dependencias npm)
function createPlaceholderPng(width, height, r, g, b, alpha = 255) {
  const bytesPerPixel = 4;
  const scanlineSize = 1 + width * bytesPerPixel;
  const rawData = Buffer.alloc(height * scanlineSize);

  for (let y = 0; y < height; y++) {
    const lineStart = y * scanlineSize;
    rawData[lineStart] = 0;
    for (let x = 0; x < width; x++) {
      const pixelOffset = lineStart + 1 + x * bytesPerPixel;
      const isBorder = (x === 0 || x === width - 1 || y === 0 || y === height - 1);
      const isInnerMargin = (x < 4 || x > width - 5 || y < 4 || y > height - 5);

      if (isBorder || isInnerMargin) {
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      } else {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
        rawData[pixelOffset + 3] = alpha;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = createPngChunk('IHDR', ihdrData);
  const idatChunk = createPngChunk('IDAT', compressedData);
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createPngChunk(typeStr, dataBuf) {
  const typeBuf = Buffer.from(typeStr, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);

  const crcBuf = Buffer.alloc(4);
  const typeAndData = Buffer.concat([typeBuf, dataBuf]);
  const checksum = crc32(typeAndData);
  crcBuf.writeUInt32BE(checksum, 0);

  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

const ENEMY_COLORS = {
  goblin: [56, 142, 60],
  mago_novato: [30, 136, 229],
  trasgo: [142, 36, 170],
  esqueleto: [224, 224, 224],
  minotauro: [121, 85, 72],
  golem: [120, 144, 156],
  lord_oscuro: [211, 47, 47]
};

function ensureBootstrapFolders(forceReset = false) {
  if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
  }

  DEFAULT_ENEMIES.forEach((enemyKey) => {
    const enemyFolder = path.join(INPUT_DIR, enemyKey);
    const folderExists = fs.existsSync(enemyFolder);

    if (!folderExists || forceReset) {
      if (!folderExists) fs.mkdirSync(enemyFolder, { recursive: true });
      console.log(`📁 Generando PNGs de prueba (256x256) en enemies/${enemyKey}`);

      const [r, g, b] = ENEMY_COLORS[enemyKey] || [180, 180, 180];

      const pngStand1 = createPlaceholderPng(256, 256, r, g, b, 255);
      const pngStand2 = createPlaceholderPng(256, 256, Math.min(255, r + 30), Math.min(255, g + 30), Math.min(255, b + 30), 255);
      const pngAttack = createPlaceholderPng(256, 256, 244, 67, 54, 255);
      const pngHurt = createPlaceholderPng(256, 256, 255, 235, 59, 255);
      const pngDie = createPlaceholderPng(256, 256, 96, 125, 139, 160);
      const pngMap = createPlaceholderPng(64, 64, r, g, b, 255);

      fs.writeFileSync(path.join(enemyFolder, 'stand01.png'), pngStand1);
      fs.writeFileSync(path.join(enemyFolder, 'stand02.png'), pngStand2);
      fs.writeFileSync(path.join(enemyFolder, 'attack01.png'), pngAttack);
      fs.writeFileSync(path.join(enemyFolder, 'hurt01.png'), pngHurt);
      fs.writeFileSync(path.join(enemyFolder, 'die01.png'), pngDie);
      fs.writeFileSync(path.join(enemyFolder, 'map.png'), pngMap);
      console.log(`   └─ Creados PNGs HD (256x256) en enemies/${enemyKey}/`);
    }
  });
}

function processEnemies(targetEnemy = null, forceReset = false) {
  ensureBootstrapFolders(forceReset);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const entries = fs.readdirSync(INPUT_DIR, { withFileTypes: true });
  const monsterFolders = entries
    .filter(e => e.isDirectory() && !e.name.endsWith('_raw') && (!targetEnemy || e.name === targetEnemy))
    .map(e => e.name);

  console.log(`\n🤖 Procesando ${monsterFolders.length} enemigo(s)...`);

  const manifest = {
    enemies: {}
  };

  monsterFolders.forEach(monsterId => {
    const monsterInputFolder = path.join(INPUT_DIR, monsterId);
    const monsterOutputFolder = path.join(OUTPUT_DIR, monsterId);

    if (!fs.existsSync(monsterOutputFolder)) {
      fs.mkdirSync(monsterOutputFolder, { recursive: true });
    }

    const files = fs.readdirSync(monsterInputFolder).filter(f => f.toLowerCase().endsWith('.png'));

    const animationsMap = {};

    files.forEach(filename => {
      const nameWithoutExt = path.parse(filename).name;
      const match = nameWithoutExt.match(/^([a-zA-Z_\-]+?)(\d+)?$/);

      let animKey = nameWithoutExt.toLowerCase();
      let frameNum = 1;

      if (match) {
        animKey = match[1].toLowerCase();
        frameNum = match[2] ? parseInt(match[2], 10) : 1;
      }

      if (!animationsMap[animKey]) {
        animationsMap[animKey] = [];
      }

      const srcPath = path.join(monsterInputFolder, filename);
      const destPath = path.join(monsterOutputFolder, filename);
      fs.copyFileSync(srcPath, destPath);

      animationsMap[animKey].push({
        frameNum,
        filename,
        path: `assets/enemies/${monsterId}/${filename}`
      });
    });

    const animationsConfig = {};
    let mapSpritePath = null;

    Object.keys(animationsMap).forEach(animKey => {
      animationsMap[animKey].sort((a, b) => a.frameNum - b.frameNum);
      const frameList = animationsMap[animKey];

      if (animKey === 'map' || animKey === 'map_stand' || animKey === 'map_idle') {
        mapSpritePath = frameList[0].path;
      }

      let frameRate = 8;
      if (animKey === 'stand' || animKey === 'idle') frameRate = 4;
      if (animKey === 'attack') frameRate = 10;
      if (animKey === 'hurt') frameRate = 8;
      if (animKey === 'die') frameRate = 6;

      animationsConfig[animKey] = {
        frameCount: frameList.length,
        frameRate: frameRate,
        repeat: (animKey === 'stand' || animKey === 'idle') ? -1 : 0,
        frames: frameList.map(f => f.path)
      };
    });

    manifest.enemies[monsterId] = {
      id: monsterId,
      mapSprite: mapSpritePath || `assets/enemies/${monsterId}/stand01.png`,
      animations: animationsConfig
    };

    console.log(` ✓ [${monsterId}] Animaciones detectadas: ${Object.keys(animationsConfig).join(', ')}`);
  });

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n✅ Manifesto generado exitosamente en: ${path.relative(ROOT_DIR, MANIFEST_PATH)}`);
}

const args = process.argv.slice(2);
const isReset = args.includes('--reset') || args.includes('--force');
const target = args.find(arg => !arg.startsWith('--')) || null;
processEnemies(target, isReset);
