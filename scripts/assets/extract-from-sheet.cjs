// 원본 시트(미리보기 JPG, 체크무늬 배경)에서 그림을 하나씩 온전하게 다시 잘라낸다.
// 개별 PNG는 자동 자르기 상자가 너무 딱 맞아 가장자리가 잘려 있어서, 시트에서 직접 뽑는다.
//   1) 배경: 흰색(≈254)·연회색(≈244,244,246) 체크무늬 — 가장자리에서 이어진 배경색을 지운다
//   2) 그림 안쪽의 체크무늬 틈(리본 고리 등)은 흰색과 회색이 섞여 있을 때만 배경으로 친다 (흰 크림·하이라이트는 남김)
//   3) 남은 덩어리마다 여백을 두고 잘라 sheet-parts/NN.png + sheet-contact.png(번호 순 격자)로 저장
// 사용: node scripts/assets/extract-from-sheet.cjs  → 격자를 보고 build-from-sheet.cjs의 대응표를 맞춘다
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { encodePng } = require("./png-tools.cjs");

const SHEET = path.join(__dirname, "../../public/cake_simulator_pastel_assets/pastel_asset_sheet_preview.jpg");
const OUT = path.join(__dirname, "sheet-parts");

const isBgColor = (r, g, b) => Math.min(r, g, b) >= 234 && Math.max(r, g, b) - Math.min(r, g, b) <= 8;
const isWhite = (r, g, b) => Math.min(r, g, b) >= 251;
const isCheckerGray = (r, g, b) => r >= 238 && r <= 249 && b >= r && Math.max(r, g, b) - Math.min(r, g, b) <= 6;

