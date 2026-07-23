// สร้างไอคอนแอพ (PWA + favicon + apple-touch) จากมาสคอตผีพิกเซลของลุยเควส
//
// รัน: node scripts/gen-app-icons.mjs   -> เขียนทับ public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png
//
// ทำไมเขียน PNG เอง: มาสคอตเป็น pixel art 8×9 ช่อง (GRID ใน src/components/GhostMascot.jsx) การวาดด้วย
// สี่เหลี่ยมทึบต่อช่องจึงได้ผลตรงเป๊ะและคมกว่าการ rasterize SVG — และไม่ต้องเพิ่ม dependency (sharp/canvas)
// ให้โปรเจกต์ที่ต้องอยู่บน free tier; zlib ที่ใช้เข้ารหัส PNG มากับ Node อยู่แล้ว
//
// ถ้าแก้ลาย/สีมาสคอตใน GhostMascot.jsx ต้องมาแก้ GRID/COLOR ที่นี่ให้ตรงกันแล้วรันสคริปต์ใหม่

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// ---- ลายมาสคอต (คัดลอกให้ตรงกับ GhostMascot.jsx) ----
const COLOR = {
  '.': null, // โปร่ง = ปล่อยให้เห็นพื้นหลัง
  S: [0xa7, 0x8b, 0xfa], // ขอบตัว (violet-400)
  B: [0x8b, 0x5c, 0xf6], // ตัว (violet-500)
  W: [0xff, 0xff, 0xff], // ตาขาว
  P: [0x83, 0x18, 0x43], // ตาดำ
  E: [0xf4, 0x72, 0xb6], // ชายผ้าคลุม (pink-400)
};
const GRID = [
  '..SSSS..',
  '.SSSSSS.',
  'SSBBBBSS',
  'SWWBBWWS',
  'SWPBBPWS',
  'SBBBBBBS',
  'SBBBBBBS',
  'EEEEEEEE',
  'E.E.E.E.',
];

// ประกายรอบตัว (พิกัดเป็นสัดส่วนของด้าน) — โทนเดียวกับ GLITTER ในมาสคอตจริง
const SPARKLES = [
  { x: 0.17, y: 0.2, r: 0.035, color: [0xfb, 0xbf, 0x24] },
  { x: 0.83, y: 0.17, r: 0.03, color: [0xf4, 0x72, 0xb6] },
  { x: 0.86, y: 0.7, r: 0.032, color: [0xfb, 0xbf, 0x24] },
  { x: 0.13, y: 0.68, r: 0.026, color: [0x8b, 0x5c, 0xf6] },
];

// พื้นหลังไล่สีแนวทแยง ชมพูอ่อน -> ชมพูแบรนด์ (โทนเดียวกับพื้นแอพ from-white to-[#FDF2F8]/[#FBCFE8])
const BG_FROM = [0xff, 0xf7, 0xfb];
const BG_TO = [0xfb, 0xcf, 0xe8];

const lerp = (a, b, t) => Math.round(a + (b - a) * t);

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  };

  // พื้นหลัง
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x / size + y / size) / 2;
      set(x, y, [lerp(BG_FROM[0], BG_TO[0], t), lerp(BG_FROM[1], BG_TO[1], t), lerp(BG_FROM[2], BG_TO[2], t)]);
    }
  }

  // ประกาย (รูปกากบาท 4 แฉกแบบ pixel art)
  for (const s of SPARKLES) {
    const cx = Math.round(s.x * size);
    const cy = Math.round(s.y * size);
    const arm = Math.max(2, Math.round(s.r * size));
    const thick = Math.max(1, Math.round(arm / 3));
    for (let d = -arm; d <= arm; d++) {
      for (let t = -thick; t <= thick; t++) {
        const fade = 1 - Math.abs(d) / (arm + 1); // ปลายแฉกบางลง
        if (Math.abs(t) > Math.round(thick * fade)) continue;
        set(cx + d, cy + t, s.color);
        set(cx + t, cy + d, s.color);
      }
    }
  }

  // มาสคอต — คุมให้อยู่ราว 62% ของด้าน เพื่อให้ยังอยู่ใน safe zone ของไอคอน maskable (80%)
  const cell = Math.max(1, Math.floor((size * 0.62) / GRID[0].length));
  const ghostW = cell * GRID[0].length;
  const ghostH = cell * GRID.length;
  const originX = Math.round((size - ghostW) / 2);
  const originY = Math.round((size - ghostH) / 2);

  for (let row = 0; row < GRID.length; row++) {
    for (let col = 0; col < GRID[row].length; col++) {
      const color = COLOR[GRID[row][col]];
      if (!color) continue;
      for (let dy = 0; dy < cell; dy++) {
        for (let dx = 0; dx < cell; dx++) {
          set(originX + col * cell + dx, originY + row * cell + dy, color);
        }
      }
    }
  }

  return px;
}

// ---- เข้ารหัส PNG (RGBA, ไม่มี filter) ----
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10-12 = compression/filter/interlace = 0

  // ทุกแถวขึ้นต้นด้วย filter byte 0 (None)
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  const png = encodePng(size, drawIcon(size));
  writeFileSync(join(OUT_DIR, name), png);
  console.log(`เขียน public/${name} (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}
