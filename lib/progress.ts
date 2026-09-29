import type { Material, Player } from './gameState';
import { OVEN_DURATION_MS } from './gameLogic';

// 성장 시스템 (cake-tycoon-prompt.md 13장, 사용자 결정):
// - 케이크를 서빙할 때마다 점수(0~100)만큼 경험치가 쌓이고, 다 차면 랭크가 오른다
// - 랭크가 오르면 상점에 새 재료가 진열되고, 돈을 내고 사야 선반에 올라간다 (처음엔 카테고리별 1개씩)
// - 커스텀 재료 만들기는 CUSTOM_MATERIAL_RANK부터
// - 장비(오븐 속도, 오븐 칸)는 랭크와 무관하게 언제든 돈으로 산다
// 숫자는 전부 임시값 — 실제 플레이하며 조정한다.

// rank → rank+1 에 필요한 경험치. 평균 80점이면 첫날 랭크 2, 둘째 날 랭크 3 정도
export const expToNextRank = (rank: number) => 300 + 150 * (rank - 1);

// 경험치를 더하고 오른 랭크들을 돌려준다 (한 번에 여러 랭크가 오를 수도 있다)
export function addExp(player: Player, gained: number): { player: Player; reachedRanks: number[] } {
  let { rank, exp } = player;
  exp += gained;
  const reachedRanks: number[] = [];
  while (exp >= expToNextRank(rank)) {
    exp -= expToNextRank(rank);
    rank += 1;
    reachedRanks.push(rank);
  }
  return { player: { ...player, rank, exp, rankUpThreshold: expToNextRank(rank) }, reachedRanks };
}

// 이 랭크부터 "가게 꾸미기 → 재료" 탭에서 나만의 재료를 만들 수 있다
export const CUSTOM_MATERIAL_RANK = 5;

// 처음부터 가진 재료(unlockRank 0)와 커스텀 재료는 사지 않아도 된다. 나머지는 player.unlockedItems에 산 기록이 있어야 한다
export const isMaterialOwned = (material: Material, owned: readonly string[]) =>
  material.isCustom || material.unlockRank === 0 || owned.includes(material.id);

// 상점 가격: 늦게 열리는 재료일수록 비싸다
export const materialPrice = (material: Material) => 30 + 15 * material.unlockRank;

// ── 랭크별 난이도 (13-3) ──
// 테이블은 가운데부터 하나씩 열린다: TABLE_UNLOCK_RANKS[n] = n+1번째로 열리는 테이블(TABLE_OPEN_ORDER[n])의 랭크
export const TABLE_OPEN_ORDER = [1, 0, 2];
export const TABLE_UNLOCK_RANKS = [1, 2, 4];
export const tableUnlockRank = (tableIndex: number) => TABLE_UNLOCK_RANKS[TABLE_OPEN_ORDER.indexOf(tableIndex)] ?? 1;
export const isTableOpen = (rank: number, tableIndex: number) => rank >= tableUnlockRank(tableIndex);

// 이 랭크부터 손님이 토핑 개수까지 주문한다 (TOPPING_COUNT_MIN~MAX개)
export const TOPPING_COUNT_RANK = 3;
export const TOPPING_COUNT_MIN = 3;
export const TOPPING_COUNT_MAX = 5;

// ── 장비 업그레이드 ──
export type UpgradeId = 'ovenSpeed' | 'ovenSlots';

type UpgradeLevel = { price: number; label: string }; // label: 이 단계를 사면 어떻게 되는지
export type UpgradeInfo = { id: UpgradeId; emoji: string; name: string; base: string; levels: UpgradeLevel[] };

// levels[i]는 i+1단계를 살 때의 가격과 효과
export const UPGRADES: UpgradeInfo[] = [
  {
    id: 'ovenSpeed',
    emoji: '🔥',
    name: '오븐 화력',
    base: '굽는 시간 50초',
    levels: [
      { price: 100, label: '굽는 시간 42초' },
      { price: 200, label: '굽는 시간 35초' },
      { price: 350, label: '굽는 시간 28초' },
    ],
  },
  {
    id: 'ovenSlots',
    emoji: '🧱',
    name: '오븐 칸',
    base: '2칸',
    levels: [
      { price: 150, label: '3칸' },
      { price: 300, label: '4칸' },
    ],
  },
];

const OVEN_DURATIONS_MS = [OVEN_DURATION_MS, 42_000, 35_000, 28_000];

export const upgradeLevel = (player: Player, id: UpgradeId) => player.upgrades[id] ?? 0;
export const getOvenDuration = (player: Player) =>
  OVEN_DURATIONS_MS[Math.min(upgradeLevel(player, 'ovenSpeed'), OVEN_DURATIONS_MS.length - 1)];
export const getOvenSlotCount = (player: Player) => 2 + upgradeLevel(player, 'ovenSlots');
