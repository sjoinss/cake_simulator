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
  isCustom: boolean;
  unlockRank: number; // 이 랭크에 도달하면 자동 해금. 0 = 처음부터 사용 가능
};

// 재료 레지스트리: 카테고리별 배열이 아니라 하나의 객체로 묶어서,
// "커스텀 재료 추가"가 카테고리 무관하게 동일한 로직(레지스트리에 push)으로 처리되도록 한다.
export type MaterialRegistry = Record<MaterialCategory, Material[]>;

export type CustomerStatus = 'waiting' | 'ordering' | 'order_confirmed' | 'served';

export type Customer = {
  id: string;
  name: string;
  tableIndex: number;
  patience: number; // 0~100
  basePatienceMultiplier: number; // 손님별 성격 배율. Phase 1은 1.0 고정
  status: CustomerStatus;
  starCount: number; // 단골 시스템용 누적 별점 (Phase 3)
  favoriteMaterialIds?: string[]; // 취향 매칭 보너스용 (Phase 3)
  order: {
    cake: string;
    frosting: string;
    topping: string;
    decoration?: string;
    message?: string;
  };
};

export type CraftingStage = 'base' | 'oven' | 'frosting' | 'topping' | 'decoration' | 'ready';

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
  createdAt: number; // 제작 시작 시각(ms). 결과 화면 "속도" 점수 계산용
  completedAt: number | null; // 데코레이션 "완성"을 누른 시각. 완성 전엔 null
  cake: {
    base: string | null;
    baking: {
      startTime: number | null; // 절대 시각(ms). 실시간 오븐 타이머 계산용
      duration: number;
      doneness: number;
    };
    filling: string | null;
    frosting: { coverage: number; evenness: number };
    toppings: CakeTopping[];
    decorations: CakeDecoration[];
    text: CakeText[];
    drawings: CakeDrawing[];
  };
};

export type ThemeName = 'blue' | 'sky' | 'pink' | 'red' | 'yellow' | 'orange' | 'purple';

export type Screen = 'shop' | 'crafting';

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
  screen: Screen;
  openTables: number; // 랭크에 따라 열리는 테이블 개수. Phase 1은 3 고정
  tables: (Customer | null)[]; // 길이 3, 인덱스 = 테이블 번호
  activeOrders: ActiveOrder[]; // 동시에 진행 중인 여러 주문
  craftingOrderId: string | null; // 제작 화면에서 현재 작업 중인 주문
};

export const TABLE_COUNT = 3;

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
    screen: 'shop',
    openTables: TABLE_COUNT,
    tables: Array.from({ length: TABLE_COUNT }, () => null),
    activeOrders: [],
    craftingOrderId: null,
  };
}
