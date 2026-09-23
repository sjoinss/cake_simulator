"use client";

import { useEffect, useState } from "react";
import type { useGameState } from "@/hooks/useGameState";
import { HUD } from "@/components/game/HUD";
import { PlayerSide } from "./PlayerSide";
import { CustomerSide } from "./CustomerSide";
import { ServeResultCard } from "./ServeResultCard";
import type { CakeDragHandlers } from "./CakeCounter";

type ShopScreenProps = {
  gameState: ReturnType<typeof useGameState>;
};

// 계산대 케이크 드래그 상태. origin은 스냅백 시 되돌아갈 위치(받침대 위 케이크 중심).
type DragState = {
  orderId: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  isReturning: boolean;
};

const SNAP_BACK_MS = 250;

// 화면 좌표 아래에 있는 손님 테이블 번호를 찾는다 (CustomerTable의 data-table-index).
function findTableIndexAt(x: number, y: number): number | null {
  for (const element of document.elementsFromPoint(x, y)) {
    const table = element.closest<HTMLElement>("[data-table-index]");
    if (table) return Number(table.dataset.tableIndex);
  }
  return null;
}

export function ShopScreen({ gameState }: ShopScreenProps) {
  const {
    state,
    orderingCustomerId,
    orderingStepIndex,
    justArrivedIds,
    servedCakes,
    leavingIds,
    serveResult,
    handleCustomerTap,
    startOrResumeOrder,
    serveOrder,
    dismissServeResult,
  } = gameState;

  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverTableIndex, setHoverTableIndex] = useState<number | null>(null);

  // 계산대에는 완성 케이크를 1개만 올린다 (17장 "계산대에 케이크 2개 이상 동시 보관" 제외). 먼저 완성된 것부터.
  const readyOrders = state.activeOrders
    .filter((order) => order.stage === "ready")
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
  const counterOrder = readyOrders[0] ?? null;
  const counterCustomer = counterOrder ? state.tables.find((table) => table?.id === counterOrder.customerId) : null;

  // 잘못된 곳에 놓으면 받침대 위치로 부드럽게 되돌아간 뒤 드래그 상태를 정리한다.
  useEffect(() => {
    if (!drag?.isReturning) return;
    const timer = setTimeout(() => setDrag(null), SNAP_BACK_MS);
    return () => clearTimeout(timer);
  }, [drag?.isReturning]);

  const snapBack = () => {
    setHoverTableIndex(null);
    setDrag((prev) => (prev ? { ...prev, isReturning: true } : prev));
  };

  const dragHandlers: CakeDragHandlers = {
    onPointerDown: (event) => {
      if (!counterOrder || drag) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      const rect = event.currentTarget.getBoundingClientRect();
      setDrag({
        orderId: counterOrder.orderId,
        x: event.clientX,
        y: event.clientY,
        originX: rect.left + rect.width / 2,
        originY: rect.top + rect.height / 2,
        isReturning: false,
      });
    },
    onPointerMove: (event) => {
      if (!drag || drag.isReturning) return;
      setDrag({ ...drag, x: event.clientX, y: event.clientY });
      setHoverTableIndex(findTableIndexAt(event.clientX, event.clientY));
    },
    onPointerUp: (event) => {
      if (!drag || drag.isReturning || !counterOrder) return;
      const tableIndex = findTableIndexAt(event.clientX, event.clientY);
      const target = tableIndex !== null ? state.tables[tableIndex] : null;
      if (target && target.id === counterOrder.customerId) {
        setHoverTableIndex(null);
        setDrag(null);
        serveOrder(drag.orderId);
        return;
      }
      // Phase 1: 잘못된 테이블(또는 빈 곳)에 놓으면 감점 없이 스냅백만 한다 (3장 "서빙").
      snapBack();
    },
    onPointerCancel: snapBack,
  };

  const isDraggingActive = !!drag && !drag.isReturning;

  return (
    <div className="game-root relative h-dvh w-dvw flex-col overflow-hidden">
      <HUD day={state.player.day} money={state.player.money} />
      <div className="relative flex flex-1 min-h-0">
        <PlayerSide
          counter={{
            cake: counterOrder,
            customerName: counterCustomer?.name ?? null,
            queuedCount: Math.max(0, readyOrders.length - 1),
            isDragging: !!drag,
            dragHandlers,
            onKeyboardServe: () => counterOrder && serveOrder(counterOrder.orderId),
          }}
        />
        {/* 좌/우 공간을 나누는 은은한 홈(seam). 예전엔 네온 라인 느낌이라 촌스러워서 부드러운 그림자로 교체. */}
        <div
          aria-hidden
          className="w-2 shrink-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0)_50%,rgba(0,0,0,0.12)_100%)]"
        />
        <CustomerSide
          tables={state.tables}
          activeOrders={state.activeOrders}
          orderingCustomerId={orderingCustomerId}
          orderingStepIndex={orderingStepIndex}
          justArrivedIds={justArrivedIds}
          servedCakes={servedCakes}
          leavingIds={leavingIds}
          draggingCustomerId={isDraggingActive ? (counterOrder?.customerId ?? null) : null}
          hoverTableIndex={isDraggingActive ? hoverTableIndex : null}
          onCustomerTap={handleCustomerTap}
          onStartOrResumeOrder={startOrResumeOrder}
        />
      </div>

      {/* 손가락/마우스를 따라다니는 케이크. 드롭 대상 판별을 가리지 않도록 pointer-events-none */}
      {drag && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 text-5xl leading-none drop-shadow-[0_6px_6px_rgba(0,0,0,0.25)]"
          style={{
            left: drag.isReturning ? drag.originX : drag.x,
            top: drag.isReturning ? drag.originY : drag.y,
            transition: drag.isReturning ? `left ${SNAP_BACK_MS}ms ease-out, top ${SNAP_BACK_MS}ms ease-out` : "none",
          }}
        >
          🎂
        </div>
      )}

      {serveResult && <ServeResultCard result={serveResult} onClose={dismissServeResult} />}
    </div>
  );
}
