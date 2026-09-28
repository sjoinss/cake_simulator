"use client";

import { useEffect, useState } from "react";
import type { CakeJob, MaterialRegistry } from "@/lib/gameState";
import { getBakingElapsedRatio, OVEN_BURNT_RATIO, OVEN_IDEAL_END_RATIO, OVEN_IDEAL_START_RATIO } from "@/lib/gameLogic";
import { useNow } from "@/hooks/useNow";
import { useIsShort } from "@/hooks/useIsShort";
import { DiscardButton } from "../DiscardButton";
import { CakeSnapshot } from "../cake/CakeSnapshot";
import { BatterTin } from "../cake/BatterTin";

type OvenStageProps = {
  queue: CakeJob[]; // 오븐에 들어가길 기다리는 케이크
  slots: (CakeJob | null)[]; // 오븐 칸별 굽는 중인 케이크
  materials: MaterialRegistry;
  onPutIn: (jobId: string, slot?: number) => void;
  onTakeOut: (slotIndex: number) => void;
  onDiscard: (jobId: string) => void;
};

// 끌고 있는 반죽 틀. origin은 잘못 놓았을 때 되돌아갈 자리(대기 줄의 원래 위치).
type DragState = {
  jobId: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  isReturning: boolean;
};

const SNAP_BACK_MS = 250;

// 화면 좌표 아래에 있는 오븐 칸 번호 (OvenSlot의 data-oven-slot)
function findOvenSlotAt(x: number, y: number): number | null {
  for (const element of document.elementsFromPoint(x, y)) {
    const slot = element.closest<HTMLElement>("[data-oven-slot]");
    if (slot) return Number(slot.dataset.ovenSlot);
  }
  return null;
}

