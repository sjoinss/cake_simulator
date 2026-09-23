"use client";

import { useEffect, useState } from "react";
import type { ActiveOrder, MaterialRegistry } from "@/lib/gameState";
import { OVEN_DURATION_MS, getBakingElapsedRatio, scoreBaking } from "@/lib/gameLogic";
import { CakeRenderer } from "../cake/CakeRenderer";

type OvenStageProps = {
  order: ActiveOrder;
  materials: MaterialRegistry;
  onStartBaking: () => void;
  onFinishBaking: (doneness: number) => void;
  onNext: () => void;
};

// 오븐 단계. 타이머는 절대 시각(startTime) 기준이라 다른 주문 작업 중이거나 매장 화면으로
// 나가 있어도 실제 경과 시간이 정확히 반영된다 (cake-tycoon-prompt.md 3장 "여러 주문 동시 진행").
export function OvenStage({ order, materials, onStartBaking, onFinishBaking, onNext }: OvenStageProps) {
  const { startTime, duration, doneness } = order.cake.baking;
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!startTime || doneness > 0) return;
    const interval = setInterval(() => forceTick((n) => n + 1), 100);
    return () => clearInterval(interval);
  }, [startTime, doneness]);

  const isBaking = startTime !== null && doneness === 0;
  const isDone = doneness > 0;
  const elapsedRatio = startTime ? getBakingElapsedRatio(startTime, duration || OVEN_DURATION_MS) : 0;
  const progressPercent = Math.min(elapsedRatio, 1) * 100;
  const inIdealZone = elapsedRatio >= 0.7 && elapsedRatio <= 0.9;
  const isOvercooked = elapsedRatio > 1.1;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <div className="relative">
        <CakeRenderer cake={order.cake} materials={materials} />
        {isBaking && (
          <span className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden>
            🔥
          </span>
        )}
      </div>

      {!startTime && (
        <button
          type="button"
          onClick={onStartBaking}
          className="rounded-full bg-[var(--theme-accent)] px-6 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          오븐에 넣기
        </button>
      )}

      {isBaking && (
        <div className="flex w-64 max-w-full flex-col items-center gap-2">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/70">
            {/* 적정 구간(70~90%) 표시 */}
            <div className="absolute inset-y-0 left-[70%] w-[20%] bg-emerald-300/70" aria-hidden />
            <div
              className="absolute inset-y-0 left-0 bg-[var(--theme-accent)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => onFinishBaking(scoreBaking(elapsedRatio))}
            className={`rounded-full px-6 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95 ${
              inIdealZone ? "bg-emerald-500" : isOvercooked ? "bg-red-500" : "bg-[var(--theme-accent)]"
            }`}
          >
            꺼내기
          </button>
        </div>
      )}

      {isDone && (
        <>
          <p className="text-base font-bold text-[var(--theme-text)]">
            굽기 점수: {doneness}점 {doneness >= 90 ? "🎉 완벽해요!" : doneness < 40 ? "😥 아쉬워요" : "👍"}
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
