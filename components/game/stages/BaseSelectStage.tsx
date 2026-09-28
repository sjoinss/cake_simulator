"use client";

import { useState } from "react";
import type { ActiveOrder, MaterialRegistry } from "@/lib/gameState";
import { findMaterial, getUnlockedMaterials } from "@/lib/materials";
import { BATTER_FLOW_PER_SEC, BATTER_TARGET } from "@/lib/gameLogic";
import { useHoldLoop } from "@/hooks/useHoldLoop";
import { AmountGauge } from "../AmountGauge";
import { MaterialPicker } from "../MaterialPicker";
import { FitBox, Scaled } from "../FitBox";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, HINT, SIDE_COLUMN, STAGE_ROOT, WORK_ROW } from "./layout";

type BaseSelectStageProps = {
  order: ActiveOrder;
  materials: MaterialRegistry;
  rank: number;
  onSelectBase: (materialId: string) => void;
  onSaveBatter: (amount: number) => void; // 손을 뗄 때마다 부은 양을 주문에 저장
  onNext: () => void;
};

const BATTER_MAX = BATTER_TARGET * 1.5; // 틀이 꽉 차는 양. 넘으면 흘러넘친다

// 시트 스테이션. 반죽 재료를 먼저 고른 뒤, 틀을 누르고 있는 동안 반죽이 서서히 차오른다 (1장 4번 프레스&홀드).
// 적정량(게이지 초록 띠)에 맞춰 손을 떼는 게 목표다.
export function BaseSelectStage({ order, materials, rank, onSelectBase, onSaveBatter, onNext }: BaseSelectStageProps) {
  const options = getUnlockedMaterials(materials, "base", rank);
  const base = order.cake.base ? findMaterial(materials, order.cake.base) : undefined;
  const [amount, setAmount] = useState(order.cake.batter.amount);
  const [isPouring, setIsPouring] = useState(false);

  useHoldLoop(isPouring, (dt) => setAmount((prev) => prev + BATTER_FLOW_PER_SEC * dt));

  const startPouring = () => {
    if (base) setIsPouring(true);
  };
  const stopPouring = () => {
    if (!isPouring) return;
    setIsPouring(false);
    onSaveBatter(amount);
  };

  const levelPercent = Math.min(100, (amount / BATTER_MAX) * 100);
  const isOverflowing = amount > BATTER_MAX;

  return (
    <div className={STAGE_ROOT}>
      <MaterialPicker
        materials={options}
        selectedId={order.cake.base}
        label="시트 반죽"
        container="bowl"
        locked={amount > 0}
        onSelect={onSelectBase}
      />

      <div className={WORK_ROW}>
        {/* 케이크 틀 (옆에서 본 모습). 누르고 있으면 위에서 반죽이 흘러 들어와 차오른다. 224x176으로 그리고 공간에 맞춰 줄인다 */}
        <FitBox maxSize={240} heightRatio={176 / 224} className="max-w-[260px]">
          {(size) => (
            <Scaled width={size} baseWidth={224} baseHeight={176}>
              <button
                type="button"
                aria-label={base ? "누르고 있으면 반죽이 부어져요" : "반죽 재료를 먼저 고르세요"}
                disabled={!base}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  startPouring();
                }}
                onPointerUp={stopPouring}
                onPointerCancel={stopPouring}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Enter") startPouring();
                }}
                onKeyUp={stopPouring}
                className="relative flex h-44 w-56 touch-none select-none items-end justify-center border-0 bg-transparent p-0 disabled:cursor-not-allowed"
              >
                {/* 붓는 중: 기울어진 볼 + 반죽 줄기 */}
                <span
                  aria-hidden
                  className={`absolute top-0 left-1/2 text-4xl leading-none transition-transform duration-200 ${
                    isPouring ? "-translate-x-1/2 rotate-[-35deg]" : "-translate-x-1/2 opacity-60"
                  }`}
                >
                  🥣
                </span>
                {isPouring && (
                  <span
                    aria-hidden
                    className="absolute top-9 left-1/2 w-2 -translate-x-1/2 rounded-full"
                    // 볼 입구(위에서 2.25rem)부터 틀(높이 7rem, 바닥 정렬) 안 반죽 표면까지
                    style={{ height: `${8.75 - levelPercent * 0.07}rem`, backgroundColor: base?.color }}
                  />
                )}
                {/* 틀 */}
                <div className="relative h-28 w-52 overflow-hidden rounded-b-2xl border-4 border-t-0 border-[#9aa3ad] bg-[#e7ebef] shadow-[inset_0_-6px_10px_rgba(0,0,0,0.12),0_6px_12px_rgba(0,0,0,0.18)]">
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0"
                    style={{
                      height: `${levelPercent}%`,
                      backgroundColor: base?.color ?? "transparent",
                      boxShadow: "inset 0 3px 0 rgba(255,255,255,0.5)",
                    }}
                  />
                </div>
                {isOverflowing && (
                  <span aria-hidden className="absolute bottom-0 left-2 animate-pulse text-xl">
                    💦
                  </span>
                )}
              </button>
            </Scaled>
          )}
        </FitBox>

        <AmountGauge value={amount} target={BATTER_TARGET} max={BATTER_MAX} label="부은 반죽 양" targetLabel="적정량" />

        <div className={SIDE_COLUMN}>
          <p className={HINT}>
            {base
              ? "틀을 누르고 있으면 반죽이 부어져요. 초록 띠에 맞춰 손을 떼세요."
              : "먼저 선반에서 반죽 재료를 고르세요."}
          </p>
          <button
            type="button"
            onClick={() => {
              setAmount(0);
              onSaveBatter(0);
            }}
            disabled={amount === 0}
            className={BUTTON_SECONDARY}
          >
            🧽 다시 붓기
          </button>
          <button type="button" onClick={onNext} disabled={amount === 0 || isPouring} className={BUTTON_PRIMARY}>
            오븐으로 →
          </button>
        </div>
      </div>
    </div>
  );
}