// 오븐 스테이션. 반죽을 부은 틀이 조리대 위에 줄지어 있고, 위쪽 빈 오븐 칸으로 끌어다 넣는다 (계산대 서빙과 같은 드래그 방식).
// 틀 줄은 가로 스크롤이라, 터치로 옆으로 밀면 스크롤되고 위로 끌면 드래그가 된다 (touch-action: pan-x).
// 칸이 여러 개라 동시에 굽고, 타이머는 절대 시각 기준이라 다른 스테이션에 가 있어도 계속 흐른다
// (cake-tycoon-prompt.md 3장 "여러 주문 동시 진행"). 오래 두면 탄다.
export function OvenStage({ queue, slots, materials, onPutIn, onTakeOut, onDiscard }: OvenStageProps) {
  const now = useNow(slots.some(Boolean));
  const isShort = useIsShort();
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const tinWidth = isShort ? 64 : 92;
  const draggingJob = drag ? queue.find((job) => job.jobId === drag.jobId) : undefined;

  // 잘못된 곳에 놓으면 대기 줄 원래 자리로 부드럽게 돌아간 뒤 드래그 상태를 정리한다.
  useEffect(() => {
    if (!drag?.isReturning) return;
    const timer = setTimeout(() => setDrag(null), SNAP_BACK_MS);
    return () => clearTimeout(timer);
  }, [drag?.isReturning]);

  const snapBack = () => {
    setHoverSlot(null);
    setDrag((prev) => (prev ? { ...prev, isReturning: true } : prev));
  };

  const isDragging = !!drag && !drag.isReturning;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-between gap-2 px-4 pt-3 pb-[3%] short:gap-1 short:pt-1.5">
      {/* 오븐 칸들 */}
      <div className="flex gap-4 short:gap-2.5">
        {slots.map((job, index) => (
          <OvenSlot
            key={index}
            index={index}
            job={job}
            now={now}
            materials={materials}
            dropHint={isDragging ? (job ? null : hoverSlot === index ? "hover" : "available") : null}
            onTakeOut={() => onTakeOut(index)}
            onDiscard={() => job && onDiscard(job.jobId)}
          />
        ))}
      </div>

      {/* 오븐 대기 줄: 반죽을 부은 틀들이 조리대 위에 가로로 늘어서 있다. 폭이 모자라면 화면 밖으로 이어지고 옆으로 밀어서 본다 */}
      <section aria-label="오븐 대기" className="flex w-full min-w-0 flex-col items-center gap-1 short:gap-0.5">
        <h2 className="text-xs font-bold whitespace-nowrap text-[var(--theme-text)]/70">오븐 대기</h2>
        {queue.length === 0 && (
          <p className="rounded-full bg-white/60 px-3 py-1 text-center text-xs text-[var(--theme-text)]/60">
            시트 스테이션에서 틀을 보내주세요
          </p>
        )}
        <ul className="mx-auto flex w-max max-w-full snap-x items-end gap-5 overflow-x-auto px-4 pt-1 pb-2 short:gap-3">
          {queue.map((job) => {
            const isHeld = drag?.jobId === job.jobId;
            return (
              <li key={job.jobId} className="shrink-0 snap-center">
                <button
                  type="button"
                  aria-label="반죽 틀. 빈 오븐 칸으로 끌어다 놓으세요"
                  className={`block cursor-grab touch-pan-x border-0 bg-transparent p-0 select-none active:cursor-grabbing ${
                    isHeld ? "opacity-0" : ""
                  }`}
                  onPointerDown={(event) => {
                    if (drag) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const rect = event.currentTarget.getBoundingClientRect();
                    setDrag({
                      jobId: job.jobId,
                      x: event.clientX,
                      y: event.clientY,
                      originX: rect.left + rect.width / 2,
                      originY: rect.top + rect.height / 2,
                      isReturning: false,
                    });
                  }}
                  onPointerMove={(event) => {
                    if (!drag || drag.isReturning) return;
                    setDrag({ ...drag, x: event.clientX, y: event.clientY });
                    setHoverSlot(findOvenSlotAt(event.clientX, event.clientY));
                  }}
                  onPointerUp={(event) => {
                    if (!drag || drag.isReturning) return;
                    const slot = findOvenSlotAt(event.clientX, event.clientY);
                    if (slot !== null && slots[slot] === null) {
                      setHoverSlot(null);
                      setDrag(null);
                      onPutIn(drag.jobId, slot);
                      return;
                    }
                    snapBack(); // 빈 칸이 아닌 곳에 놓으면 감점 없이 되돌아간다
                  }}
                  onPointerCancel={snapBack}
                  onClick={(event) => {
                    // detail === 0 이면 마우스/터치가 아니라 키보드(Enter/Space) — 첫 빈 칸에 바로 넣는다 (18장 접근성)
                    if (event.detail === 0) onPutIn(job.jobId);
                  }}
                >
                  <BatterTin cake={job.cake} materials={materials} width={tinWidth} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 손가락을 따라다니는 틀. 드롭 대상 판별을 가리지 않도록 pointer-events-none */}
      {drag && draggingJob && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_6px_6px_rgba(0,0,0,0.25)]"
          style={{
            left: drag.isReturning ? drag.originX : drag.x,
            top: drag.isReturning ? drag.originY : drag.y,
            transition: drag.isReturning ? `left ${SNAP_BACK_MS}ms ease-out, top ${SNAP_BACK_MS}ms ease-out` : "none",
          }}
        >
          <BatterTin cake={draggingJob.cake} materials={materials} width={tinWidth} />
        </div>
      )}
    </div>
  );
}

type OvenSlotProps = {
  index: number;
  job: CakeJob | null;
  now: number;
  materials: MaterialRegistry;
  dropHint: "available" | "hover" | null; // 틀을 끄는 중: 넣을 수 있는 빈 칸 / 지금 그 위에 있음
  onTakeOut: () => void;
  onDiscard: () => void;
};

