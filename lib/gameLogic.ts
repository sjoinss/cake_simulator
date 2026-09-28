import type { ActiveOrder, Customer } from './gameState';

// 제작 단계 관련 순수 로직 (cake-tycoon-prompt.md 2장, 19장 4번 "터치 포인트 샘플링 기반 근사치" 원칙).
// Phase 1: 판정 자체는 단순하게 유지한다. 서빙 결과 채점은 파일 하단 scoreServedCake 참고.

// 오븐 한 바퀴 50초, 80%~95%(40~47.5초) 구간이 "적정 구간" (Phase 1 임시값).
// 굽는 동안 다른 스테이션 일을 병행하라는 의도라 일부러 길게 잡았다 (Papa's 방식).
export const OVEN_DURATION_MS = 50_000;
export const OVEN_IDEAL_START_RATIO = 0.8;
export const OVEN_IDEAL_END_RATIO = 0.95;
export const OVEN_BURNT_RATIO = 1.2; // 이 이상 두면 탄다 (오븐 탭이 빨갛게 경고)

// startTime~now 경과 시간을 duration 대비 비율로 변환한다. 다른 화면에 있다가 돌아와도
// 절대 시각(Date.now()) 기준으로 계산하므로 정확하다.
export function getBakingElapsedRatio(startTime: number, duration: number, now: number = Date.now()): number {
  return (now - startTime) / duration;
}

// 굽기 정도 점수(0~100). 너무 일찍/늦게 꺼내면 감점, 적정 구간이면 만점.
export function scoreBaking(elapsedRatio: number): number {
  if (elapsedRatio < OVEN_IDEAL_START_RATIO) {
    return Math.max(10, Math.round((elapsedRatio / OVEN_IDEAL_START_RATIO) * 70));
  }
  if (elapsedRatio <= OVEN_IDEAL_END_RATIO) {
    return 100;
  }
  const overshoot = elapsedRatio - OVEN_IDEAL_END_RATIO;
  return Math.max(10, Math.round(100 - overshoot * 300));
}

// 반죽 붓기: 누르고 있는 동안 일정 속도로 차오르고, 적정량(초록 띠)에 맞춰 손을 떼야 한다
export const BATTER_TARGET = 100;
export const BATTER_FLOW_PER_SEC = 25; // 적정량까지 약 4초
export const AMOUNT_BAND = 0.1; // 게이지에 초록 띠로 표시하는 적정량 ±10%

// 양 판정 공용 (반죽, 필링, 크림): 목표와의 차이가 20%면 70점, 67% 이상이면 0점
export function scoreAmountMatch(total: number, target: number): number {
  if (target <= 0 || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(100 - Math.abs(total / target - 1) * 150)));
}

// 구운 정도에 따라 시트 색을 섞는다: 반죽색 → (적정) 황금 갈색 → 진한 갈색 → 탄 색.
// 예전엔 CSS filter(sepia/saturate)로 했는데 밝은 반죽색이 누르스름한 연두빛으로 변해서 색을 직접 섞는 방식으로 바꿨다.
const BAKE_KEYFRAMES: [number, string, number][] = [
  // [경과 비율, 섞을 색, 섞는 비율]
  [0, "#ffffff", 0],
  [0.85, "#d99a52", 0.75],
  [1.1, "#9c5f2c", 0.85],
  [1.5, "#3a2418", 0.95],
];

const mixHex = (from: string, to: string, amount: number) => {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const a = parse(from);
  const b = parse(to);
  return `#${a.map((value, i) => Math.round(value + (b[i] - value) * amount).toString(16).padStart(2, "0")).join("")}`;
};

export function getBakedColor(baseColor: string, elapsedRatio: number | null): string {
  if (elapsedRatio === null || elapsedRatio <= 0) return baseColor;
  const ratio = Math.min(elapsedRatio, 1.5);
  const nextIndex = BAKE_KEYFRAMES.findIndex(([at]) => at >= ratio);
  const [atB, colorB, mixB] = BAKE_KEYFRAMES[nextIndex];
  const [atA, colorA, mixA] = BAKE_KEYFRAMES[Math.max(0, nextIndex - 1)];
  const t = atB === atA ? 1 : (ratio - atA) / (atB - atA);
  // 두 키프레임 사이를 보간: 각 키프레임에서 섞은 색을 다시 섞는다
  return mixHex(mixHex(baseColor, colorA, mixA), mixHex(baseColor, colorB, mixB), t);
}

export function getBakedRatio(baking: ActiveOrder['cake']['baking'], now: number = Date.now()): number | null {
  if (baking.startTime === null) return null;
  return getBakingElapsedRatio(baking.startTime, baking.duration || OVEN_DURATION_MS, baking.endTime ?? now);
}

// ---- ⑤ 서빙 결과 채점 (cake-tycoon-prompt.md 12장) ----
// Phase 1은 각 항목을 0~100으로 단순 계산하고, 총점은 단순 평균 (가중치 없음).

const CAKE_PRICE = 30; // 총점 100일 때 받는 금액 (Phase 1 임시값)
// 주문 확정 ~ 완성까지. 오븐만 50초라 여러 주문을 병행하는 걸 감안해 넉넉히 잡았다 (임시값)
const SPEED_PERFECT_MS = 150_000; // 이 시간 안에 완성하면 속도 만점
const SPEED_SLOW_MS = 360_000; // 이 시간 이상 걸리면 속도 최저점
const SPEED_MIN_SCORE = 40;

export type ServeResult = {
  accuracy: number; // 주문 정확도: 주문한 재료/문구와 일치하는지
  quality: number; // 제작 품질: 반죽 양 + 굽기 + 필링/크림의 범위·균일도·양
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

export function scoreQuality(cake: CakeData): number {
  const { filling, frosting } = cake;
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
