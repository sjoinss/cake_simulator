import type { CakeJob, CraftingStage, GameState, Station, WorkStation } from "./gameState";

// 하단 스테이션 탭 순서/표시 정보 (Papa's 시리즈의 Order/Build/Bake/Top 스테이션 구조 참고)
export const STATIONS: { station: Station; emoji: string; label: string }[] = [
  { station: "order", emoji: "🧾", label: "주문" },
  { station: "base", emoji: "🥣", label: "시트" },
  { station: "oven", emoji: "🔥", label: "오븐" },
  { station: "cream", emoji: "🍦", label: "필링·크림" },
  { station: "decorate", emoji: "🎨", label: "토핑·데코" },
];

// 주문은 손님 이름 대신 번호로 부른다 ("#1"). 번호는 하루마다 1부터 다시 센다.
export const formatOrderNumber = (orderNumber: number) => `#${orderNumber}`;

// 해당 단계에 와 있는 케이크들 (먼저 시작한 순서)
export function getCakesAtStage(state: GameState, stage: CraftingStage): CakeJob[] {
  return state.cakes.filter((job) => job.stage === stage).sort((a, b) => a.startedAt - b.startedAt);
}

// 스테이션에서 지금 작업할 케이크. 고른 케이크가 이미 다음 스테이션으로 넘어갔으면 대기 중인 첫 케이크를 보여준다.
export function getSelectedCake(state: GameState, station: WorkStation): CakeJob | null {
  const jobs = getCakesAtStage(state, station);
  return jobs.find((job) => job.jobId === state.selectedCakeIds[station]) ?? jobs[0] ?? null;
}

// 오븐 대기 줄: 오븐 단계로 넘어왔지만 아직 오븐 칸에 들어가지 않은 케이크
export function getOvenQueue(state: GameState): CakeJob[] {
  return getCakesAtStage(state, "oven").filter((job) => job.cake.baking.startTime === null);
}
