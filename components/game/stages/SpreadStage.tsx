"use client";

import { useState } from "react";
import type { ActiveOrder, Material, MaterialRegistry } from "@/lib/gameState";
import {
  CREAM_FLOW_PER_SEC,
  createEmptyFrosting,
  createEmptySide,
  depositCream,
  depositSide,
  getCreamTotal,
  getSideTargetTotal,
  getSpreadTargetTotal,
  TURNTABLE_SEC_PER_TURN,
} from "@/lib/frosting";
import { useHoldLoop } from "@/hooks/useHoldLoop";
import { Cake3D, CakeInsideView } from "../cake/CakeRenderer";
import { AmountGauge } from "../AmountGauge";
import { MaterialPicker } from "../MaterialPicker";

export type SpreadData = { cells: number[]; side: number[] };

type SpreadStageProps = {
  order: ActiveOrder;
  materials: MaterialRegistry;
  layer: "filling" | "frosting"; // 필링(갈라진 시트 안쪽) / 겉 크림(윗면 + 옆면)
  options: Material[]; // 고를 수 있는 재료
  targetThickness: number; // 칸당 목표 두께
  targetLabel: string; // 게이지에 보일 목표 (예: "적정량", "듬뿍")
  onSelectMaterial: (materialId: string) => void;
  onSave: (data: SpreadData) => void; // 손을 뗄 때마다 지금까지 바른 양을 주문에 저장
  onFinish: (data: SpreadData) => void; // 완료 — 채점 후 다음으로 넘어간다 (되돌릴 수 없음)
};

type Face = "top" | "side";

// 짜는 세기: 같은 속도로 케이크 전체를 한 번 훑었을 때 얼마나 두껍게 발리는지를 정한다.
// "조금" 주문은 살살, "듬뿍" 주문은 꾹 눌러 짜면 된다 — 바르다가 중간에 멈추는 식으로 양을 맞추지 않게.
const SQUEEZE_LEVELS = [
  { id: "soft", label: "살살", multiplier: 0.6 },
  { id: "normal", label: "보통", multiplier: 1 },
  { id: "hard", label: "꾹", multiplier: 1.5 },
] as const;
type SqueezeId = (typeof SQUEEZE_LEVELS)[number]["id"];

const CAKE_SIZE = 224;
const TURN_DEG_PER_SEC = 360 / TURNTABLE_SEC_PER_TURN;
// 게이지 최대치는 모든 목표에서 같게 둬서 "조금/보통/듬뿍" 차이가 게이지에서도 보이게 한다
const TOP_GAUGE_MAX = getSpreadTargetTotal(1.5) * 1.4;
const SIDE_GAUGE_MAX = getSideTargetTotal(1.5) * 1.4;

