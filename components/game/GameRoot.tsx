"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import type { ActiveOrder, CraftingStage, Station, WorkStation } from "@/lib/gameState";
import { ShopScreen } from "@/components/shop/ShopScreen";
import { StationScreen } from "./StationScreen";
import { StationNav } from "./StationNav";
import { TopBar } from "./TopBar";
import { OrderClipRail } from "./OrderClipRail";

const isWorkStation = (value: CraftingStage | Station): value is WorkStation =>
  value === "base" || value === "cream" || value === "decorate";

// 매장과 모든 제작 스테이션이 같은 게임 상태를 공유해야 해서, useGameState는 이 최상위 컴포넌트에서만 호출한다.
// 오른쪽 위 주문서 집게 레일과 하단 스테이션 탭은 어느 화면에서든 항상 보인다 (Papa's 방식).
export function GameRoot() {
  const gameState = useGameState();
  const { state, selectOrder } = gameState;
  const { station } = state;
  const [openBillId, setOpenBillId] = useState<string | null>(null);

  // 빌지를 누르면 주문서를 펼치고(다시 누르면 접음), 그 케이크가 있는 스테이션의 작업 대상으로도 고른다
  const handleBillTap = (order: ActiveOrder) => {
    setOpenBillId((prev) => (prev === order.orderId ? null : order.orderId));
    if (isWorkStation(order.stage)) selectOrder(order.stage, order.orderId);
  };

  return (
    <div className="game-root h-dvh w-dvw flex-col overflow-hidden bg-[var(--theme-background)]">
      <TopBar day={state.player.day} money={state.player.money} />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {station === "order" ? <ShopScreen gameState={gameState} /> : <StationScreen gameState={gameState} station={station} />}
        <OrderClipRail
          orders={state.activeOrders}
          customers={state.tables}
          openBillId={openBillId}
          onBillTap={handleBillTap}
          onCloseBill={() => setOpenBillId(null)}
        />
      </div>
      <StationNav state={state} onSelect={gameState.setStation} />
    </div>
  );
}
