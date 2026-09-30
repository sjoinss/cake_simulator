// extract-from-sheet.cjs가 시트에서 뽑은 조각(sheet-parts/NNN.png) 중 쓸 것을 이름 붙여 public/images/assets/ 로 복사한다.
// 번호는 sheet-contact.png(12열 격자, 왼쪽 위부터 0번)를 눈으로 보고 맞췄다. 시트가 바뀌면 격자를 다시 보고 고칠 것.
// 경로(파일 이름)는 저장된 스티커·재료가 가리키므로 바꾸지 말고, 새 그림은 새 이름으로 추가한다.
const fs = require("fs");
const path = require("path");

const PARTS = path.join(__dirname, "sheet-parts");
const DEST = path.join(__dirname, "../../public/images/assets");

const MAP = {
  // 토핑
  "toppings/strawberry.png": 57,
  "toppings/cherry.png": 40,
  "toppings/chocochip.png": 74,
  "toppings/kiwi.png": 63,
  "toppings/blueberry.png": 38,
  "toppings/raspberry.png": 59,
  "toppings/peach.png": 46,
  "toppings/green_grape.png": 41,
  "toppings/mango.png": 47,
  "toppings/marshmallow.png": 69,
  "toppings/banana.png": 43,
  "toppings/sprinkles.png": 66,
  "toppings/orange.png": 45,
  "toppings/chocostick.png": 68,
  "toppings/starsugar.png": 71,
  "toppings/fig.png": 54,
  // 크림 짤주머니
  "creams/vanilla.png": 1,
  "creams/strawberry.png": 2,
  "creams/matcha.png": 4,
  "creams/chocolate.png": 7,
  "creams/lemon.png": 3,
  "creams/soda.png": 5,
  "creams/lavender.png": 6,
  // 스티커 (기존 이름)
  "stickers/swirl_vanilla.png": 8,
  "stickers/swirl_pink.png": 9,
  "stickers/swirl_yellow.png": 11,
  "stickers/swirl_lavender.png": 12,
  "stickers/swirl_mint.png": 14,
  "stickers/swirl_chocolate.png": 16,
  "stickers/heart.png": 22,
  "stickers/flowers_pink.png": 28,
  "stickers/flower_blue.png": 31,
  "stickers/strawberry_half.png": 37,
  "stickers/bear.png": 76,
  "stickers/bunny.png": 79,
  "stickers/chocolate_heart.png": 82,
  "stickers/rainbow.png": 86,
  "stickers/crown.png": 95,
  "stickers/bow_pink.png": 96,
  "stickers/bow_lavender.png": 97,
  "stickers/bow_blue.png": 98,
  "stickers/heart_pick.png": 99,
  "stickers/star_pick.png": 100,
  "stickers/bow_pick.png": 111,
  "stickers/bow_gingham.png": 117,
  // 스티커 (새로 온전해진 것)
  "stickers/heart_cream.png": 23,
  "stickers/flower_yellow.png": 32,
  "stickers/macarons.png": 75,
  "stickers/candle_pink.png": 89,
  "stickers/candle_blue.png": 90,
  "stickers/candle_yellow.png": 91,
  "stickers/candle_green.png": 92,
  "stickers/crown_gold.png": 94,
  "stickers/bear_pick.png": 104,
  "stickers/bunny_pick.png": 105,
  "stickers/birthday_sign.png": 106,
};

fs.rmSync(DEST, { recursive: true, force: true });
for (const [dest, index] of Object.entries(MAP)) {
  const target = path.join(DEST, dest);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(PARTS, `${String(index).padStart(3, "0")}.png`), target);
}
let total = 0;
for (const dir of fs.readdirSync(DEST)) for (const f of fs.readdirSync(path.join(DEST, dir))) total += fs.statSync(path.join(DEST, dir, f)).size;
console.log("files", Object.keys(MAP).length, "total KB", Math.round(total / 1024));
