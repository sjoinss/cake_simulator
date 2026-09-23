import type { ActiveOrder, Customer } from './gameState';

// 제작 단계 관련 순수 로직 (cake-tycoon-prompt.md 2장, 19장 4번 "터치 포인트 샘플링 기반 근사치" 원칙).
// Phase 1: 판정 자체는 단순하게 유지한다. 서빙 결과 채점은 파일 하단 scoreServedCake 참고.

export const OVEN_DURATION_MS = 6000; // 모바일 캐주얼 게임 호흡에 맞춰 6초로 설정 (Phase 1 임시값)
const OVEN_IDEAL_START_RATIO = 0.7; // 70%~90% 구간이 "적정 구간"
const OVEN_IDEAL_END_RATIO = 0.9;

// startTime~now 경과 시간을 duration 대비 비율로 변환한다. 다른 화면에 있다가 돌아와도
// 절대 시각(Date.now()) 기준으로 계산하므로 정확하다.
export function getBakingElapsedRatio(startTime: number, duration: number, now: number = Date.now()): number {
  return (now - startTime) / duration;
}

// 굽기 정도 점수(0~100). 너무 일찍/늦게 꺼내면 감점, 적정 구간(70~90%)이면 만점.
export function scoreBaking(elapsedRatio: number): number {
  if (elapsedRatio < OVEN_IDEAL_START_RATIO) {
    return Math.max(10, Math.round((elapsedRatio / OVEN_IDEAL_START_RATIO) * 70));
  }
  if (elapsedRatio <= OVEN_IDEAL_END_RATIO) {
    return 100;
  }
  const overshoot = elapsedRatio - OVEN_IDEAL_END_RATIO;
  return Math.max(10, Math.round(100 - overshoot * 200));
}

// 크림 바르기 판정: 매 프레임 픽셀 분석 대신, 드래그 중 지나간 그리드 셀을 표시해두고
// 칠해진 비율(coverage)과 4분면 간 편차(evenness)로 근사치를 낸다.
export function scoreFrostingCoverage(paintedCells: number, totalCells: number): number {
  if (totalCells === 0) return 0;
  return Math.round((paintedCells / totalCells) * 100);
}

export function scoreFrostingEvenness(quadrantCounts: number[], quadrantSize: number): number {
  if (quadrantSize === 0) return 0;
  const ratios = quadrantCounts.map((count) => count / quadrantSize);
  const max = Math.max(...ratios);
  const min = Math.min(...ratios);
  return Math.round((1 - (max - min)) * 100);
}

// ---- ⑤ 서빙 결과 채점 (cake-tycoon-prompt.md 12장) ----
// Phase 1은 각 항목을 0~100으로 단순 계산하고, 총점은 단순 평균 (가중치 없음).

const CAKE_PRICE = 30; // 총점 100일 때 받는 금액 (Phase 1 임시값)
const SPEED_PERFECT_MS = 60_000; // 이 시간 안에 완성하면 속도 만점
const SPEED_SLOW_MS = 180_000; // 이 시간 이상 걸리면 속도 최저점
const SPEED_MIN_SCORE = 40;

export type ServeResult = {
  accuracy: number; // 주문 정확도: 주문한 재료/문구와 일치하는지
  quality: number; // 제작 품질: 굽기 + 크림 범위 + 크림 균일도
  decoration: number; // 데코레이션: 자유 그림 / 텍스트 유무
  speed: number; // 속도: 제작 시작 ~ 완성까지 걸린 시간
  total: number;
  money: number;
  tip: number; // Phase 1은 player.tipTotal에 누적만 한다 (랭크업 로직 미구현)
};

type OrderSpec = Customer['order'];
type CakeData = ActiveOrder['cake'];

const average = (values: number[]) =>
  values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

const normalizeText = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

export function scoreAccuracy(cake: CakeData, order: OrderSpec): number {
  const checks = [
    cake.base === order.cake ? 100 : 0,
    cake.filling === order.frosting ? 100 : 0,
    cake.toppings.length > 0 && cake.toppings.every((topping) => topping.itemId === order.topping) ? 100 : 0,
  ];
  if (order.message) {
    const wanted = normalizeText(order.message);
    const written = cake.text.map((text) => normalizeText(text.content));
    checks.push(written.includes(wanted) ? 100 : written.some((text) => text.includes(wanted)) ? 70 : 0);
  }
  return average(checks);
}

export function scoreQuality(cake: CakeData): number {
  return average([cake.baking.doneness, cake.frosting.coverage, cake.frosting.evenness]);
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

export function scoreServedCake(
  cake: CakeData,
  order: OrderSpec,
  createdAt: number,
  completedAt: number | null,
): ServeResult {
  const accuracy = scoreAccuracy(cake, order);
  const quality = scoreQuality(cake);
  const decoration = scoreDecoration(cake);
  const speed = scoreSpeed((completedAt ?? Date.now()) - createdAt);
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
