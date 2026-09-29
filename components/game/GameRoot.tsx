"use client";

import { useEffect, useState } from "react";
import { sounds, unlockAudio } from "@/lib/sound";
import { addToAlbum } from "@/lib/album";
import { readShopName } from "@/components/shop/ShopSign";
import { AlbumView } from "./album/AlbumView";
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
import { TutorialCoach } from "./TutorialCoach";
import { Toaster } from "./Toaster";

// 매장과 모든 제작 스테이션이 같은 게임 상태를 공유해야 해서, useGameState는 이 최상위 컴포넌트에서만 호출한다.
// 오른쪽 위 주문서 집게 레일과 하단 스테이션 탭은 어느 화면에서든 항상 보인다 (Papa's 방식).
export function GameRoot() {
  const gameState = useGameState();
  const { state } = gameState;
  const { station } = state;
  const [openBillId, setOpenBillId] = useState<string | null>(null);
  const [isDecorOpen, setIsDecorOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);

  // 브라우저는 사용자가 한 번 누르기 전엔 소리를 막는다: 첫 입력 때 오디오를 깨우고 배경음악을 시작한다
  useEffect(() => {
    const events = ["pointerdown", "click", "keydown"] as const;
    const unlock = () => {
      unlockAudio();
      events.forEach((type) => window.removeEventListener(type, unlock, { capture: true }));
    };
    events.forEach((type) => window.addEventListener(type, unlock, { capture: true }));
    return () => events.forEach((type) => window.removeEventListener(type, unlock, { capture: true }));
  }, []);

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
          onOpenAlbum={() => setIsAlbumOpen(true)}
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
        {/* 첫 플레이 안내: 게임 전체 위에 뜬다. 결과 카드·랭크업·상점 같은 창이 떠 있으면 잠깐 숨는다 */}
        {/* 단계 피드백 쪽지 (반죽·굽기·필링·크림을 마칠 때) */}
        <Toaster />
        <TutorialCoach
          state={state}
          paused={
            !!gameState.serveResult ||
            gameState.rankUps.length > 0 ||
            gameState.isDayOver ||
            isShopOpen ||
            isDecorOpen ||
            isAlbumOpen
          }
          onFinish={gameState.finishTutorial}
        />
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
            onNextDay={(picks) => {
              // 고른 케이크를 앨범에 담고 다음 날로 (저장 공간이 없으면 넘어가지 않는다)
              if (!addToAlbum(picks, readShopName())) return false;
              if (picks.length > 0) sounds.sparkle();
              gameState.startNextDay();
              return true;
            }}
            onOpenShop={() => setIsShopOpen(true)}
          />
        )}
        {isAlbumOpen && <AlbumView onClose={() => setIsAlbumOpen(false)} />}
        {/* 결산 카드 위에서도 열 수 있게 맨 뒤에 둔다 */}
        {isShopOpen && (
          <ShopMenu
            player={state.player}
            onBuyMaterial={gameState.buyMaterial}
            onBuyUpgrade={gameState.buyUpgrade}
            onBuyDecor={gameState.buyDecor}
            onClose={() => setIsShopOpen(false)}
          />
        )}
      </div>
    </CustomImagesProvider>
  );
}
