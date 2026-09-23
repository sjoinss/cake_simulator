import type { useGameState } from "@/hooks/useGameState";
import type { CakeDrawing, CraftingStage } from "@/lib/gameState";
import { OVEN_DURATION_MS, isStageUnlocked } from "@/lib/gameLogic";
import { initialMaterials } from "@/lib/materials";
import { BaseSelectStage } from "./stages/BaseSelectStage";
import { OvenStage } from "./stages/OvenStage";
import { FrostingStage } from "./stages/FrostingStage";
import { ToppingStage } from "./stages/ToppingStage";
import { DecorationStage } from "./stages/DecorationStage";
import { OrderTicket } from "./OrderTicket";

type CraftingScreenProps = {
  gameState: ReturnType<typeof useGameState>;
};

const STAGE_TABS: { stage: CraftingStage; emoji: string; label: string }[] = [
  { stage: "base", emoji: "🍰", label: "시트" },
  { stage: "oven", emoji: "🔥", label: "오븐" },
  { stage: "frosting", emoji: "🍦", label: "크림" },
  { stage: "topping", emoji: "🍓", label: "토핑" },
  { stage: "decoration", emoji: "🎂", label: "데코" },
];

// ③ 제작 화면 진입/이탈 + Papa's 시리즈 스타일 하단 단계 탭.
// ④ 실제 제작 단계(시트→오븐→크림→토핑→데코레이션) 미니게임을 여기서 조립한다.
export function CraftingScreen({ gameState }: CraftingScreenProps) {
  const { state, exitCrafting, setOrderStage, updateOrder, completeOrder } = gameState;
  const order = state.activeOrders.find((activeOrder) => activeOrder.orderId === state.craftingOrderId);
  const customer = order ? (state.tables.find((table) => table?.id === order.customerId) ?? null) : null;

  const goToStage = (stage: CraftingStage) =>
    order && isStageUnlocked(order.cake, stage) && setOrderStage(order.orderId, stage);

  const handleSelectBase = (materialId: string) =>
    order && updateOrder(order.orderId, (o) => ({ ...o, cake: { ...o.cake, base: materialId } }));

  const handleStartBaking = () =>
    order &&
    updateOrder(order.orderId, (o) => ({
      ...o,
      cake: { ...o.cake, baking: { startTime: Date.now(), duration: OVEN_DURATION_MS, doneness: 0 } },
    }));

  const handleFinishBaking = (doneness: number) =>
    order &&
    updateOrder(order.orderId, (o) => ({
      ...o,
      cake: { ...o.cake, baking: { ...o.cake.baking, doneness } },
    }));

  const handleFrostingComplete = (coverage: number, evenness: number) =>
    order &&
    updateOrder(order.orderId, (o) => ({
      ...o,
      // Phase 1은 크림 재료가 1종류뿐이라 별도 선택 UI 없이 이 단계 완료 시 자동으로 지정한다.
      cake: { ...o.cake, filling: initialMaterials.cream[0]?.id ?? o.cake.filling, frosting: { coverage, evenness } },
    }));

  const handleToggleTopping = (x: number, y: number) => {
    if (!order) return;
    const toppingMaterial = initialMaterials.topping[0];
    if (!toppingMaterial) return;
    updateOrder(order.orderId, (o) => {
      const existingIndex = o.cake.toppings.findIndex((t) => Math.abs(t.x - x) < 1 && Math.abs(t.y - y) < 1);
      const toppings =
        existingIndex >= 0
          ? o.cake.toppings.filter((_, index) => index !== existingIndex)
          : [...o.cake.toppings, { itemId: toppingMaterial.id, x, y }];
      return { ...o, cake: { ...o.cake, toppings } };
    });
  };

  const handleAddDrawing = (drawing: CakeDrawing) =>
    order && updateOrder(order.orderId, (o) => ({ ...o, cake: { ...o.cake, drawings: [...o.cake.drawings, drawing] } }));

  const handleClearDrawings = () =>
    order && updateOrder(order.orderId, (o) => ({ ...o, cake: { ...o.cake, drawings: [] } }));

  const handleAddText = (content: string) =>
    order &&
    updateOrder(order.orderId, (o) => ({
      ...o,
      cake: {
        ...o.cake,
        text: [...o.cake.text, { content, x: 50, y: 50, rotation: 0, scale: 1, color: "#4a3733", font: "sans-serif" }],
      },
    }));

  const handleMoveText = (index: number, x: number, y: number) =>
    order &&
    updateOrder(order.orderId, (o) => ({
      ...o,
      cake: { ...o.cake, text: o.cake.text.map((text, i) => (i === index ? { ...text, x, y } : text)) },
    }));

  const handleFinishDecoration = () => order && completeOrder(order.orderId);

  return (
    <div className="game-root flex h-dvh w-dvw flex-col overflow-hidden bg-[var(--theme-background)]">
      <header className="flex shrink-0 items-center justify-between gap-4 bg-[var(--theme-secondary)] px-4 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          onClick={exitCrafting}
          className="rounded-full bg-white/70 px-3 py-1.5 text-base font-bold text-[var(--theme-text)] shadow-sm transition-transform active:scale-95"
        >
          ← 나가기
        </button>
        {customer && <OrderTicket customer={customer} />}
      </header>

      {order && (
        <>
          {order.stage === "base" && (
            <BaseSelectStage
              order={order}
              materials={initialMaterials}
              rank={state.player.rank}
              onSelectBase={handleSelectBase}
              onNext={() => goToStage("oven")}
            />
          )}
          {order.stage === "oven" && (
            <OvenStage
              order={order}
              materials={initialMaterials}
              onStartBaking={handleStartBaking}
              onFinishBaking={handleFinishBaking}
              onNext={() => goToStage("frosting")}
            />
          )}
          {order.stage === "frosting" && (
            <FrostingStage
              order={order}
              materials={initialMaterials}
              onComplete={handleFrostingComplete}
              onNext={() => goToStage("topping")}
            />
          )}
          {order.stage === "topping" && (
            <ToppingStage
              order={order}
              materials={initialMaterials}
              rank={state.player.rank}
              onToggleTopping={handleToggleTopping}
              onNext={() => goToStage("decoration")}
            />
          )}
          {order.stage === "decoration" && (
            <DecorationStage
              order={order}
              materials={initialMaterials}
              onAddDrawing={handleAddDrawing}
              onClearDrawings={handleClearDrawings}
              onAddText={handleAddText}
              onMoveText={handleMoveText}
              onFinish={handleFinishDecoration}
            />
          )}
          {order.stage === "ready" && (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-[var(--theme-text)]">
              <p className="text-lg font-medium">🎉 완성된 케이크입니다. 매장 화면에서 손님에게 서빙해주세요.</p>
            </div>
          )}
        </>
      )}

      {/* 하단 단계 탭: Papa's 시리즈의 스테이션 전환 UI 참고. */}
      {order && order.stage !== "ready" && (
        <nav
          aria-label="제작 단계"
          className="flex shrink-0 items-stretch justify-around gap-1 border-t border-black/5 bg-[var(--theme-secondary)] px-2 py-2"
        >
          {STAGE_TABS.map((tab) => {
            const isActive = tab.stage === order.stage;
            // 앞 단계를 아직 끝내지 않은 탭은 잠근다. 색만으로 구분하지 않도록 🔒 아이콘을 함께 보여준다 (18장).
            const isLocked = !isStageUnlocked(order.cake, tab.stage);
            return (
              <button
                key={tab.stage}
                type="button"
                onClick={() => goToStage(tab.stage)}
                disabled={isLocked}
                aria-current={isActive}
                aria-label={isLocked ? `${tab.label} (앞 단계를 먼저 끝내세요)` : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-bold transition-transform active:scale-95 disabled:opacity-45 disabled:active:scale-100 ${
                  isActive ? "bg-[var(--theme-accent)] text-white shadow-sm" : "bg-white/60 text-[var(--theme-text)]"
                }`}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {isLocked ? "🔒" : tab.emoji}
                </span>
                {tab.label}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
