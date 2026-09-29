// 앱 아이콘(PNG)을 그림 도구 없이 코드로 그린다: node scripts/make-icons.mjs
// 결과는 public/icons/ 에 저장되고 저장소에 함께 올린다 (빌드 때 다시 돌 필요 없음).
// 배경은 네모 끝까지 채우고 케이크는 가운데 60% 안에 두어, 안드로이드가 동그랗게 잘라도(maskable) 안 잘린다.
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

const BG_TOP = hex("#f8d7cf");
const BG_BOTTOM = hex("#f0a093");
const PLATE = hex("#ffffff");
const PLATE_SHADOW = hex("#e28a7a");
const SPONGE = hex("#f3d19c");
const SPONGE_DARK = hex("#e5b877");
const FILLING = hex("#ec8672");
const CREAM = hex("#fffaf5");
const CHERRY = hex("#e2475a");
const CHERRY_SHINE = hex("#ffd0d6");
const STEM = hex("#6b8e3d");

const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const inRoundRect = (x, y, x0, y0, x1, y1, r) => {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};

// 0~1 좌표의 한 점 색. 위에 그리는 것이 나중에 온다.
function colorAt(x, y) {
  const t = y;
  let c = BG_TOP.map((v, i) => v + (BG_BOTTOM[i] - v) * t);

  // 받침 접시
  if (inEllipse(x, y, 0.5, 0.775, 0.36, 0.075)) c = PLATE_SHADOW;
  if (inEllipse(x, y, 0.5, 0.76, 0.36, 0.07)) c = PLATE;

  // 케이크 몸통 (아래 타원 + 사각형) — 옆면 시트
  const bodyL = 0.24, bodyR = 0.76, bodyTop = 0.44, bodyBottom = 0.72;
  const inBody = (x >= bodyL && x <= bodyR && y >= bodyTop && y <= bodyBottom) || inEllipse(x, y, 0.5, bodyBottom, 0.26, 0.055);
  if (inBody) {
    c = x > 0.66 ? SPONGE_DARK : SPONGE;
    if (y > 0.565 && y < 0.605) c = FILLING; // 필링 줄
  }

  // 윗면 크림 (타원) + 옆으로 흘러내린 물결
  const drip = bodyTop + 0.05 + 0.035 * Math.max(0, Math.sin((x - bodyL) * 38));
  if (x >= bodyL && x <= bodyR && y >= bodyTop && y <= drip) c = CREAM;
  if (inEllipse(x, y, 0.5, bodyTop, 0.26, 0.06)) c = CREAM;

  // 체리
  if (y < 0.36 && Math.abs(x - (0.52 + (0.36 - y) * 0.35)) < 0.012 && y > 0.24) c = STEM;
  if (inEllipse(x, y, 0.5, 0.39, 0.07, 0.07)) c = CHERRY;
  if (inEllipse(x, y, 0.475, 0.365, 0.02, 0.016)) c = CHERRY_SHINE;

  return c;
}

function png(size, round) {
  const SS = 4; // 가장자리를 부드럽게 하려고 한 픽셀을 4x4로 나눠 평균
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          if (round && !inRoundRect(x, y, 0, 0, 1, 1, 0.22)) continue;
          const c = colorAt(x, y);
          r += c[0]; g += c[1]; b += c[2]; a += 255;
        }
      }
      const n = SS * SS;
      const o = py * (size * 4 + 1) + 1 + px * 4;
      const cover = a / 255 || 1;
      raw[o] = Math.round(r / cover);
      raw[o + 1] = Math.round(g / cover);
      raw[o + 2] = Math.round(b / cover);
      raw[o + 3] = Math.round(a / n);
    }
  }

  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8비트
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = new URL("../public/icons/", import.meta.url);
mkdirSync(outDir, { recursive: true });
const files = {
  "icon-192.png": png(192, true), // 일반 아이콘: 모서리 둥근 네모
  "icon-512.png": png(512, true),
  "maskable-512.png": png(512, false), // 안드로이드가 모양대로 잘라 쓰는 아이콘: 네모 끝까지 채움
  "apple-touch-icon.png": png(180, false), // iOS는 알아서 모서리를 둥글린다
};
for (const [name, data] of Object.entries(files)) writeFileSync(new URL(name, outDir), data);
console.log("icons:", Object.keys(files).join(", "));
