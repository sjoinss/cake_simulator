"use client";

import { useMemo, useRef, useState } from "react";
import type { ActiveOrder, MaterialRegistry } from "@/lib/gameState";
import { scoreFrostingCoverage, scoreFrostingEvenness } from "@/lib/gameLogic";
import { CakeRenderer } from "../cake/CakeRenderer";

type FrostingStageProps = {
  order: ActiveOrder;
  materials: MaterialRegistry;
  onComplete: (coverage: number, evenness: number) => void;
  onNext: () => void;
};

const GRID_SIZE = 6;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

// 크림 바르기 단계. 매 프레임 픽셀 분석 대신 터치가 지나간 그리드 셀을 표시해두는
// 샘플링 기반 근사치로 범위(coverage)/균일도(evenness)를 계산한다 (19장 4번 원칙).
export function FrostingStage({ order, materials, onComplete, onNext }: FrostingStageProps) {
  const [painted, setPainted] = useState<Set<number>>(new Set());
  const [isDone, setIsDone] = useState(order.cake.frosting.coverage > 0);
  const isDrawing = useRef(false);
  const areaRef = useRef<HTMLDivElement>(null);

  const paintAt = (clientX: number, clientY: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    if (px < 0 || px > 1 || py < 0 || py > 1) return;

    const dx = px - 0.5;
    const dy = py - 0.5;
    if (dx * dx + dy * dy > 0.25) return; // 원형 케이크 범위 밖은 무시

    const col = Math.min(GRID_SIZE - 1, Math.floor(px * GRID_SIZE));
    const row = Math.min(GRID_SIZE - 1, Math.floor(py * GRID_SIZE));
    setPainted((prev) => new Set(prev).add(row * GRID_SIZE + col));
  };

  const handleComplete = () => {
    const coverage = scoreFrostingCoverage(painted.size, TOTAL_CELLS);
    const half = GRID_SIZE / 2;
    const quadrantCounts = [0, 0, 0, 0];
    painted.forEach((cellIndex) => {
      const row = Math.floor(cellIndex / GRID_SIZE);
      const col = cellIndex % GRID_SIZE;
      const quadrant = (row < half ? 0 : 2) + (col < half ? 0 : 1);
      quadrantCounts[quadrant] += 1;
    });
    const evenness = scoreFrostingEvenness(quadrantCounts, half * half);
    onComplete(coverage, evenness);
    setIsDone(true);
  };

  const previewCoverage = useMemo(() => scoreFrostingCoverage(painted.size, TOTAL_CELLS), [painted]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <div
        ref={areaRef}
        className="relative aspect-square w-56 max-w-full touch-none"
        onPointerDown={(event) => {
          if (isDone) return;
          isDrawing.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          paintAt(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (!isDrawing.current || isDone) return;
          paintAt(event.clientX, event.clientY);
        }}
        onPointerUp={() => {
          isDrawing.current = false;
        }}
      >
        <CakeRenderer cake={order.cake} materials={materials} />
        {!isDone && (
          <div
            className="pointer-events-none absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {Array.from({ length: TOTAL_CELLS }, (_, index) => (
              <div
                key={index}
                style={{ backgroundColor: painted.has(index) ? "rgba(255,255,255,0.85)" : "transparent" }}
              />
            ))}
          </div>
        )}
      </div>

      {!isDone && (
        <p className="text-sm text-[var(--theme-text)]/70">
          케이크 위를 손가락으로 문질러 크림을 발라주세요 (덮은 면적 {previewCoverage}%)
        </p>
      )}

      {!isDone ? (
        <button
          type="button"
          onClick={handleComplete}
          disabled={painted.size === 0}
          className="rounded-full bg-[var(--theme-accent)] px-6 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-40"
        >
          완료
        </button>
      ) : (
        <>
          <p className="text-base font-bold text-[var(--theme-text)]">
            범위 {order.cake.frosting.coverage}점 · 균일도 {order.cake.frosting.evenness}점
          </p>
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-[var(--theme-accent)] px-6 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            다음 단계로 →
          </button>
        </>
      )}
    </div>
  );
}
