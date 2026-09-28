import type { CakeData, Customer } from "./gameState";
import { CREAM_TARGET_THICKNESS, FILLING_TARGET_THICKNESS, scoreFrostingLayer, scoreSpread } from "./frosting";

// ---- ⑤ 서빙 결과 채점 (cake-tycoon-prompt.md 12장) ----
// Phase 1은 각 항목을 0~100으로 단순 계산하고, 총점은 단순 평균 (가중치 없음).

const CAKE_PRICE = 30; // 총점 100일 때 받는 금액 (Phase 1 임시값)
// 주문 확정 ~ 서빙까지 손님이 기다린 시간. 오븐만 50초라 여러 주문을 병행하는 걸 감안해 넉넉히 잡았다 (임시값)
const SPEED_PERFECT_MS = 150_000; // 이 시간 안에 서빙하면 속도 만점
const SPEED_SLOW_MS = 360_000; // 이 시간 이상 기다리게 하면 속도 최저점
const SPEED_MIN_SCORE = 40;
// 데코는 플레이어 재미용이라 점수에 넣지 않는다. 적당히 꾸미면(그림 2획 이상 또는 글자) 팁을 조금 더 받는다.
const DECO_TIP = 3;
const DECO_TIP_MIN_EFFORT = 2;

export type ServeResult = {
  accuracy: number; // 주문 정확도: 주문한 재료와 일치하는지
  quality: number; // 제작 품질: 반죽 양 + 굽기 + 필링/크림의 범위·균일도·양 (크림 양은 이 손님이 주문한 양 기준)
  speed: number; // 속도: 주문 확정 ~ 서빙까지 손님이 기다린 시간
  total: number;
  money: number;
  tip: number; // 데코 팁. 돈에 더해지고 player.tipTotal(랭크업 경험치)에도 쌓인다
};

type OrderSpec = Customer["order"];

const average = (values: number[]) =>
  values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

export function scoreAccuracy(cake: CakeData, order: OrderSpec): number {
  const checks = [
    cake.base === order.cake ? 100 : 0,
    cake.filling.materialId === order.filling ? 100 : 0,
    cake.frosting.materialId === order.frosting ? 100 : 0,
    cake.toppings.length > 0 && cake.toppings.every((topping) => topping.itemId === order.topping) ? 100 : 0,
  ];
  return average(checks);
}

// 케이크는 주문과 묶여 있지 않아서, 필링/크림 점수는 서빙받은 손님의 주문(크림 양) 기준으로 이 자리에서 계산한다
export function scoreQuality(cake: CakeData, order: OrderSpec): number {
  const filling = scoreSpread(cake.filling.cells, FILLING_TARGET_THICKNESS);
  const frosting = scoreFrostingLayer(
    cake.frosting.cells,
    cake.frosting.side,
    CREAM_TARGET_THICKNESS[order.creamAmount],
  );
  return average([
    cake.batter.score,
    cake.baking.doneness,
    average([filling.coverage, filling.evenness, filling.amount]),
    average([frosting.coverage, frosting.evenness, frosting.amount]),
  ]);
}

export function getDecorationTip(cake: CakeData): number {
  const effort = cake.drawings.length + cake.text.length * DECO_TIP_MIN_EFFORT;
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
  const total = average([accuracy, quality, speed]);
  return {
    accuracy,
    quality,
    speed,
    total,
    money: Math.round((CAKE_PRICE * total) / 100),
    tip: getDecorationTip(cake),
  };
}
