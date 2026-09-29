"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import { ShopScreen } from "@/components/shop/ShopScreen";
import { StationScreen } from "./StationScreen";
import { StationNav } from "./StationNav";
import { TopBar } from "./TopBar";
import { OrderClipRail } from "./OrderClipRail";
import { CustomImagesProvider } from "./CustomImages";
import { DecorSettings } from "./DecorSettings";
import { DayEndCard } from "./DayEndCard";
import { ShopMenu } from "./ShopMenu";
import { RankUpCard } from "./RankUpCard";

// 매장과 모든 제작 스테이션이 같은 게임 상태를 공유해야 해서, useGameState는 이 최상위 컴포넌트에서만 호출한다.
// 오른쪽 위 주문서 집게 레일과 하단 스테이션 탭은 어느 화면에서든 항상 보인다 (Papa's 방식).
export function GameRoot() {
  const gameState = useGameState();
  const { state } = gameState;
  const { station } = state;
  const [openBillId, setOpenBillId] = useState<string | null>(null);
  const [isDecorOpen, setIsDecorOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);

  // 빌지를 누르면 주문서를 펼치고, 다시 누르면 접는다 (케이크는 주문과 묶여 있지 않아서 작업 대상 선택과는 무관)
  const handleBillTap = (customerId: string) => setOpenBillId((prev) => (prev === customerId ? null : customerId));

  return (
    <CustomImagesProvider>
      <div className="game-root relative h-dvh w-dvw flex-col overflow-hidden bg-[var(--theme-background)]">
        <TopBar
          day={state.player.day}
          servedToday={state.today.served}
          player={state.player}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenDecor={() => setIsDecorOpen(true)}
        />
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
        {isDecorOpen && (
          <DecorSettings
            rank={state.player.rank}
            onClose={() => setIsDecorOpen(false)}
            onResetProgress={gameState.resetProgress}
          />
        )}
        {/* 결과 카드 → 랭크업 카드 → (마지막 손님이면) 결산 순서로 뜬다 */}
        {gameState.rankUps.length > 0 && !gameState.serveResult && (
          <RankUpCard
            ranks={gameState.rankUps}
            onClose={gameState.dismissRankUp}
            onOpenShop={() => {
              gameState.dismissRankUp();
              setIsShopOpen(true);
            }}
          />
        )}
        {gameState.isDayOver && !gameState.serveResult && gameState.rankUps.length === 0 && (
          <DayEndCard
            day={state.player.day}
            today={state.today}
            onNextDay={gameState.startNextDay}
            onOpenShop={() => setIsShopOpen(true)}
          />
        )}
        {/* 결산 카드 위에서도 열 수 있게 맨 뒤에 둔다 */}
        {isShopOpen && (
          <ShopMenu
            player={state.player}
            onBuyMaterial={gameState.buyMaterial}
            onBuyUpgrade={gameState.buyUpgrade}
            onClose={() => setIsShopOpen(false)}
          />
        )}
      </div>
    </CustomImagesProvider>
  );
}
