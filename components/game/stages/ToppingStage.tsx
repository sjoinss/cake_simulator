"use client";

import { useState } from "react";
import type { ActiveOrder, MaterialRegistry } from "@/lib/gameState";
import { getUnlockedMaterials } from "@/lib/materials";
import { Cake3D } from "../cake/CakeRenderer";
import { MaterialPicker } from "../MaterialPicker";

type ToppingStageProps = {
  order: ActiveOrder;
  materials: MaterialRegistry;
  rank: number;
  onToggleTopping: (itemId: string, x: number, y: number) => void;
  onNext: () => void;
};

const GRID_SIZE = 6;
const SNAP_STEP = 100 / GRID_SIZE;

// 토핑 단계. 토핑 재료를 먼저 고른 뒤 케이크를 탭해서 올린다. 완전 자유배치 대신 은은한 그리드에 스냅시켜서
// 배치가 깔끔해 보이게 한다 (1장 5번 원칙). 이미 올린 자리를 다시 탭하면 뺀다.
export function ToppingStage({ order, materials, rank, onToggleTopping, onNext }: ToppingStageProps) {
  const options = getUnlockedMaterials(materials, "topping", rank);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 입체 케이크 윗면 타원 영역을 누른 위치를 평면 좌표(0~1)로 되돌린다
  const handleTap = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const dx = px - 0.5;
    const dy = py - 0.5;
    if (dx * dx + dy * dy > 0.25) return; // 원형 케이크 밖은 무시

    const snappedX = (Math.floor(px * GRID_SIZE) + 0.5) * SNAP_STEP;
    const snappedY = (Math.floor(py * GRID_SIZE) + 0.5) * SNAP_STEP;
    const occupied = order.cake.toppings.some((t) => Math.abs(t.x - snappedX) < 1 && Math.abs(t.y - snappedY) < 1);
    if (!selectedId && !occupied) return; // 재료를 안 골랐으면 빼기만 가능
    onToggleTopping(selectedId ?? "", snappedX, snappedY);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-2">
      <MaterialPicker materials={options} selectedId={selectedId} label="토핑 재료" container="bowl" onSelect={setSelectedId} />

      <Cake3D
        cake={order.cake}
        materials={materials}
        size={240}
        faceLayer={
          <div
            className="pointer-events-none absolute inset-0 grid rounded-full opacity-20"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}
            aria-hidden
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => (
              <div key={index} className="border border-[var(--theme-text)]" />
            ))}
          </div>
        }
        topOverlay={<div className="h-full w-full cursor-pointer touch-none" onPointerDown={handleTap} />}
      />

      <p className="text-sm text-[var(--theme-text)]/70">
        {selectedId ? "케이크를 탭해서 올려보세요 (다시 탭하면 빼요)" : "먼저 올릴 토핑을 고르세요"}
      </p>

      {/* 주문에는 항상 토핑이 있으므로 최소 1개는 올려야 데코로 넘어갈 수 있다 */}
      <button
        type="button"
        onClick={onNext}
        disabled={order.cake.toppings.length === 0}
        className="rounded-full bg-[var(--theme-accent)] px-6 py-1.5 text-base font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-40"
      >
        토핑 완료 →
      </button>
    </div>
  );
}
