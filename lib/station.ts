import type { ActiveOrder, CraftingStage, GameState, Station, WorkStation } from './gameState';

// 하단 스테이션 탭 순서/표시 정보 (Papa's 시리즈의 Order/Build/Bake/Top 스테이션 구조 참고)
export const STATIONS: { station: Station; emoji: string; label: string }[] = [
  { station: 'order', emoji: '🧾', label: '주문' },
  { station: 'base', emoji: '🥣', label: '시트' },
  { station: 'oven', emoji: '🔥', label: '오븐' },
  { station: 'cream', emoji: '🍦', label: '필링·크림' },
  { station: 'decorate', emoji: '🎨', label: '토핑·데코' },
];

// 주문은 손님 이름 대신 번호로 부른다 ("#1"). 번호는 하루마다 1부터 다시 센다.
export const formatOrderNumber = (order: Pick<ActiveOrder, 'orderNumber'>) => `#${order.orderNumber}`;

// 매장 화면 손님 머리 위에 "지금 케이크가 어디쯤인지" 보여줄 때 쓰는 라벨
export const STAGE_STATUS_LABEL: Record<CraftingStage, string> = {
  base: '🥣 시트',
  oven: '🔥 오븐',
  cream: '🍦 필링·크림',
  decorate: '🎨 토핑·데코',
  ready: '🎂 서빙 대기',
};

// 해당 단계에 와 있는 주문들 (먼저 주문받은 순서)
export function getOrdersAtStage(state: GameState, stage: CraftingStage): ActiveOrder[] {
  return state.activeOrders.filter((order) => order.stage === stage).sort((a, b) => a.createdAt - b.createdAt);
}

// 스테이션에서 지금 작업할 주문. 고른 주문이 이미 다음 스테이션으로 넘어갔으면 대기열의 첫 주문을 보여준다.
export function getSelectedOrder(state: GameState, station: WorkStation): ActiveOrder | null {
  const orders = getOrdersAtStage(state, station);
  return orders.find((order) => order.orderId === state.selectedOrderIds[station]) ?? orders[0] ?? null;
}

// 오븐 대기 트레이: 오븐 단계로 넘어왔지만 아직 오븐 칸에 들어가지 않은 케이크
export function getOvenQueue(state: GameState): ActiveOrder[] {
  return getOrdersAtStage(state, 'oven').filter((order) => order.cake.baking.startTime === null);
}
