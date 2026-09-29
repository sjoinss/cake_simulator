import { createDayProgress, createInitialGameState, type GameState } from './gameState';
import { expToNextRank, getOvenSlotCount } from './progress';

// 진행 상황 저장 (cake-tycoon-prompt.md 15장): 게임 상태 객체(GameState) 전체를 localStorage에 직렬화한다.
// 그림(주인/손님)과 가게 이름은 따로 저장한다 (lib/imageStore.ts, ShopSign).

const SAVE_KEY = 'cake-tycoon.save';
const SAVE_VERSION = 1;

type SaveFile = { version: number; savedAt: number; state: GameState };

export function saveGame(state: GameState) {
  try {
    const file: SaveFile = { version: SAVE_VERSION, savedAt: Date.now(), state };
    localStorage.setItem(SAVE_KEY, JSON.stringify(file));
  } catch {
    // 저장이 막힌 환경(사생활 보호 모드, 용량 초과)이면 이번 판에서만 진행한다
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // 무시
  }
}

// 저장된 게임을 불러온다. 없거나 깨졌으면 null.
// 새로고침하면 진행 중이던 타이머(주문 말하기, 먹고 나가기)가 사라지므로 그 상태의 손님을 정리한다.
export function loadGame(): GameState | null {
  let file: SaveFile;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    file = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!file || file.version !== SAVE_VERSION || !file.state) return null;

  // 나중에 필드가 늘어나도 빠진 값은 기본값으로 채운다
  const initial = createInitialGameState();
  const saved = file.state;
  const state: GameState = {
    ...initial,
    ...saved,
    player: { ...initial.player, ...saved.player },
    today: { ...createDayProgress(), ...saved.today },
    selectedCakeIds: { ...initial.selectedCakeIds, ...saved.selectedCakeIds },
    station: 'order',
  };

  // 다음 랭크 기준은 숫자를 조정해도 맞도록 매번 다시 계산하고, 오븐 칸 수는 산 업그레이드에 맞춘다
  state.player.rankUpThreshold = expToNextRank(state.player.rank);
  const slotCount = getOvenSlotCount(state.player);
  state.ovenSlots = Array.from({ length: slotCount }, (_, index) => state.ovenSlots[index] ?? null);

  state.tables = (saved.tables ?? initial.tables).map((customer) => {
    if (!customer) return null;
    // 주문을 말하던 중이면 다시 "..." 대기로 (다시 누르면 처음부터 주문을 듣는다)
    if (customer.status === 'ordering') return { ...customer, status: 'waiting' as const };
    // 다 먹고 나가던 손님은 이미 돈을 냈으니 자리를 비운다
    if (customer.status === 'served') return null;
    return customer;
  });

  return state;
}
