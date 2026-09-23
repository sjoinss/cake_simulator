"use client";

import { useRef } from "react";
import type { ActiveOrder, MaterialRegistry } from "@/lib/gameState";
import { getUnlockedMaterials } from "@/lib/materials";
import { CakeRenderer } from "../cake/CakeRenderer";

type ToppingStageProps = {
  order: ActiveOrder;
  materials: MaterialRegistry;
  rank: number;
  onToggleTopping: (x: number, y: number) => void;
  onNext: () => void;
};

const GRID_SIZE = 6;
const SNAP_STEP = 100 / GRID_SIZE;

// 토핑 단계. 완전 자유배치 대신 은은한 그리드에 스냅시켜서 배치가 깔끔해 보이게 한다 (1장 5번 원칙).
export function ToppingStage({ order, materials, rank, onToggleTopping, onNext }: ToppingStageProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const selectedTopping = getUnlockedMaterials(materials, "topping", rank)[0];

  const handleTap = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const dx = px - 0.5;
    const dy = py - 0.5;
    if (dx * dx + dy * dy > 0.25) return; // 원형 케이크 밖은 무시

    const snappedX = (Math.floor(px * GRID_SIZE) + 0.5) * SNAP_STEP;
    const snappedY = (Math.floor(py * GRID_SIZE) + 0.5) * SNAP_STEP;
    onToggleTopping(snappedX, snappedY);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <div ref={areaRef} className="relative aspect-square w-56 max-w-full touch-none" onPointerDown={handleTap}>
        <CakeRenderer cake={order.cake} materials={materials} />
        <div
          className="pointer-events-none absolute inset-0 grid rounded-full opacity-20"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
          aria-hidden
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => (
            <div key={index} className="border border-[var(--theme-text)]" />
          ))}
        </div>
      </div>

      {selectedTopping && (
        <p className="flex items-center gap-2 text-sm text-[var(--theme-text)]/70">
          <span aria-hidden>{selectedTopping.emoji}</span>
          {selectedTopping.name}을(를) 케이크 위에 탭해서 올려보세요 (다시 탭하면 제거)
        </p>
      )}

      {/* 주문에는 항상 토핑이 있으므로 최소 1개는 올려야 데코 단계로 넘어갈 수 있다 (lib/gameLogic.ts isStageUnlocked) */}
      <button
        type="button"
        onClick={onNext}
        disabled={order.cake.toppings.length === 0}
        className="rounded-full bg-[var(--theme-accent)] px-6 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-40"
      >
        다음 단계로 →
      </button>
    </div>
  );
}
