import type { CakeData, Customer } from "./gameState";
import { CREAM_TARGET_THICKNESS, FILLING_TARGET_THICKNESS, scoreFrostingLayer, scoreSpread } from "./frosting";

// ---- ⑤ 서빙 결과 채점 (cake-tycoon-prompt.md 12장) ----
// Phase 1은 각 항목을 0~100으로 단순 계산하고, 총점은 단순 평균 (가중치 없음).

const CAKE_PRICE = 30; // 총점 100일 때 받는 금액 (Phase 1 임시값)
// 주문 확정 ~ 서빙까지 손님이 기다린 시간. 오븐만 50초라 여러 주문을 병행하는 걸 감안해 넉넉히 잡았다 (임시값)
const SPEED_PERFECT_MS = 150_000; // 이 시간 안에 서빙하면 속도 만점
const SPEED_SLOW_MS = 360_000; // 이 시간 이상 기다리게 하면 속도 최저점
const SPEED_MIN_SCORE = 40;

export type ServeResult = {
  accuracy: number; // 주문 정확도: 주문한 재료/문구와 일치하는지
  quality: number; // 제작 품질: 반죽 양 + 굽기 + 필링/크림의 범위·균일도·양 (크림 양은 이 손님이 주문한 양 기준)
  decoration: number; // 데코레이션: 자유 그림 / 텍스트 유무
  speed: number; // 속도: 주문 확정 ~ 서빙까지 손님이 기다린 시간
  total: number;
  money: number;
  tip: number; // Phase 1은 player.tipTotal에 누적만 한다 (랭크업 로직 미구현)
};

type OrderSpec = Customer["order"];

const average = (values: number[]) =>
  values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

const normalizeText = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

export function scoreAccuracy(cake: CakeData, order: OrderSpec): number {
  const checks = [
    cake.base === order.cake ? 100 : 0,
    cake.filling.materialId === order.filling ? 100 : 0,
    cake.frosting.materialId === order.frosting ? 100 : 0,
    cake.toppings.length > 0 && cake.toppings.every((topping) => topping.itemId === order.topping) ? 100 : 0,
  ];
  if (order.message) {
    const wanted = normalizeText(order.message);
    const written = cake.text.map((text) => normalizeText(text.content));
    checks.push(written.includes(wanted) ? 100 : written.some((text) => text.includes(wanted)) ? 70 : 0);
  }
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

export function scoreDecoration(cake: CakeData): number {
  return 40 + (cake.drawings.length > 0 ? 30 : 0) + (cake.text.length > 0 ? 30 : 0);
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
  const decoration = scoreDecoration(cake);
  const speed = scoreSpeed(servedAt - orderedAt);
  const total = average([accuracy, quality, decoration, speed]);
  return {
    accuracy,
    quality,
    decoration,
    speed,
    total,
    money: Math.round((CAKE_PRICE * total) / 100),
    tip: Math.round(total / 20),
  };
}
