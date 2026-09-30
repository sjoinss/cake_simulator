import type { CakeData, Customer } from "./gameState";
import { CREAM_TARGET_THICKNESS, FILLING_TARGET_THICKNESS, layerScore, scoreFrostingLayer, scoreSpread } from "./frosting";
import { getBakingElapsedRatio, OVEN_IDEAL_START_RATIO } from "./gameLogic";

// ---- ⑤ 서빙 결과 채점 (cake-tycoon-prompt.md 12장) ----
// Phase 1은 각 항목을 0~100으로 단순 계산하고, 총점은 단순 평균 (가중치 없음).

const CAKE_PRICE = 30; // 총점 100일 때 받는 금액 (Phase 1 임시값)
// 주문 확정 ~ 서빙까지 손님이 기다린 시간. 오븐만 50초라 여러 주문을 병행하는 걸 감안해 넉넉히 잡았다 (임시값)
// (사용자 요청으로 줄임: 예전 150초/360초/40점이라 거의 항상 만점이었다. 케이크 하나를 쉬지 않고 만들면 약 90초)
const SPEED_PERFECT_MS = 100_000; // 이 시간 안에 서빙하면 속도 만점
const SPEED_SLOW_MS = 220_000; // 이 시간 이상 기다리게 하면 속도 최저점
const SPEED_MIN_SCORE = 20;
// 총점: 케이크 자체(제작 품질)가 가장 중요하다 — 재료가 맞고 빨라도 엉망으로 만들면 만족도는 낮다 (사용자 결정)
const TOTAL_WEIGHTS = { quality: 0.5, accuracy: 0.25, speed: 0.25 };
const TOTAL_ABOVE_QUALITY_MAX = 10; // 총점은 제작 품질 + 이 값을 넘지 못한다
// 데코는 플레이어 재미용이라 점수에 넣지 않는다. 적당히 꾸미면(그림 2획 이상 또는 글자) 팁을 조금 더 받는다.
const DECO_TIP = 3;
const DECO_TIP_MIN_EFFORT = 2;
// 받는 돈: 총점 30점을 0으로 보고 100점이면 CAKE_PRICE. 50점 → $9, 70점 → $17, 100점 → $30 (잘 만들수록 확 오른다)
const PRICE_ZERO_SCORE = 30;
// 망친 케이크 (사용자 요청: 덜 익은 시트에 크림 대충 발라도 좋아하며 돈을 줬음).
// 아래 중 하나라도 걸리면 손님이 화내고 돈을 못 받고 재료비만큼 잃는다. 경험치·팁도 없다
const FAIL_PENALTY = 10;
const FAIL_ACCURACY = 50; // 주문 재료 절반 이상 틀림
const FAIL_DONENESS = 50; // 굽기 점수 (덜 익음 ≈ 28초 전에 꺼냄 / 탐)
const FAIL_LAYER = 40; // 필링·크림 각각 (범위·양 층 점수)
const FAIL_TOTAL = 50;
const MEH_TOTAL = 80; // 이보다 낮으면 먹긴 하지만 시큰둥 (😐) — 대충 바른 케이크가 여기 걸리게 했다

export type CustomerMood = "happy" | "meh" | "angry";

export type ServeResult = {
  accuracy: number; // 주문 정확도: 주문한 재료와 일치하는지
  quality: number; // 제작 품질: 반죽 양 + 굽기 + 필링/크림의 범위·양 (크림 양은 이 손님이 주문한 양 기준)
  speed: number; // 속도: 주문 확정 ~ 서빙까지 손님이 기다린 시간
  total: number;
  money: number;
  tip: number; // 데코 팁. 돈에 더해지고 player.tipTotal에도 쌓인다
  failReason: string | null; // 망친 케이크면 이유 (money는 음수, 경험치 없음)
  mood: CustomerMood;
};

type OrderSpec = Customer["order"];

const average = (values: number[]) =>
  values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

// 토핑: 전부 주문한 토핑이어야 하고, 개수까지 주문했으면 하나 차이마다 25점씩 깎는다
function scoreToppings(cake: CakeData, order: OrderSpec): number {
  if (cake.toppings.length === 0 || cake.toppings.some((topping) => topping.itemId !== order.topping)) return 0;
  if (order.toppingCount === undefined) return 100;
  return Math.max(0, 100 - 25 * Math.abs(cake.toppings.length - order.toppingCount));
}

