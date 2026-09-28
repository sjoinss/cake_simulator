"use client";

import { useEffect, useState } from "react";
import type { useGameState } from "@/hooks/useGameState";
import { PlayerSide } from "./PlayerSide";
import { CustomerSide } from "./CustomerSide";
import { ServeResultCard } from "./ServeResultCard";
import type { CakeDragHandlers } from "./CakeCounter";
import { CakeSnapshot } from "@/components/game/cake/CakeSnapshot";
import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";

type ShopScreenProps = {
  gameState: ReturnType<typeof useGameState>;
};

// 계산대 케이크 드래그 상태. origin은 스냅백 시 되돌아갈 위치(받침대 위 케이크 중심).
type DragState = {
  jobId: string;
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
  const materialRegistry = useMaterialRegistry();
  const {
    state,
    orderingCustomerId,
    orderingStepIndex,
    justArrivedIds,
    servedCakes,
    leavingIds,
    serveResult,
    handleCustomerTap,
    serveCake,
    discardCake,
    dismissServeResult,
  } = gameState;

  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverTableIndex, setHoverTableIndex] = useState<number | null>(null);

  // 계산대 받침대에는 완성 케이크를 1개만 올린다 (17장 "계산대에 케이크 2개 이상 동시 보관" 제외). 먼저 완성된 것부터.
  const readyCakes = state.cakes
    .filter((job) => job.stage === "ready")
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
  const counterCake = readyCakes[0] ?? null;
  // 케이크를 받을 수 있는 손님: 주문을 받고 아직 케이크를 못 받은 손님 (누구에게든 줄 수 있다)
  const canReceive = (tableIndex: number | null) =>
    tableIndex !== null && state.tables[tableIndex]?.status === "order_confirmed";

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
      if (!counterCake || drag) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      const rect = event.currentTarget.getBoundingClientRect();
      setDrag({
        jobId: counterCake.jobId,
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
      if (!drag || drag.isReturning || !counterCake) return;
      const tableIndex = findTableIndexAt(event.clientX, event.clientY);
      if (tableIndex !== null && canReceive(tableIndex)) {
        setHoverTableIndex(null);
        setDrag(null);
        serveCake(drag.jobId, tableIndex);
        return;
      }
      // 빈 테이블이나 주문 안 한 손님, 빈 곳에 놓으면 감점 없이 스냅백만 한다 (3장 "서빙").
      snapBack();
    },
    onPointerCancel: snapBack,
  };

  const isDraggingActive = !!drag && !drag.isReturning;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative flex flex-1 min-h-0">
        <PlayerSide
          counter={{
            cake: counterCake,
            queuedCount: Math.max(0, readyCakes.length - 1),
            isDragging: !!drag,
            dragHandlers,
            // 키보드로는 가장 먼저 주문한(오래 기다린) 손님에게 준다
            onKeyboardServe: () => {
              const waiting = state.tables
                .map((customer, index) => ({ customer, index }))
                .filter(({ customer }) => customer?.status === "order_confirmed")
                .sort((a, b) => (a.customer?.orderNumber ?? 0) - (b.customer?.orderNumber ?? 0))[0];
              if (counterCake && waiting) serveCake(counterCake.jobId, waiting.index);
            },
            onDiscard: () => counterCake && discardCake(counterCake.jobId),
          }}
        />
        {/* 주방(계산대)과 홀 사이 벽 기둥 */}
        <div
          aria-hidden
          className="relative z-10 w-3 shrink-0 bg-[linear-gradient(90deg,var(--theme-pillar-edge),#fffaf6_40%,var(--theme-wainscot))] shadow-[2px_0_4px_rgba(120,70,50,0.12),-2px_0_4px_rgba(120,70,50,0.12)]"
        />
        <CustomerSide
          tables={state.tables}
          orderingCustomerId={orderingCustomerId}
          orderingStepIndex={orderingStepIndex}
          justArrivedIds={justArrivedIds}
          servedCakes={servedCakes}
          leavingIds={leavingIds}
          isDraggingCake={isDraggingActive}
          hoverTableIndex={isDraggingActive ? hoverTableIndex : null}
          onCustomerTap={handleCustomerTap}
        />
      </div>

      {/* 손가락/마우스를 따라다니는 케이크. 드롭 대상 판별을 가리지 않도록 pointer-events-none */}
      {drag && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_6px_6px_rgba(0,0,0,0.25)]"
          style={{
            left: drag.isReturning ? drag.originX : drag.x,
            top: drag.isReturning ? drag.originY : drag.y,
            transition: drag.isReturning ? `left ${SNAP_BACK_MS}ms ease-out, top ${SNAP_BACK_MS}ms ease-out` : "none",
          }}
        >
          {counterCake && (
            <CakeSnapshot cake={counterCake.cake} materials={materialRegistry} size={72} label="들고 있는 케이크" />
          )}
        </div>
      )}

      {serveResult && <ServeResultCard result={serveResult} onClose={dismissServeResult} />}
    </div>
  );
}
