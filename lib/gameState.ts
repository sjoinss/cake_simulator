// 케이크 타이쿤 게임 전체 상태 타입 정의
// 기준 문서: cake-tycoon-prompt.md 16장
// Phase 1에서 실제로 쓰이지 않는 필드도 있지만, 나중 확장을 위해 지금부터 데이터 구조에 넣어둔다.

export type MaterialCategory = 'base' | 'cream' | 'filling' | 'topping' | 'decoration';

export type Material = {
  id: string;
  category: MaterialCategory;
  name: string;
  color: string;
  emoji: string;
  image?: string; // 재료 그림 경로 (예: /images/materials/filling_strawberry.png). 없으면 CSS 병/그릇 + 이모지로 그린다
  isCustom: boolean;
  unlockRank: number; // 이 랭크에 도달하면 자동 해금. 0 = 처음부터 사용 가능
};

// 재료 레지스트리: 카테고리별 배열이 아니라 하나의 객체로 묶어서,
// "커스텀 재료 추가"가 카테고리 무관하게 동일한 로직(레지스트리에 push)으로 처리되도록 한다.
export type MaterialRegistry = Record<MaterialCategory, Material[]>;

export type CreamAmount = 'light' | 'normal' | 'heavy';

export type CustomerStatus = 'waiting' | 'ordering' | 'order_confirmed' | 'served';

export type Customer = {
  id: string;
  name: string;
  tableIndex: number;
  patience: number; // 0~100
  basePatienceMultiplier: number; // 손님별 성격 배율. Phase 1은 1.0 고정
  status: CustomerStatus;
  orderNumber: number | null; // 주문 확정 때 받은 번호. 손님 머리 위에 떠나갈 때까지 계속 띄운다
  starCount: number; // 단골 시스템용 누적 별점 (Phase 3)
  favoriteMaterialIds?: string[]; // 취향 매칭 보너스용 (Phase 3)
  order: {
    cake: string;
    filling: string; // 시트를 반으로 갈라 안에 넣는 잼/크림
    frosting: string;
    creamAmount: CreamAmount; // 크림을 얼마나 두껍게 발라달라는지 (크림 게이지의 목표선)
    topping: string;
    decoration?: string;
    message?: string;
  };
};

// 주문(케이크)이 지금 어느 스테이션에 있는지. 케이크는 이 순서대로만 앞으로 넘어간다 (1장 2번).
// 한 스테이션 안에 두 단계가 있는 곳은 탭으로 나누고, 앞 탭을 마쳐야 뒤 탭이 열린다
// (cream: 필링 → 크림, decorate: 토핑 → 데코).
export type CraftingStage = 'base' | 'oven' | 'cream' | 'decorate' | 'ready';

// 플레이어가 보고 있는 스테이션. 하단 탭으로 언제든 자유롭게 오간다 (Papa's 방식, 3장 "여러 주문 동시 진행").
export type Station = 'order' | 'base' | 'oven' | 'cream' | 'decorate';

// 여러 주문 중 하나를 골라서 작업하는 스테이션 (오븐은 칸 단위로 다루므로 제외)
export type WorkStation = 'base' | 'cream' | 'decorate';

// 짤주머니로 짜서 바르는 층 (필링, 겉 크림). 칸별 두께 그리드로 저장하고 렌더러가 이걸 보고 다시 그린다 (lib/frosting.ts)
export type SpreadLayer = {
  materialId: string | null; // 고른 재료. 짜기 시작하면 고정되고, "다시 바르기"로 비워야 바꿀 수 있다
  cells: number[]; // 윗면 칸별 두께
  side: number[]; // 옆면(둘레 조각별) 두께. 겉 크림만 쓰고 필링은 빈 배열
  done: boolean; // 완료를 눌렀는지. 되돌릴 수 없고, 다음 탭이 열린다
  coverage: number;
  evenness: number;
  amount: number; // 목표량과 얼마나 맞는지 0~100
};

export type CakeText = {
  content: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  font: string;
};

export type CakeDrawing = {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  brushType?: string; // Phase 1 미사용, 나중 브러시 종류 확장용
};

export type CakeTopping = {
  itemId: string;
  x: number;
  y: number;
};

export type CakeDecoration = {
  type: string;
  x: number;
  y: number;
  [key: string]: unknown;
};

export type ActiveOrder = {
  orderId: string;
  customerId: string; // Customer.id 참조
  stage: CraftingStage;
  orderNumber: number; // 화면에 "#1"처럼 보이는 주문 번호. 하루마다 1부터 다시 센다
  attempt: number; // 케이크를 버리고 다시 만든 횟수 (0부터)
  createdAt: number; // 제작 시작 시각(ms). 결과 화면 "속도" 점수 계산용
  completedAt: number | null; // 데코레이션 "완성"을 누른 시각. 완성 전엔 null
  cake: {
    base: string | null;
    batter: { amount: number; score: number }; // 틀에 부은 반죽 양과 적정량 대비 점수
    baking: {
      startTime: number | null; // 절대 시각(ms). 실시간 오븐 타이머 계산용
      endTime: number | null; // 오븐에서 꺼낸 시각. 구운 정도(색) 표시용
      duration: number;
      doneness: number;
    };
    filling: SpreadLayer;
    frosting: SpreadLayer;
    toppingsDone: boolean; // "토핑 완료"를 눌러야 데코 탭이 열린다
    toppings: CakeTopping[];
    decorations: CakeDecoration[];
    text: CakeText[];
    drawings: CakeDrawing[];
  };
};

export type ThemeName = 'blue' | 'sky' | 'pink' | 'red' | 'yellow' | 'orange' | 'purple';

export type Player = {
  name: string;
  money: number;
  day: number;
  rank: number; // 재료/손님/난이도 해금 축. Phase 1은 1 고정
  tipTotal: number; // 누적 Tip (랭크업 경험치). Phase 1은 누적만 하고 랭크업 로직 미구현
  rankUpThreshold: number;
  unlockedItems: string[];
  upgrades: Record<string, number>;
};

export type GameState = {
  player: Player;
  theme: ThemeName;
  station: Station;
  openTables: number; // 랭크에 따라 열리는 테이블 개수. Phase 1은 3 고정
  tables: (Customer | null)[]; // 길이 3, 인덱스 = 테이블 번호
  activeOrders: ActiveOrder[]; // 동시에 진행 중인 여러 주문
  selectedOrderIds: Record<WorkStation, string | null>; // 스테이션별로 지금 작업 중인 주문
  ovenSlots: (string | null)[]; // 오븐 칸마다 들어 있는 주문 id
  nextOrderNumber: number; // 다음 주문에 붙일 번호. 하루가 시작될 때 1로 리셋한다 (DAY 진행은 아직 미구현)
};

export const TABLE_COUNT = 3;
export const OVEN_SLOT_COUNT = 2;

export function createInitialGameState(): GameState {
  return {
    player: {
      name: '플레이어',
      money: 0,
      day: 1,
      rank: 1,
      tipTotal: 0,
      rankUpThreshold: 100,
      unlockedItems: [],
      upgrades: {},
    },
    theme: 'pink',
    station: 'order',
    openTables: TABLE_COUNT,
    tables: Array.from({ length: TABLE_COUNT }, () => null),
    activeOrders: [],
    selectedOrderIds: { base: null, cream: null, decorate: null },
    ovenSlots: Array.from({ length: OVEN_SLOT_COUNT }, () => null),
    nextOrderNumber: 1,
  };
}
