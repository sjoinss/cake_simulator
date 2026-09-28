import type { CakeData } from "./gameState";

// 제작 단계 관련 순수 로직 (cake-tycoon-prompt.md 2장, 19장 4번 "터치 포인트 샘플링 기반 근사치" 원칙).
// Phase 1: 판정 자체는 단순하게 유지한다. 서빙 결과 채점은 lib/scoring.ts.

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
export const BATTER_MAX = BATTER_TARGET * 1.5; // 틀이 꽉 차는 양. 넘으면 흘러넘친다
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
  return `#${a
    .map((value, i) =>
      Math.round(value + (b[i] - value) * amount)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
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

export function getBakedRatio(baking: CakeData["baking"], now: number = Date.now()): number | null {
  if (baking.startTime === null) return null;
  return getBakingElapsedRatio(baking.startTime, baking.duration || OVEN_DURATION_MS, baking.endTime ?? now);
}
