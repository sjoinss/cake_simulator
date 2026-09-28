import type { CakeData, CakeJob, GameState } from "./gameState";
import { MAX_KITCHEN_CAKES } from "./gameState";
import { createEmptySpreadLayer } from "./frosting";
import { OVEN_DURATION_MS } from "./gameLogic";

// 아무것도 안 한 빈 케이크
export function createEmptyCake(): CakeData {
  return {
    base: null,
    batter: { amount: 0, score: 0 },
    baking: { startTime: null, endTime: null, duration: OVEN_DURATION_MS, doneness: 0 },
    filling: createEmptySpreadLayer(),
    frosting: createEmptySpreadLayer(true),
    toppingsDone: false,
    toppings: [],
    decorations: [],
    text: [],
    drawings: [],
  };
}

let nextJobSeq = 0;

// 시트 스테이션에 새 빈 틀을 놓는다 (주문과 상관없이 — 미리 만들어 둘 수 있다)
export function createCakeJob(): CakeJob {
  nextJobSeq += 1;
  return {
    jobId: `cake_${Date.now()}_${nextJobSeq}`,
    stage: "base",
    startedAt: Date.now(),
    completedAt: null,
    cake: createEmptyCake(),
  };
}

// 시트 스테이션에는 항상 빈 틀이 하나 놓여 있게 한다. 주방 케이크 수가 상한이면 더 놓지 않는다.
export function withBaseCake(state: GameState): GameState {
  if (state.cakes.some((job) => job.stage === "base")) return state;
  if (state.cakes.length >= MAX_KITCHEN_CAKES) return state;
  return { ...state, cakes: [...state.cakes, createCakeJob()] };
}

// 작업대 자리채움용 (케이크가 없는 스테이션을 "세팅만 된 상태"로 그릴 때, 조작은 막는다)
export function createPlaceholderJob(): CakeJob {
  return { jobId: "placeholder", stage: "base", startedAt: 0, completedAt: null, cake: createEmptyCake() };
}
