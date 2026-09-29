// 키위 단면 그림 (원본 에셋의 키위가 전부 잘려 있어서 같은 파스텔 톤으로 직접 그린다)
const fs = require("fs");
const path = require("path");
const { encodePng } = require("./png-tools.cjs");

const SIZE = 96, SS = 4;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const OUTLINE = hex("#8a6a4f"), SKIN = hex("#b89a6e"), FLESH_OUT = hex("#8fcf4f"), FLESH_IN = hex("#c6ec8c"), CORE = hex("#fbf6de"), SEED = hex("#3d3226"), SHINE = [255, 255, 255];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function colorAt(x, y) {
  const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy), angle = Math.atan2(dy, dx);
  if (r > 0.47) return null;
  if (r > 0.445) return OUTLINE;
  if (r > 0.415) return SKIN;
  // 씨앗: 반지름 0.2 부근에 한 바퀴, 방사형으로 살짝 긴 타원
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, rr = i % 2 ? 0.215 : 0.195;
    const sx = 0.5 + Math.cos(a) * rr, sy = 0.5 + Math.sin(a) * rr;
    const ux = Math.cos(a), uy = Math.sin(a);
    const along = (x - sx) * ux + (y - sy) * uy, across = -(x - sx) * uy + (y - sy) * ux;
    if ((along / 0.028) ** 2 + (across / 0.016) ** 2 <= 1) return SEED;
  }
  // 과육: 바깥 진한 초록 → 안쪽 밝은 초록, 방사형 줄무늬
  if (r > 0.13) {
    const stripe = 0.06 * Math.max(0, Math.cos(angle * 24));
    let c = mix(FLESH_IN, FLESH_OUT, Math.min(1, (r - 0.13) / 0.29) + stripe);
    // 왼쪽 위 하이라이트
    const hl = Math.hypot(x - 0.32, y - 0.3);
    if (hl < 0.1) c = mix(c, SHINE, 0.35 * (1 - hl / 0.1));
    return c;
  }
  return mix(CORE, FLESH_IN, Math.max(0, (r - 0.08) / 0.05));
}

const data = Buffer.alloc(SIZE * SIZE * 4);
for (let py = 0; py < SIZE; py++) for (let px = 0; px < SIZE; px++) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
    const c = colorAt((px + (sx + 0.5) / SS) / SIZE, (py + (sy + 0.5) / SS) / SIZE);
    if (!c) continue;
    r += c[0]; g += c[1]; b += c[2]; n++;
  }
  const o = (py * SIZE + px) * 4;
  if (n) { data[o] = r / n; data[o + 1] = g / n; data[o + 2] = b / n; data[o + 3] = Math.round((255 * n) / (SS * SS)); }
}
fs.writeFileSync(path.join(__dirname, "../../public/images/assets/toppings/kiwi.png"), encodePng({ width: SIZE, height: SIZE, data }));
console.log("kiwi drawn");
