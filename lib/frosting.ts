import type { CreamAmount, SpreadLayer } from './gameState';
import { scoreAmountMatch } from './gameLogic';

// 짤주머니로 짜서 바르는 층(필링, 겉 크림) 판정 (cake-tycoon-prompt.md 2장 "균일도/범위/양", 1장 4번 프레스&홀드, 19장 4번 샘플링 근사치).
// 케이크 위를 GRID x GRID 칸으로 나누고, 누르고 있는 동안 짤주머니 위치 주변 칸에 크림 두께가 쌓인다.
// 한 자리에 오래 머물면 그 자리만 두꺼워지고, 너무 빨리 지나가면 얇게 발려서 시트가 비친다.

export const FROSTING_GRID = 12;
export const FROSTING_CELL_COUNT = FROSTING_GRID * FROSTING_GRID;
const CAKE_RADIUS = 0.48; // 칸 중심이 이 반경(케이크 영역 대비 비율) 안에 있어야 케이크 위 칸으로 친다

// 초당 짜지는 크림 양(칸 두께 단위의 합). "보통" 주문을 딱 맞게 바르려면 대략 7초 정도 짜야 한다.
export const CREAM_FLOW_PER_SEC = 16;

// 필링(시트 사이 잼/크림)은 주문에 양이 없고 항상 이 두께가 적정량이다
export const FILLING_TARGET_THICKNESS = 0.8;

// 주문한 크림 양별 칸당 목표 두께
export const CREAM_TARGET_THICKNESS: Record<CreamAmount, number> = {
  light: 0.6,
  normal: 1,
  heavy: 1.5,
};

export const CREAM_AMOUNT_LABEL: Record<CreamAmount, string> = {
  light: '조금',
  normal: '보통',
  heavy: '듬뿍',
};

const BRUSH_RADIUS_CELLS = 1.6; // 짤주머니 한 번에 크림이 퍼지는 반경(칸)
const COVERED_RATIO = 0.35; // 목표 두께의 이 비율 이상이면 "덮였다"고 본다

export const createEmptyFrosting = (): number[] => Array.from({ length: FROSTING_CELL_COUNT }, () => 0);

// ---- 옆면 크림 (회전판) ----
// 옆면은 둘레를 SIDE_SEGMENTS 조각으로 나눈다. 누르고 있는 동안 회전판이 일정 속도로 돌고, 정면에 온 조각에 크림이 쌓인다.
// 딱 한 바퀴 돌리면 "보통" 양이 고르게 발리도록 속도를 맞췄다 — 반 바퀴에서 멈추면 한쪽만 발린다.
export const SIDE_SEGMENTS = 24;
export const TURNTABLE_SEC_PER_TURN = 3.5;
const SIDE_UNITS_PER_THICKNESS = (CREAM_FLOW_PER_SEC * TURNTABLE_SEC_PER_TURN) / SIDE_SEGMENTS; // 조각당, 두께 1 기준

export const createEmptySide = (): number[] => Array.from({ length: SIDE_SEGMENTS }, () => 0);

// rotationDeg만큼 돌아간 케이크에서 정면(보는 사람 쪽)에 있는 조각 번호
export function getFrontSegment(rotationDeg: number): number {
  const angle = (((-rotationDeg % 360) + 360) % 360) / (360 / SIDE_SEGMENTS);
  return Math.round(angle) % SIDE_SEGMENTS;
}

export function depositSide(side: number[], rotationDeg: number, units: number): number[] {
  const front = getFrontSegment(rotationDeg);
  const next = [...side];
  // 스패출러 폭만큼 양옆 조각에도 조금 묻는다
  next[front] += units * 0.6;
  next[(front + 1) % SIDE_SEGMENTS] += units * 0.2;
  next[(front + SIDE_SEGMENTS - 1) % SIDE_SEGMENTS] += units * 0.2;
  return next;
}

// 옆면 두께를 "칸 두께" 단위로 환산 (렌더링용: 1이면 목표 보통 두께)
export const sideThickness = (units: number) => units / SIDE_UNITS_PER_THICKNESS;

export const getSideTargetTotal = (thickness: number) => thickness * SIDE_UNITS_PER_THICKNESS * SIDE_SEGMENTS;

export const createEmptySpreadLayer = (withSide = false): SpreadLayer => ({
  materialId: null,
  cells: createEmptyFrosting(),
  side: withSide ? createEmptySide() : [],
  done: false,
  coverage: 0,
  evenness: 0,
  amount: 0,
});

const cellCenter = (index: number) => ({
  x: ((index % FROSTING_GRID) + 0.5) / FROSTING_GRID,
  y: (Math.floor(index / FROSTING_GRID) + 0.5) / FROSTING_GRID,
});

export const ON_CAKE_CELLS: number[] = Array.from({ length: FROSTING_CELL_COUNT }, (_, index) => index).filter(
  (index) => {
    const { x, y } = cellCenter(index);
    return (x - 0.5) ** 2 + (y - 0.5) ** 2 <= CAKE_RADIUS ** 2;
  },
);

const ON_CAKE_SET = new Set(ON_CAKE_CELLS);

export const getSpreadTargetTotal = (thickness: number) => thickness * ON_CAKE_CELLS.length;

export const getCreamTotal = (cells: number[]) => ON_CAKE_CELLS.reduce((sum, index) => sum + (cells[index] ?? 0), 0);

