// 에셋 정리: 파일마다 가장 큰 그림 덩어리 + 가장자리에 닿지 않는 작은 조각(뿌리기 가루 등)만 남기고
// 가장자리에 걸친 옆 그림 조각은 지운 뒤 여백 2px로 잘라낸다. 결과를 격자 한 장(contact sheet)으로도 만든다.
const fs = require("fs");
const path = require("path");
const { decodePng, encodePng, components } = require("./png-tools.cjs");

const SRC = path.join(__dirname, "../../public/cake_simulator_pastel_assets");
const OUT = path.join(__dirname, "cleaned");
fs.rmSync(OUT, { recursive: true, force: true });

const files = [];
for (const dir of fs.readdirSync(SRC).filter((d) => fs.statSync(path.join(SRC, d)).isDirectory()).sort())
  for (const f of fs.readdirSync(path.join(SRC, dir)).filter((f) => f.endsWith(".png")).sort()) files.push(`${dir}/${f}`);

const cleaned = [];
for (const rel of files) {
  const img = decodePng(fs.readFileSync(path.join(SRC, rel)));
  const { label, comps } = components(img);
  if (comps.length === 0) continue;
  const main = comps.reduce((a, b) => (b.count > a.count ? b : a));
  // 남길 덩어리: 가장 큰 것 + 가장자리에 안 닿는 것 중 너무 작지 않은 것(잡티 제외)
  const keep = new Set(comps.filter((c) => c === main || (!c.touchesEdge && c.count >= 6)).map((c) => c.id));
  const removed = comps.filter((c) => !keep.has(c.id));
  let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
  for (const c of comps) if (keep.has(c.id)) { minX = Math.min(minX, c.minX); minY = Math.min(minY, c.minY); maxX = Math.max(maxX, c.maxX); maxY = Math.max(maxY, c.maxY); }
  const pad = 2;
  const w = maxX - minX + 1 + pad * 2, h = maxY - minY + 1 + pad * 2;
  const out = Buffer.alloc(w * h * 4);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const p = y * img.width + x;
    const lab = label[p];
    const src = p * 4;
    const dst = ((y - minY + pad) * w + (x - minX + pad)) * 4;
    // 덩어리에 속하지 않는 반투명 가장자리 픽셀은, 남긴 덩어리 바로 옆이면 살린다 (안티앨리어싱)
    const keepPixel = lab === -1 ? img.data[src + 3] > 0 && neighborKept(img, label, keep, x, y) : keep.has(lab);
    if (keepPixel) img.data.copy(out, dst, src, src + 4);
  }
  const target = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const result = { width: w, height: h, data: out };
  fs.writeFileSync(target, encodePng(result));
  cleaned.push({ rel, w, h, removed: removed.length, removedPx: removed.reduce((s, c) => s + c.count, 0), mainTouches: main.touchesEdge, img: result });
}

function neighborKept(img, label, keep, x, y) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= img.width || ny >= img.height) continue;
    const l = label[ny * img.width + nx];
    if (l !== -1 && keep.has(l)) return true;
  }
  return false;
}

// 격자 한 장: 10열, 칸 120px(그림은 100px 안에 맞춤), 칸마다 체크무늬 배경
const COLS = 10, CELL = 120, FIT = 104;
const rows = Math.ceil(cleaned.length / COLS);
const W = COLS * CELL, H = rows * CELL;
const sheet = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const o = (y * W + x) * 4;
  const border = x % CELL === 0 || y % CELL === 0;
  const checker = ((x >> 3) + (y >> 3)) % 2 ? 235 : 250;
  const v = border ? 150 : checker;
  sheet[o] = v; sheet[o + 1] = v; sheet[o + 2] = v; sheet[o + 3] = 255;
}
cleaned.forEach((c, i) => {
  const col = i % COLS, row = Math.floor(i / COLS);
  const scale = Math.min(1, FIT / Math.max(c.w, c.h));
  const dw = Math.round(c.w * scale), dh = Math.round(c.h * scale);
  const ox = col * CELL + Math.round((CELL - dw) / 2), oy = row * CELL + Math.round((CELL - dh) / 2);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const sx = Math.min(c.w - 1, Math.floor(x / scale)), sy = Math.min(c.h - 1, Math.floor(y / scale));
    const s = (sy * c.w + sx) * 4, d = ((oy + y) * W + (ox + x)) * 4;
    const a = c.img.data[s + 3] / 255;
    for (let k = 0; k < 3; k++) sheet[d + k] = Math.round(c.img.data[s + k] * a + sheet[d + k] * (1 - a));
  }
});
fs.writeFileSync(path.join(__dirname, "contact-sheet.png"), encodePng({ width: W, height: H, data: sheet }));
fs.writeFileSync(path.join(__dirname, "contact-index.txt"), cleaned.map((c, i) => `${i}\t${c.rel}\t${c.w}x${c.h}\tremoved=${c.removed}(${c.removedPx}px)${c.mainTouches ? "\tMAIN_TOUCHES_EDGE" : ""}`).join("\n"));
console.log("cleaned", cleaned.length, "sheet", W, "x", H);
