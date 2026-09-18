"use client";

import { useState } from "react";
import { createInitialGameState } from "@/lib/gameState";
import { HUD } from "@/components/game/HUD";
import { PlayerSide } from "./PlayerSide";
import { CustomerSide } from "./CustomerSide";

export function ShopScreen() {
  // 임시 로컬 상태. 실제 게임 상태 관리(hooks/useGameState)는 다음 단계에서 연결한다.
  const [state] = useState(createInitialGameState);

  return (
    <div className="game-root h-dvh w-dvw flex-col overflow-hidden">
      <HUD day={state.player.day} money={state.player.money} />
      <div className="relative flex flex-1 min-h-0">
        <PlayerSide />
        <div
          aria-hidden
          className="w-px shrink-0 bg-[var(--theme-accent)]/50 shadow-[0_0_12px_var(--theme-accent)]"
        />
        <CustomerSide tables={state.tables} />
      </div>
    </div>
  );
}