// (px, py)는 케이크 영역 대비 0~1 좌표. units만큼의 크림을 주변 칸에 가우시안 분포로 나눠 쌓는다.
// 케이크 밖으로 나간 크림은 버려진다(칸에 쌓이지 않음).
export function depositCream(cells: number[], px: number, py: number, units: number): number[] {
  const centerCol = px * FROSTING_GRID - 0.5;
  const centerRow = py * FROSTING_GRID - 0.5;
  const reach = Math.ceil(BRUSH_RADIUS_CELLS);
  const weights: { index: number; weight: number }[] = [];
  let weightSum = 0;

  for (let row = Math.floor(centerRow) - reach; row <= Math.ceil(centerRow) + reach; row++) {
    for (let col = Math.floor(centerCol) - reach; col <= Math.ceil(centerCol) + reach; col++) {
      const distSq = (row - centerRow) ** 2 + (col - centerCol) ** 2;
      if (distSq > BRUSH_RADIUS_CELLS ** 2) continue;
      const weight = Math.exp(-distSq / (BRUSH_RADIUS_CELLS * 0.8));
      weightSum += weight;
      if (row < 0 || row >= FROSTING_GRID || col < 0 || col >= FROSTING_GRID) continue;
      weights.push({ index: row * FROSTING_GRID + col, weight });
    }
  }

  if (weightSum === 0) return cells;
  const next = [...cells];
  for (const { index, weight } of weights) {
    if (!ON_CAKE_SET.has(index)) continue;
    next[index] += (units * weight) / weightSum;
  }
  spreadOverflow(next);
  return next;
}

// 한 칸에 쌓일 수 있는 두께. 이보다 두꺼워지면 넘친 크림이 더 얇은 옆 칸으로 흘러 퍼진다.
// 한 자리에 계속 짜면 두께만 늘고 모양은 그대로여서 "짜는데 화면이 안 변하는" 문제가 있었다 —
// 이제는 짜는 동안 웅덩이가 점점 넓어지는 게 보인다.
const MAX_STACK = 1.8;
const SPREAD_PASSES = 4;

const NEIGHBORS: number[][] = Array.from({ length: FROSTING_CELL_COUNT }, (_, index) => {
  const row = Math.floor(index / FROSTING_GRID);
  const col = index % FROSTING_GRID;
  return [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ]
    .filter(([r, c]) => r >= 0 && r < FROSTING_GRID && c >= 0 && c < FROSTING_GRID)
    .map(([r, c]) => r * FROSTING_GRID + c)
    .filter((neighbor) => ON_CAKE_SET.has(neighbor));
});

function spreadOverflow(cells: number[]) {
  for (let pass = 0; pass < SPREAD_PASSES; pass++) {
    let moved = false;
    for (const index of ON_CAKE_CELLS) {
      const excess = cells[index] - MAX_STACK;
      if (excess <= 0.001) continue;
      const lower = NEIGHBORS[index].filter((neighbor) => cells[neighbor] < cells[index]);
      if (lower.length === 0) continue; // 주변이 다 차 있으면 그대로 두껍게 남는다
      const share = excess / lower.length;
      for (const neighbor of lower) {
        const flow = Math.min(share, (cells[index] - cells[neighbor]) / 2);
        cells[index] -= flow;
        cells[neighbor] += flow;
      }
      moved = true;
    }
    if (!moved) break;
  }
}

export type FrostingScore = { coverage: number; evenness: number; amount: number };

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

// 겉 크림 채점: 윗면과 옆면을 각각 범위/균일도로 보고 평균, 양은 윗면+옆면 합계를 목표 합계와 비교한다
export function scoreFrostingLayer(cells: number[], side: number[], thickness: number): FrostingScore {
  const top = scoreSpread(cells, thickness);
  const sideValues = side.map(sideThickness);
  const sideTotal = side.reduce((sum, value) => sum + value, 0);
  const sideCoverage =
    (sideValues.filter((value) => value >= thickness * COVERED_RATIO).length / SIDE_SEGMENTS) * 100;
  const sideMean = sideValues.reduce((sum, value) => sum + value, 0) / SIDE_SEGMENTS;
  const sideDeviation = sideValues.reduce((sum, value) => sum + Math.abs(value - sideMean), 0) / SIDE_SEGMENTS;
  const sideEvenness = sideMean > 0 ? (1 - (sideDeviation / sideMean) * 1.2) * 100 : 0;
  return {
    coverage: clampScore((top.coverage + sideCoverage) / 2),
    evenness: clampScore((top.evenness + sideEvenness) / 2),
    amount: scoreAmountMatch(
      getCreamTotal(cells) + sideTotal,
      getSpreadTargetTotal(thickness) + getSideTargetTotal(thickness),
    ),
  };
}

// thickness: 칸당 목표 두께 (크림은 CREAM_TARGET_THICKNESS[주문량], 필링은 FILLING_TARGET_THICKNESS)
export function scoreSpread(cells: number[], thickness: number): FrostingScore {
  const target = thickness;
  const values = ON_CAKE_CELLS.map((index) => cells[index] ?? 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total === 0) return { coverage: 0, evenness: 0, amount: 0 };

  // 범위: 목표 두께의 일정 비율 이상 덮인 칸의 비율
  const coverage = (values.filter((value) => value >= target * COVERED_RATIO).length / values.length) * 100;

  // 균일도: 칸 두께가 평균에서 얼마나 벗어나는지 (평균 절대 편차 / 평균)
  const mean = total / values.length;
  const meanDeviation = values.reduce((sum, value) => sum + Math.abs(value - mean), 0) / values.length;
  const evenness = (1 - (meanDeviation / mean) * 1.2) * 100;

  return {
    coverage: clampScore(coverage),
    evenness: clampScore(evenness),
    amount: scoreAmountMatch(total, target * values.length),
  };
}