function OvenSlot({ index, job, now, materials, dropHint, onTakeOut, onDiscard }: OvenSlotProps) {
  const isShort = useIsShort();
  const baking = job?.cake.baking;
  const ratio = baking?.startTime ? Math.max(0, getBakingElapsedRatio(baking.startTime, baking.duration, now)) : 0;
  const status = !job
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
    <section
      aria-label={`오븐 ${index + 1}번 칸`}
      className="flex w-44 flex-col items-center gap-2 short:w-32 short:gap-1"
    >
      {/* 오븐 몸체: 어두운 창 너머로 케이크가 보이고, 굽는 중엔 안쪽이 주황빛으로 달아오른다 */}
      <div
        data-oven-slot={index} // 반죽 틀 드래그 시 드롭 대상 판별용
        className={`relative flex h-40 w-full items-center justify-center rounded-2xl border-4 short:h-24 short:border-[3px] border-[#5b4a42] bg-[#3a302b] shadow-[inset_0_0_0_4px_rgba(255,255,255,0.06),0_6px_14px_rgba(0,0,0,0.25)] transition-transform ${
          dropHint ? "outline-3 outline-offset-2 outline-[var(--theme-accent)] outline-dashed" : ""
        } ${dropHint === "hover" ? "scale-105" : ""}`}
      >
        <div
          className={`absolute inset-3 rounded-xl transition-colors duration-700 ${
            job ? (status === "burnt" ? "bg-[#5a2a1a]" : "bg-[#e0782f]/60") : "bg-black/30"
          } ${job ? "shadow-[inset_0_0_24px_rgba(255,170,60,0.8)]" : ""}`}
          aria-hidden
        />
        {job && (
          <div className="relative">
            <CakeSnapshot
              cake={job.cake}
              materials={materials}
              size={isShort ? 60 : 96}
              label="굽는 중인 케이크"
              now={now}
            />
          </div>
        )}
        {status === "burnt" && (
          <span className="absolute top-2 right-3 animate-pulse text-2xl" aria-hidden>
            ♨️
          </span>
        )}
        <span className="absolute -top-3 left-3 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[var(--theme-text)] shadow-sm">
          {index + 1}번 칸
        </span>
      </div>

      {/* 타이밍 바: 초록 = 적정 구간, 빨강 = 타는 구간 */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/70 short:h-2" aria-hidden>
        <div
          className="absolute inset-y-0 bg-emerald-300/80"
          style={{
            left: `${(OVEN_IDEAL_START_RATIO / OVEN_BURNT_RATIO) * 100}%`,
            width: `${((OVEN_IDEAL_END_RATIO - OVEN_IDEAL_START_RATIO) / OVEN_BURNT_RATIO) * 100}%`,
          }}
        />
        <div className="absolute inset-y-0 right-0 w-1 bg-red-400" />
        {job && (
          <div
            className="absolute inset-y-0 left-0 bg-[var(--theme-accent)]/80"
            style={{ width: `${Math.min(ratio / OVEN_BURNT_RATIO, 1) * 100}%` }}
          />
        )}
      </div>

      <p
        role="status"
        className={`text-sm font-bold whitespace-nowrap short:text-xs ${
          status === "ideal"
            ? "text-emerald-600"
            : status === "over" || status === "burnt"
              ? "text-red-500"
              : "text-[var(--theme-text)]/70"
        }`}
      >
        {statusText}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onTakeOut}
          disabled={!job}
          className={`rounded-full px-5 py-1.5 text-base font-bold whitespace-nowrap text-white shadow-sm short:px-3 short:py-1 short:text-sm transition-transform active:scale-95 disabled:opacity-30 ${
            status === "ideal"
              ? "bg-emerald-500"
              : status === "over" || status === "burnt"
                ? "bg-red-500"
                : "bg-[var(--theme-accent)]"
          }`}
        >
          꺼내기
        </button>
        {job && <DiscardButton orderLabel="오븐 속" onDiscard={onDiscard} compact />}
      </div>
    </section>
  );
}
