"use client";

import type { ActiveOrder, MaterialRegistry } from "@/lib/gameState";
import {
  getBakingElapsedRatio,
  OVEN_BURNT_RATIO,
  OVEN_IDEAL_END_RATIO,
  OVEN_IDEAL_START_RATIO,
} from "@/lib/gameLogic";
import { formatOrderNumber } from "@/lib/station";
import { useNow } from "@/hooks/useNow";
import { DiscardButton } from "../DiscardButton";
import { CakeSnapshot } from "../cake/CakeSnapshot";

type OvenStageProps = {
  queue: ActiveOrder[]; // 오븐에 들어가길 기다리는 케이크
  slots: (ActiveOrder | null)[]; // 오븐 칸별 굽는 중인 케이크
  materials: MaterialRegistry;
  onPutIn: (orderId: string) => void;
  onTakeOut: (slotIndex: number) => void;
  onDiscard: (orderId: string) => void;
};

// 오븐 스테이션. 칸이 여러 개라 동시에 굽고, 타이머는 절대 시각 기준이라 다른 스테이션에 가 있어도 계속 흐른다
// (cake-tycoon-prompt.md 3장 "여러 주문 동시 진행"). 오래 두면 탄다.
export function OvenStage({ queue, slots, materials, onPutIn, onTakeOut, onDiscard }: OvenStageProps) {
  const now = useNow(slots.some(Boolean));
  const hasFreeSlot = slots.some((slot) => slot === null);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center gap-6 px-4 py-3">
      {/* 오븐 대기 트레이 */}
      <section aria-label="오븐 대기" className="flex h-full max-h-64 w-36 flex-col gap-2 rounded-2xl bg-white/50 p-2">
        <h2 className="text-center text-xs font-bold text-[var(--theme-text)]/70">오븐 대기</h2>
        {queue.length === 0 && (
          <p className="m-auto text-center text-xs text-[var(--theme-text)]/50">시트 스테이션에서 케이크를 보내주세요</p>
        )}
        <ul className="flex flex-col gap-2 overflow-y-auto">
          {queue.map((order) => (
            <li key={order.orderId}>
              <button
                type="button"
                onClick={() => onPutIn(order.orderId)}
                disabled={!hasFreeSlot}
                className="flex w-full items-center gap-2 rounded-xl bg-white px-2 py-1.5 text-left text-sm font-bold text-[var(--theme-text)] shadow-sm transition-transform active:scale-95 disabled:opacity-50"
              >
                <CakeSnapshot cake={order.cake} materials={materials} size={32} label={`${formatOrderNumber(order)} 케이크`} />
                <span className="flex flex-col leading-tight">
                  {formatOrderNumber(order)}
                  <span className="text-[11px] font-medium text-[var(--theme-text)]/60">
                    {hasFreeSlot ? "넣기 →" : "칸이 없어요"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 오븐 칸들 */}
      <div className="flex gap-4">
        {slots.map((order, index) => (
          <OvenSlot
            key={index}
            index={index}
            order={order}
            name={order ? formatOrderNumber(order) : null}
            now={now}
            materials={materials}
            onTakeOut={() => onTakeOut(index)}
            onDiscard={() => order && onDiscard(order.orderId)}
          />
        ))}
      </div>
    </div>
  );
}

type OvenSlotProps = {
  index: number;
  order: ActiveOrder | null;
  name: string | null;
  now: number;
  materials: MaterialRegistry;
  onTakeOut: () => void;
  onDiscard: () => void;
};

function OvenSlot({ index, order, name, now, materials, onTakeOut, onDiscard }: OvenSlotProps) {
  const baking = order?.cake.baking;
  const ratio = baking?.startTime ? Math.max(0, getBakingElapsedRatio(baking.startTime, baking.duration, now)) : 0;
  const status = !order
    ? "empty"
    : ratio < OVEN_IDEAL_START_RATIO
      ? "baking"
      : ratio <= OVEN_IDEAL_END_RATIO
        ? "ideal"
        : ratio < OVEN_BURNT_RATIO
          ? "over"
          : "burnt";
  const remainingSec = baking ? Math.max(0, Math.ceil(((OVEN_IDEAL_START_RATIO - ratio) * baking.duration) / 1000)) : 0;

  const statusText = {
    empty: "비어 있어요",
    baking: `굽는 중… ${remainingSec}초`,
    ideal: "지금 꺼내세요!",
    over: "너무 익고 있어요!",
    burnt: "타버렸어요 😵",
  }[status];

  return (
    <section aria-label={`오븐 ${index + 1}번 칸`} className="flex w-44 flex-col items-center gap-2">
      {/* 오븐 몸체: 어두운 창 너머로 케이크가 보이고, 굽는 중엔 안쪽이 주황빛으로 달아오른다 */}
      <div className="relative flex h-40 w-full items-center justify-center rounded-2xl border-4 border-[#5b4a42] bg-[#3a302b] shadow-[inset_0_0_0_4px_rgba(255,255,255,0.06),0_6px_14px_rgba(0,0,0,0.25)]">
        <div
          className={`absolute inset-3 rounded-xl transition-colors duration-700 ${
            order ? (status === "burnt" ? "bg-[#5a2a1a]" : "bg-[#e0782f]/60") : "bg-black/30"
          } ${order ? "shadow-[inset_0_0_24px_rgba(255,170,60,0.8)]" : ""}`}
          aria-hidden
        />
        {order && (
          <div className="relative">
            <CakeSnapshot cake={order.cake} materials={materials} size={96} label={`${name} 케이크`} now={now} />
          </div>
        )}
        {status === "burnt" && (
          <span className="absolute top-2 right-3 animate-pulse text-2xl" aria-hidden>
            💨
          </span>
        )}
        <span className="absolute -top-3 left-3 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[var(--theme-text)] shadow-sm">
          {index + 1}번 칸{name ? ` · ${name}` : ""}
        </span>
      </div>

      {/* 타이밍 바: 초록 = 적정 구간, 빨강 = 타는 구간 */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/70" aria-hidden>
        <div
          className="absolute inset-y-0 bg-emerald-300/80"
          style={{
            left: `${(OVEN_IDEAL_START_RATIO / OVEN_BURNT_RATIO) * 100}%`,
            width: `${((OVEN_IDEAL_END_RATIO - OVEN_IDEAL_START_RATIO) / OVEN_BURNT_RATIO) * 100}%`,
          }}
        />
        <div className="absolute inset-y-0 right-0 w-1 bg-red-400" />
        {order && (
          <div
            className="absolute inset-y-0 left-0 bg-[var(--theme-accent)]/80"
            style={{ width: `${Math.min(ratio / OVEN_BURNT_RATIO, 1) * 100}%` }}
          />
        )}
      </div>

      <p
        role="status"
        className={`text-sm font-bold ${
          status === "ideal" ? "text-emerald-600" : status === "over" || status === "burnt" ? "text-red-500" : "text-[var(--theme-text)]/70"
        }`}
      >
        {statusText}
      </p>

      <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onTakeOut}
        disabled={!order}
        className={`rounded-full px-5 py-1.5 text-base font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-30 ${
          status === "ideal" ? "bg-emerald-500" : status === "over" || status === "burnt" ? "bg-red-500" : "bg-[var(--theme-accent)]"
        }`}
      >
        꺼내기
      </button>
      {order && name && <DiscardButton orderLabel={name} onDiscard={onDiscard} compact />}
      </div>
    </section>
  );
}
