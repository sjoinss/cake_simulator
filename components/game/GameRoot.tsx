"use client";

import { useGameState } from "@/hooks/useGameState";
import { ShopScreen } from "@/components/shop/ShopScreen";
import { CraftingScreen } from "./CraftingScreen";

// 매장 화면과 제작 화면이 같은 게임 상태를 공유해야 해서, useGameState는 이 최상위 컴포넌트에서만 호출한다.
export function GameRoot() {
  const gameState = useGameState();

  if (gameState.state.screen === "crafting") {
    return <CraftingScreen gameState={gameState} />;
  }

  return <ShopScreen gameState={gameState} />;
}
