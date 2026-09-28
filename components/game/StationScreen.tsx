import type { useGameState } from "@/hooks/useGameState";
import type { Station, WorkStation } from "@/lib/gameState";
import { BATTER_TARGET, scoreAmountMatch } from "@/lib/gameLogic";
import { initialMaterials } from "@/lib/materials";
import { formatOrderNumber, getOvenQueue, getSelectedOrder, STATIONS } from "@/lib/station";
import { BaseSelectStage } from "./stages/BaseSelectStage";
import { OvenStage } from "./stages/OvenStage";
import { CreamStation } from "./stages/CreamStation";
import { DecorateStation } from "./stages/DecorateStation";
import { DiscardButton } from "./DiscardButton";
import { StationBackdrop } from "./StationBackdrop";

type StationScreenProps = {
  gameState: ReturnType<typeof useGameState>;
  station: Exclude<Station, "order">;
};

const EMPTY_TEXT: Record<WorkStation, string> = {
  base: "주문을 받으면 여기에 주문서가 올라와요",
  cream: "오븐에서 꺼낸 케이크가 여기로 와요",
  decorate: "크림까지 바른 케이크가 여기로 와요",
};

// 제작 스테이션 화면 (시트 / 오븐 / 필링·크림 / 토핑·데코). 하단 스테이션 탭으로 언제든 오가며 여러 케이크를 동시에 진행한다.
// 각 케이크는 스테이션을 순서대로만 거친다 — 되돌아가는 버튼은 없다 (1장 2번).
export function StationScreen({ gameState, station }: StationScreenProps) {
  const { state, updateOrder, sendOrderTo, putInOven, takeOutOfOven, discardOrder, completeOrder } = gameState;
  const info = STATIONS.find((s) => s.station === station);

  const order = station === "oven" ? null : getSelectedOrder(state, station);
  const customer = order ? (state.tables.find((table) => table?.id === order.customerId) ?? null) : null;
  const rank = state.player.rank;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[var(--theme-background)]">
      <StationBackdrop station={station} />
      {/* 버리기만 둔다 (왼쪽 아래 구석, 세로 공간을 따로 차지하지 않게). 지금 어느 주문 케이크인지는 일부러 적지 않는다 —
          주문서와 케이크를 보고 맞추는 게 게임이다. (여러 케이크가 와 있으면 주문서를 눌러 작업할 케이크를 바꾼다) */}
      {order && (
        <div className="absolute bottom-2 left-2 z-20">
          <DiscardButton orderLabel={formatOrderNumber(order)} onDiscard={() => discardOrder(order.orderId)} />
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {station === "oven" && (
          <OvenStage
            queue={getOvenQueue(state)}
            slots={state.ovenSlots.map((id) => state.activeOrders.find((o) => o.orderId === id) ?? null)}
            materials={initialMaterials}
            onPutIn={putInOven}
            onTakeOut={takeOutOfOven}
            onDiscard={discardOrder}
          />
        )}

        {!order && station !== "oven" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-[var(--theme-text)]/50">
            <span className="text-5xl opacity-60" aria-hidden>
              {info?.emoji}
            </span>
            <p className="text-sm font-medium">{EMPTY_TEXT[station]}</p>
          </div>
        )}

        {/* 주문이 바뀌거나 케이크를 버리고 다시 만들면, 단계 컴포넌트의 로컬 상태(짜는 중인 크림, 데코 히스토리 등)가
          섞이지 않도록 key로 새로 마운트한다 */}
        {order && station === "base" && (
          <BaseSelectStage
            key={`${order.orderId}-${order.attempt}`}
            order={order}
            materials={initialMaterials}
            rank={rank}
            onSelectBase={(materialId) =>
              updateOrder(order.orderId, (o) => ({ ...o, cake: { ...o.cake, base: materialId } }))
            }
            onSaveBatter={(amount) =>
              updateOrder(order.orderId, (o) => ({
                ...o,
                cake: { ...o.cake, batter: { amount, score: scoreAmountMatch(amount, BATTER_TARGET) } },
              }))
            }
            onNext={() => sendOrderTo(order.orderId, "oven")}
          />
        )}

        {order && customer && station === "cream" && (
          <CreamStation
            key={`${order.orderId}-${order.attempt}`}
            order={order}
            orderSpec={customer.order}
            materials={initialMaterials}
            rank={rank}
            onUpdate={(updater) => updateOrder(order.orderId, updater)}
          />
        )}

        {order && station === "decorate" && (
          <DecorateStation
            key={`${order.orderId}-${order.attempt}`}
            order={order}
            materials={initialMaterials}
            rank={rank}
            onUpdate={(updater) => updateOrder(order.orderId, updater)}
            onComplete={() => completeOrder(order.orderId)}
          />
        )}
      </div>
    </div>
  );
}