(async () => {
  const { data, info } = await sharp(SHEET).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const rgb = (p) => [data[p * C], data[p * C + 1], data[p * C + 2]];

  // 1) 가장자리에서 이어진 배경
  const bg = new Uint8Array(W * H); // 1 = 배경
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const p = stack.pop();
    if (bg[p] || !isBgColor(...rgb(p))) continue;
    bg[p] = 1;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W);
    if (y < H - 1) stack.push(p + W);
  }

  // 2) 갇힌 배경색 영역 중 체크무늬(흰+회색 섞임)인 것도 배경으로
  const seen = new Uint8Array(W * H);
  for (let start = 0; start < W * H; start++) {
    if (bg[start] || seen[start] || !isBgColor(...rgb(start))) continue;
    const region = [];
    const st = [start];
    seen[start] = 1;
    while (st.length) {
      const p = st.pop();
      region.push(p);
      const x = p % W, y = (p / W) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (q < 0 || seen[q] || bg[q] || !isBgColor(...rgb(q))) continue;
        seen[q] = 1;
        st.push(q);
      }
    }
    let white = 0, gray = 0;
    for (const p of region) {
      const c = rgb(p);
      if (isWhite(...c)) white++;
      else if (isCheckerGray(...c)) gray++;
    }
    if (region.length >= 12 && white >= region.length * 0.15 && gray >= region.length * 0.15) for (const p of region) bg[p] = 1;
  }

  // 3) 그림 덩어리 (8방향)
  const label = new Int32Array(W * H).fill(-1);
  const comps = [];
  for (let start = 0; start < W * H; start++) {
    if (bg[start] || label[start] !== -1) continue;
    const id = comps.length;
    const st = [start];
    label[start] = id;
    let count = 0, minX = W, minY = H, maxX = 0, maxY = 0;
    while (st.length) {
      const p = st.pop();
      count++;
      const x = p % W, y = (p / W) | 0;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (!bg[q] && label[q] === -1) { label[q] = id; st.push(q); }
      }
    }
    comps.push({ id, count, minX, minY, maxX, maxY });
  }

  // 작은 조각(뿌리기 가루 등)은 가까운 큰 덩어리에 붙인다 — 붙일 곳이 없으면 버린다
  const big = comps.filter((c) => c.count >= 400);
  const groups = big.map((c) => ({ ids: [c.id], minX: c.minX, minY: c.minY, maxX: c.maxX, maxY: c.maxY, count: c.count }));
  for (const c of comps.filter((c) => c.count < 400 && c.count >= 8)) {
    let best = null, bestDist = 14;
    for (const g of groups) {
      const dx = Math.max(g.minX - c.maxX, 0, c.minX - g.maxX), dy = Math.max(g.minY - c.maxY, 0, c.minY - g.maxY);
      const d = Math.max(dx, dy);
      if (d < bestDist) { bestDist = d; best = g; }
    }
    if (best) { best.ids.push(c.id); best.minX = Math.min(best.minX, c.minX); best.minY = Math.min(best.minY, c.minY); best.maxX = Math.max(best.maxX, c.maxX); best.maxY = Math.max(best.maxY, c.maxY); }
  }
  groups.sort((a, b) => (Math.abs(a.minY - b.minY) < 25 ? a.minX - b.minX : a.minY - b.minY));

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const PAD = 3;
  const parts = groups.map((g, index) => {
    const ids = new Set(g.ids);
    const w = g.maxX - g.minX + 1 + PAD * 2, h = g.maxY - g.minY + 1 + PAD * 2;
    const out = Buffer.alloc(w * h * 4);
    for (let y = g.minY; y <= g.maxY; y++) for (let x = g.minX; x <= g.maxX; x++) {
      const p = y * W + x;
      if (!ids.has(label[p])) continue;
      const o = ((y - g.minY + PAD) * w + (x - g.minX + PAD)) * 4;
      const [r, gg, b] = rgb(p);
      out[o] = r; out[o + 1] = gg; out[o + 2] = b; out[o + 3] = 255;
    }
    // 가장자리 한 줄은 살짝 투명하게 (계단 현상 완화)
    const alpha = Buffer.alloc(w * h);
    for (let i = 0; i < w * h; i++) alpha[i] = out[i * 4 + 3];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!alpha[i]) continue;
      if (!alpha[i - 1] || !alpha[i + 1] || !alpha[i - w] || !alpha[i + w]) out[i * 4 + 3] = 170;
    }
    const file = path.join(OUT, `${String(index).padStart(3, "0")}.png`);
    fs.writeFileSync(file, encodePng({ width: w, height: h, data: out }));
    return { index, w, h, x: g.minX, y: g.minY, data: out };
  });

  // 번호 순 격자 (칸 110px, 12열, 칸 왼쪽 위에 번호 대신 행·열로 찾는다)
  const COLS = 12, CELL = 110, FIT = 96;
  const rows = Math.ceil(parts.length / COLS);
  const SW = COLS * CELL, SH = rows * CELL;
  const sheet = Buffer.alloc(SW * SH * 4);
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const o = (y * SW + x) * 4;
    const v = x % CELL === 0 || y % CELL === 0 ? 120 : ((x >> 3) + (y >> 3)) % 2 ? 232 : 250;
    sheet[o] = v; sheet[o + 1] = v; sheet[o + 2] = v; sheet[o + 3] = 255;
  }
  parts.forEach((part, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const scale = Math.min(1, FIT / Math.max(part.w, part.h));
    const dw = Math.round(part.w * scale), dh = Math.round(part.h * scale);
    const ox = col * CELL + Math.round((CELL - dw) / 2), oy = row * CELL + Math.round((CELL - dh) / 2);
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const s = (Math.min(part.h - 1, Math.floor(y / scale)) * part.w + Math.min(part.w - 1, Math.floor(x / scale))) * 4;
      const d = ((oy + y) * SW + (ox + x)) * 4;
      const a = part.data[s + 3] / 255;
      for (let k = 0; k < 3; k++) sheet[d + k] = Math.round(part.data[s + k] * a + sheet[d + k] * (1 - a));
    }
  });
  fs.writeFileSync(path.join(__dirname, "sheet-contact.png"), encodePng({ width: SW, height: SH, data: sheet }));
  fs.writeFileSync(path.join(__dirname, "sheet-index.txt"), parts.map((p) => `${String(p.index).padStart(3, "0")}\t${p.w}x${p.h}\tat ${p.x},${p.y}`).join("\n"));
  console.log("parts", parts.length, "contact", SW, "x", SH);
})();
