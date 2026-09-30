import { BASE_CUSTOMERS_PER_DAY, type Material, type Player } from './gameState';
import { OVEN_DURATION_MS } from './gameLogic';

// 성장 시스템 (cake-tycoon-prompt.md 13장, 사용자 결정):
// - 케이크를 서빙할 때마다 점수(0~100)만큼 경험치가 쌓이고, 다 차면 랭크가 오른다
// - 랭크는 하루에 한 번만 오른다 (사용자 결정). 그날 이미 올랐으면 경험치는 막대가 꽉 찰 때까지만 쌓이고 다음 날 첫 서빙에 오른다
// - 랭크가 오르면 상점에 새 재료가 진열되고, 돈을 내고 사야 선반에 올라간다 (처음엔 카테고리별 1개, 토핑만 2개)
// - 커스텀 재료 만들기는 CUSTOM_MATERIAL_RANK부터
// - 장비(오븐 속도, 오븐 칸)는 랭크와 무관하게 언제든 돈으로 산다
// 숫자는 전부 임시값 — 실제 플레이하며 조정한다.

// rank → rank+1 에 필요한 경험치. 하루 6명 × 평균 80점 ≈ 480이라 초반엔 하루에 한 랭크, 랭크 3부터는 이틀쯤
export const expToNextRank = (rank: number) => 300 + 150 * (rank - 1);

// 경험치를 더하고 오른 랭크를 돌려준다. canRankUp이 false(오늘 이미 오름)면 랭크는 그대로 두고
// 경험치는 막대가 꽉 찰 때까지만 쌓는다 → 다음 날 첫 서빙에 바로 오른다. 넘친 경험치는 버린다
export function addExp(player: Player, gained: number, canRankUp: boolean): { player: Player; reachedRanks: number[] } {
  let { rank, exp } = player;
  exp += gained;
  const reachedRanks: number[] = [];
  if (canRankUp && exp >= expToNextRank(rank)) {
    exp -= expToNextRank(rank);
    rank += 1;
    reachedRanks.push(rank);
  }
  exp = Math.min(exp, expToNextRank(rank));
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
export type UpgradeId = 'ovenSpeed' | 'ovenSlots' | 'pipingBag' | 'penSet' | 'flyer';

type UpgradeLevel = { price: number; label: string }; // label: 이 단계를 사면 어떻게 되는지
export type UpgradeInfo = { id: UpgradeId; emoji: string; name: string; base: string; levels: UpgradeLevel[]; note?: string };

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
  {
    id: 'pipingBag',
    emoji: '🍦',
    name: '큰 짤주머니',
    base: '필링·크림 보통 속도',
    levels: [
      { price: 120, label: '1.3배 빨리 나와요' },
      { price: 250, label: '1.6배 빨리 나와요' },
    ],
  },
  {
    id: 'penSet',
    emoji: '🖍️',
    name: '데코 펜 세트',
    base: '펜 색 5가지',
    levels: [{ price: 80, label: '펜 색 10가지' }],
  },
  {
    id: 'flyer',
    emoji: '📰',
    name: '홍보 전단지',
    base: `하루 손님 ${BASE_CUSTOMERS_PER_DAY}명`,
    levels: [
      { price: 80, label: '하루 손님 8명' },
      { price: 180, label: '하루 손님 10명' },
      { price: 320, label: '하루 손님 12명' },
    ],
    note: '다음 날부터 적용',
  },
];

// 홍보 전단지: 하루에 오는 손님 수 (손님이 많을수록 돈·경험치를 더 벌지만 하루가 길어진다)
const CUSTOMERS_PER_DAY_BY_FLYER = [BASE_CUSTOMERS_PER_DAY, 8, 10, 12];
export const getCustomersPerDay = (player: Player) =>
  CUSTOMERS_PER_DAY_BY_FLYER[Math.min(upgradeLevel(player, 'flyer'), CUSTOMERS_PER_DAY_BY_FLYER.length - 1)];

const OVEN_DURATIONS_MS = [OVEN_DURATION_MS, 42_000, 35_000, 28_000];

export const upgradeLevel = (player: Player, id: UpgradeId) => player.upgrades[id] ?? 0;
export const getOvenDuration = (player: Player) =>
  OVEN_DURATIONS_MS[Math.min(upgradeLevel(player, 'ovenSpeed'), OVEN_DURATIONS_MS.length - 1)];
export const getOvenSlotCount = (player: Player) => 2 + upgradeLevel(player, 'ovenSlots');

// 큰 짤주머니: 필링·크림이 나오는 속도(회전판 속도도 같이 빨라져서 한 바퀴 = 보통 양은 그대로)
const PIPING_SPEEDS = [1, 1.3, 1.6];
export const getPipingSpeed = (player: Player) =>
  PIPING_SPEEDS[Math.min(upgradeLevel(player, 'pipingBag'), PIPING_SPEEDS.length - 1)];

// 데코 펜 색: 기본 5가지, 펜 세트를 사면 5가지 더
const BASE_PEN_COLORS = ['#ff7f66', '#f2a0d8', '#7ec8e3', '#8bd17c', '#4a3733'];
const EXTRA_PEN_COLORS = ['#ffd166', '#b39ddb', '#ffffff', '#ff4d6d', '#3fa7a0'];
export const getPenColors = (player: Player) =>
  upgradeLevel(player, 'penSet') > 0 ? [...BASE_PEN_COLORS, ...EXTRA_PEN_COLORS] : BASE_PEN_COLORS;

// ── 가게 장식 (한 번 사면 매장에 계속 놓인다. 게임 효과는 없고 꾸미는 재미용) ──
// 산 장식 id는 재료처럼 player.unlockedItems에 넣는다 ("decor_" 접두사)
export type DecorItem = { id: string; emoji: string; name: string; price: number; place: string };
export const DECOR_ITEMS: DecorItem[] = [
  { id: 'decor_tulip', emoji: '🌷', name: '튤립 화분', price: 60, place: '홀 왼쪽 바닥' },
  { id: 'decor_frame', emoji: '🖼️', name: '케이크 액자', price: 90, place: '홀 벽' },
  { id: 'decor_clock', emoji: '🕰️', name: '벽시계', price: 90, place: '홀 벽' },
  { id: 'decor_bear', emoji: '🧸', name: '곰 인형', price: 110, place: '창틀' },
  { id: 'decor_balloons', emoji: '🎈', name: '풍선', price: 130, place: '홀 오른쪽' },
  { id: 'decor_lights', emoji: '💡', name: '전구 줄', price: 180, place: '홀 천장' },
];
export const hasDecor = (owned: readonly string[], id: string) => owned.includes(id);