export function scoreAccuracy(cake: CakeData, order: OrderSpec): number {
  const checks = [
    cake.base === order.cake ? 100 : 0,
    cake.filling.materialId === order.filling ? 100 : 0,
    cake.frosting.materialId === order.frosting ? 100 : 0,
    scoreToppings(cake, order),
  ];
  return average(checks);
}

// 케이크는 주문과 묶여 있지 않아서, 필링/크림 점수는 서빙받은 손님의 주문(크림 양) 기준으로 이 자리에서 계산한다
function scoreLayers(cake: CakeData, order: OrderSpec) {
  const filling = scoreSpread(cake.filling.cells, FILLING_TARGET_THICKNESS);
  const frosting = scoreFrostingLayer(
    cake.frosting.cells,
    cake.frosting.side,
    CREAM_TARGET_THICKNESS[order.creamAmount],
  );
  return { filling: layerScore(filling), frosting: layerScore(frosting) };
}

// 제작 품질: 반죽·굽기·필링·크림의 평균에 가장 나쁜 단계를 절반 섞는다.
// 단순 평균이면 반죽·굽기가 만점일 때 필링·크림을 엉망으로 발라도 가려져서 만족도가 높게 나왔다 (사용자 피드백)
export function scoreQuality(cake: CakeData, order: OrderSpec): number {
  const layers = scoreLayers(cake, order);
  const parts = [cake.batter.score, cake.baking.doneness, layers.filling, layers.frosting];
  return Math.round((average(parts) + Math.min(...parts)) / 2);
}

// 망친 케이크인지 — 손님이 화내는 이유를 돌려준다 (결과 카드에 그대로 보여줌)
function findFailReason(cake: CakeData, order: OrderSpec, accuracy: number, total: number): string | null {
  if (accuracy < FAIL_ACCURACY) return "주문이랑 전혀 다른 케이크예요";
  if (cake.baking.doneness < FAIL_DONENESS) {
    const { startTime, endTime, duration } = cake.baking;
    const ratio = startTime && endTime ? getBakingElapsedRatio(startTime, duration, endTime) : 0;
    return ratio < OVEN_IDEAL_START_RATIO ? "시트가 덜 익었어요" : "시트가 탔어요";
  }
  const layers = scoreLayers(cake, order);
  if (layers.filling < FAIL_LAYER) return "필링이 엉망이에요";
  if (layers.frosting < FAIL_LAYER) return "크림이 엉망이에요";
  if (total < FAIL_TOTAL) return "전체적으로 너무 아쉬운 케이크예요";
  return null;
}

export function getDecorationTip(cake: CakeData): number {
  // 그림 획(모양 도장 포함) 1, 스티커 1, 글자 2 — 합이 기준 이상이면 팁
  const effort = cake.drawings.length + (cake.decorations?.length ?? 0) + cake.text.length * DECO_TIP_MIN_EFFORT;
  return effort >= DECO_TIP_MIN_EFFORT ? DECO_TIP : 0;
}

export function scoreSpeed(elapsedMs: number): number {
  if (elapsedMs <= SPEED_PERFECT_MS) return 100;
  if (elapsedMs >= SPEED_SLOW_MS) return SPEED_MIN_SCORE;
  const ratio = (elapsedMs - SPEED_PERFECT_MS) / (SPEED_SLOW_MS - SPEED_PERFECT_MS);
  return Math.round(100 - ratio * (100 - SPEED_MIN_SCORE));
}

export function scoreServedCake(cake: CakeData, order: OrderSpec, orderedAt: number, servedAt: number): ServeResult {
  const accuracy = scoreAccuracy(cake, order);
  const quality = scoreQuality(cake, order);
  const speed = scoreSpeed(servedAt - orderedAt);
  const weighted = Math.round(
    quality * TOTAL_WEIGHTS.quality + accuracy * TOTAL_WEIGHTS.accuracy + speed * TOTAL_WEIGHTS.speed,
  );
  const total = Math.min(weighted, quality + TOTAL_ABOVE_QUALITY_MAX);
  const failReason = findFailReason(cake, order, accuracy, total);
  return {
    accuracy,
    quality,
    speed,
    total,
    money: failReason
      ? -FAIL_PENALTY
      : Math.round((CAKE_PRICE * Math.max(0, total - PRICE_ZERO_SCORE)) / (100 - PRICE_ZERO_SCORE)),
    tip: failReason ? 0 : getDecorationTip(cake),
    failReason,
    mood: failReason ? "angry" : total < MEH_TOTAL ? "meh" : "happy",
  };
}