// 짤주머니로 짜서 바르기 (필링·크림 공용, 1장 4번 프레스&홀드). 재료를 먼저 고르고, 누르고 있는 동안 일정 속도로 나온다.
// - 윗면/필링: 손가락 위치에 쌓인다. 한 자리에 머물면 두꺼워지고 빨리 지나가면 얇아진다.
// - 옆면(겉 크림만): 누르고 있으면 회전판이 돌면서 정면에 온 옆면에 발린다. 딱 한 바퀴가 "보통" 양.
// 매 프레임 게임 상태를 갱신하지 않도록 짜는 동안은 로컬 상태에만 쌓고, 손을 떼는 순간 주문에 저장한다.
export function SpreadStage({
  order,
  materials,
  layer,
  options,
  targetThickness,
  targetLabel,
  onSelectMaterial,
  onSave,
  onFinish,
}: SpreadStageProps) {
  const current = order.cake[layer];
  const [cells, setCells] = useState(current.cells);
  const [side, setSide] = useState(current.side);
  const [face, setFace] = useState<Face>("top");
  const [squeeze, setSqueeze] = useState<SqueezeId>("normal");
  const [rotation, setRotation] = useState(0);
  const [nozzle, setNozzle] = useState<{ x: number; y: number } | null>(null); // 누르는 영역 대비 0~1
  const hasMaterial = current.materialId !== null;
  const noun = layer === "filling" ? "필링" : "크림";
  const hasSide = layer === "frosting";

  useHoldLoop(nozzle !== null, (dt) => {
    const multiplier = SQUEEZE_LEVELS.find((level) => level.id === squeeze)?.multiplier ?? 1;
    const units = CREAM_FLOW_PER_SEC * dt * multiplier;
    if (face === "side") {
      setRotation((prev) => prev + TURN_DEG_PER_SEC * dt);
      setSide((prev) => depositSide(prev, rotation, units));
    } else if (nozzle) {
      setCells((prev) => depositCream(prev, nozzle.x, nozzle.y, units));
    }
  });

  const pointerAt = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };

  const release = () => {
    if (!nozzle) return;
    setNozzle(null);
    onSave({ cells, side });
  };

  const pressHandlers = {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      if (!hasMaterial) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setNozzle(pointerAt(event));
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      if (nozzle) setNozzle(pointerAt(event));
    },
    onPointerUp: release,
    onPointerCancel: release,
  };

  const hitArea = (label: string) => (
    <div
      aria-label={label}
      className={`relative h-full w-full touch-none select-none ${hasMaterial ? "cursor-crosshair" : "cursor-not-allowed"}`}
      {...pressHandlers}
    >
      {/* 짜는 위치 표시: 크림이 쌓이는 자리를 가리지 않도록 테두리 원 + 옆으로 비켜난 작은 짤주머니만 보여준다 */}
      {nozzle && (
        <>
          {face !== "side" && (
            <span
              aria-hidden
              className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white/80"
              style={{ left: `${nozzle.x * 100}%`, top: `${nozzle.y * 100}%` }}
            />
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute text-lg leading-none opacity-90"
            style={{
              left: face === "side" ? "50%" : `${nozzle.x * 100}%`,
              top: face === "side" ? "30%" : `${nozzle.y * 100}%`,
              transform: "translate(60%, -130%) rotate(20deg)",
            }}
          >
            🍦
          </span>
        </>
      )}
    </div>
  );

  const topTotal = getCreamTotal(cells);
  const sideTotal = side.reduce((sum, value) => sum + value, 0);
  const isSideFace = hasSide && face === "side";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-4 py-2">
      <MaterialPicker
        materials={options}
        selectedId={current.materialId}
        label={`${noun} 재료`}
        locked={topTotal + sideTotal > 0}
        container={layer === "filling" ? "jar" : "bag"}
        onSelect={onSelectMaterial}
      />

      <div className="flex items-center gap-5">
        <div className="flex flex-col gap-3">
          {hasSide && (
            <div role="group" aria-label="바를 면" className="flex flex-col gap-1.5">
              {(["top", "side"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={face === option}
                  onClick={() => setFace(option)}
                  disabled={nozzle !== null}
                  className={`rounded-2xl px-3 py-1.5 text-sm font-bold shadow-sm transition-transform active:scale-95 ${
                    face === option ? "bg-[var(--theme-accent)] text-white" : "bg-white/70 text-[var(--theme-text)]"
                  }`}
                >
                  {option === "top" ? "⬆️ 윗면" : "🔄 옆면"}
                </button>
              ))}
            </div>
          )}
          <div role="radiogroup" aria-label="짜는 세기" className="flex flex-col gap-1">
            <span className="text-center text-[11px] font-bold text-[var(--theme-text)]/70">짜는 세기</span>
            {SQUEEZE_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                role="radio"
                aria-checked={squeeze === level.id}
                onClick={() => setSqueeze(level.id)}
                className={`flex items-center justify-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-sm transition-transform active:scale-95 ${
                  squeeze === level.id ? "bg-[var(--theme-accent)] text-white" : "bg-white/70 text-[var(--theme-text)]"
                }`}
              >
                <span
                  aria-hidden
                  className="inline-block rounded-full bg-current"
                  style={{ width: 4 + level.multiplier * 4, height: 4 + level.multiplier * 4 }}
                />
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {layer === "filling" ? (
          <div className="relative">
            <CakeInsideView cake={{ ...order.cake, filling: { ...current, cells } }} materials={materials} />
            <div className="absolute inset-0">{hitArea("누르고 있으면 필링이 나와요")}</div>
          </div>
        ) : (
          <div className="relative">
            <Cake3D
              cake={{ ...order.cake, frosting: { ...current, cells, side } }}
              materials={materials}
              size={CAKE_SIZE}
              rotation={rotation}
              topOverlay={face === "top" ? hitArea("누르고 있으면 윗면에 크림이 나와요") : undefined}
              sideOverlay={face === "side" ? hitArea("누르고 있으면 회전판이 돌면서 옆면에 크림이 발려요") : undefined}
            />
          </div>
        )}

        <AmountGauge
          value={isSideFace ? sideTotal : topTotal}
          target={isSideFace ? getSideTargetTotal(targetThickness) : getSpreadTargetTotal(targetThickness)}
          max={isSideFace ? SIDE_GAUGE_MAX : TOP_GAUGE_MAX}
          label={`${isSideFace ? "옆면" : hasSide ? "윗면" : ""} ${noun} 양`}
          targetLabel={targetLabel}
        />

        <div className="flex w-36 flex-col gap-2 text-sm text-[var(--theme-text)]/80">
          <p>
            {!hasMaterial
              ? `먼저 ${noun} 재료를 고르세요.`
              : isSideFace
                ? "옆면을 누르고 있으면 케이크가 돌아가며 크림이 발려요. 딱 한 바퀴 돌리면 고르게 발려요."
                : `케이크를 누르고 있으면 ${noun}이 나와요. 짜는 세기를 골라 케이크 전체를 고르게 훑어 초록 띠에 맞춰주세요.`}
          </p>
          <button
            type="button"
            onClick={() => {
              const empty = { cells: createEmptyFrosting(), side: hasSide ? createEmptySide() : [] };
              setCells(empty.cells);
              setSide(empty.side);
              onSave(empty);
            }}
            disabled={topTotal + sideTotal === 0}
            className="rounded-full bg-white/80 px-3 py-1.5 font-bold text-[var(--theme-text)] shadow-sm transition-transform active:scale-95 disabled:opacity-40"
          >
            🧽 다시 바르기
          </button>
          <button
            type="button"
            onClick={() => onFinish({ cells, side })}
            disabled={topTotal === 0 || nozzle !== null}
            className="rounded-full bg-[var(--theme-accent)] px-3 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-40"
          >
            {noun} 완료 →
          </button>
        </div>
      </div>
    </div>
  );
}
