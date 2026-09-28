"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import { ShopScreen } from "@/components/shop/ShopScreen";
import { StationScreen } from "./StationScreen";
import { StationNav } from "./StationNav";
import { TopBar } from "./TopBar";
import { OrderClipRail } from "./OrderClipRail";

// 매장과 모든 제작 스테이션이 같은 게임 상태를 공유해야 해서, useGameState는 이 최상위 컴포넌트에서만 호출한다.
// 오른쪽 위 주문서 집게 레일과 하단 스테이션 탭은 어느 화면에서든 항상 보인다 (Papa's 방식).
export function GameRoot() {
  const gameState = useGameState();
  const { state } = gameState;
  const { station } = state;
  const [openBillId, setOpenBillId] = useState<string | null>(null);

  // 빌지를 누르면 주문서를 펼치고, 다시 누르면 접는다 (케이크는 주문과 묶여 있지 않아서 작업 대상 선택과는 무관)
  const handleBillTap = (customerId: string) => setOpenBillId((prev) => (prev === customerId ? null : customerId));

  return (
    <div className="game-root h-dvh w-dvw flex-col overflow-hidden bg-[var(--theme-background)]">
      <TopBar day={state.player.day} money={state.player.money} />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {station === "order" ? (
          <ShopScreen gameState={gameState} />
        ) : (
          <StationScreen gameState={gameState} station={station} />
        )}
        <OrderClipRail
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
