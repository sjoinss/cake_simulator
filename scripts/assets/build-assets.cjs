// 순서: node clean-assets.cjs (원본 정리 + contact-sheet.png로 눈 확인) → node build-assets.cjs (쓸 것만 이름 붙여 복사) → node draw-kiwi.cjs (키위는 직접 그림)
// 정리한 그림(cleaned/) 중 쓸 것만 실제 내용에 맞는 이름으로 public/images/assets/ 에 복사한다.
// 원본 파일 이름이 내용과 어긋나 있어서(자동 자르기 오류) 눈으로 확인한 대응표를 쓴다.
const fs = require("fs");
const path = require("path");
const { decodePng, encodePng } = require("./png-tools.cjs");

const CLEAN = path.join(__dirname, "cleaned");
const DEST = path.join(__dirname, "../../public/images/assets");
fs.rmSync(DEST, { recursive: true, force: true });

const MAP = {
  // 토핑 (선반 그릇 위 + 케이크 위)
  "toppings/strawberry.png": "02_fruit_toppings/strawberry_small.png",
  "toppings/cherry.png": "02_fruit_toppings/cherries_pair.png",
  "toppings/chocochip.png": "03_sprinkles_chocolate_candy/marshmallows.png",
  "toppings/blueberry.png": "02_fruit_toppings/blueberry_small.png",
  "toppings/raspberry.png": "02_fruit_toppings/raspberry_small.png",
  "toppings/peach.png": "02_fruit_toppings/peach.png",
  "toppings/green_grape.png": "02_fruit_toppings/purple_grapes.png",
  "toppings/mango.png": "02_fruit_toppings/mango_cubes.png",
  "toppings/marshmallow.png": "03_sprinkles_chocolate_candy/caramel_crunch.png",
  // 크림 짤주머니 (선반)
  "creams/vanilla.png": "01_cream_piping/bag_cream.png",
  "creams/chocolate.png": "01_cream_piping/bag_chocolate.png",
  "creams/strawberry.png": "01_cream_piping/bag_pink.png",
  "creams/matcha.png": "01_cream_piping/bag_mint.png",
  // 데코 스티커
  "stickers/swirl_pink.png": "01_cream_piping/swirl_pink.png",
  "stickers/swirl_vanilla.png": "01_cream_piping/swirl_vanilla.png",
  "stickers/swirl_chocolate.png": "01_cream_piping/swirl_chocolate.png",
  "stickers/swirl_mint.png": "01_cream_piping/swirl_mint.png",
  "stickers/swirl_lavender.png": "01_cream_piping/swirl_lavender.png",
  "stickers/swirl_yellow.png": "01_cream_piping/swirl_yellow.png",
  "stickers/flower_blue.png": "01_cream_piping/border_flower_mix.png",
  "stickers/flowers_pink.png": "01_cream_piping/border_rosette_mix.png",
  "stickers/bow_pink.png": "03_sprinkles_chocolate_candy/star_cookie.png",
  "stickers/bow_lavender.png": "04_decorations/candle_mint.png",
  "stickers/bow_blue.png": "04_decorations/candle_purple.png",
  "stickers/bow_gingham.png": "04_decorations/strawberry_pick.png",
  "stickers/crown.png": "04_decorations/candle_yellow.png",
  "stickers/rainbow.png": "04_decorations/crown_pink.png",
  "stickers/bunny.png": "04_decorations/bear_pick.png",
  "stickers/bear.png": "03_sprinkles_chocolate_candy/chocolate_wafer_sticks.png",
  "stickers/star_pick.png": "04_decorations/rainbow_pick.png",
  "stickers/heart_pick.png": "04_decorations/star_pick.png",
  "stickers/bow_pick.png": "04_decorations/heart_red_pick.png",
  "stickers/chocolate_heart.png": "03_sprinkles_chocolate_candy/heart_cookie.png",
  "stickers/strawberry_half.png": "02_fruit_toppings/strawberry_half.png",
  "stickers/heart.png": "04_decorations/crown_gold.png",
};

for (const [dest, src] of Object.entries(MAP)) {
  const target = path.join(DEST, dest);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(CLEAN, src), target);
}

// 키위: 모든 조각이 한쪽이 잘려 있다 — 둥근 단면은 좌우 대칭이라 남은 쪽을 뒤집어 붙여 온전한 원으로 만든다
{
  const img = decodePng(fs.readFileSync(path.join(CLEAN, "02_fruit_toppings/orange_slice.png")));
  const { width, height, data } = img;
  let minY = height, maxY = 0, minX = width;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 40) {
    minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x);
  }
  const diameter = maxY - minY + 1;
  const cx = minX + diameter / 2; // 원 중심 (남아 있는 왼쪽 끝에서 반지름만큼)
  const size = Math.ceil(diameter) + 4;
  const out = Buffer.alloc(size * size * 4);
  const ox = Math.round(cx) - size / 2, oy = minY - 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let sx = x + ox, sy = y + oy;
    if (sx > cx) sx = Math.round(2 * cx - sx); // 잘린 오른쪽은 왼쪽을 거울로
    if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
    // 원 밖(아래쪽 잘린 흔적)은 지우고 가장자리는 부드럽게
    const dist = Math.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5);
    const radius = size / 2 - 3;
    if (dist > radius + 1) continue;
    const o = (y * size + x) * 4;
    data.copy(out, o, (sy * width + sx) * 4, (sy * width + sx) * 4 + 4);
    if (dist > radius) out[o + 3] = Math.round(out[o + 3] * (radius + 1 - dist));
  }
  fs.writeFileSync(path.join(DEST, "toppings/kiwi.png"), encodePng({ width: size, height: size, data: out }));
}

// 곰: 옆에 뿌리기 조각이 따라왔다 — 가장 큰 덩어리(곰)만 남긴다
{
  const { components } = require("./png-tools.cjs");
  const file = path.join(DEST, "stickers/bear.png");
  const img = decodePng(fs.readFileSync(file));
  const { label, comps } = components(img);
  const main = comps.reduce((a, b) => (b.count > a.count ? b : a));
  const pad = 2, w = main.maxX - main.minX + 1 + pad * 2, h = main.maxY - main.minY + 1 + pad * 2;
  const out = Buffer.alloc(w * h * 4);
  for (let y = main.minY; y <= main.maxY; y++) for (let x = main.minX; x <= main.maxX; x++) {
    const p = y * img.width + x;
    const near = label[p] === main.id || (label[p] === -1 && img.data[p * 4 + 3] > 0);
    if (near) img.data.copy(out, ((y - main.minY + pad) * w + (x - main.minX + pad)) * 4, p * 4, p * 4 + 4);
  }
  fs.writeFileSync(file, encodePng({ width: w, height: h, data: out }));
}

let total = 0;
for (const dir of fs.readdirSync(DEST)) for (const f of fs.readdirSync(path.join(DEST, dir))) total += fs.statSync(path.join(DEST, dir, f)).size;
console.log("files", Object.keys(MAP).length + 1, "total KB", Math.round(total / 1024));
