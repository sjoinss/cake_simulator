"use client";

import type { GameState } from "@/lib/gameState";
import { getTutorialStep } from "@/lib/tutorial";
import { useNow } from "@/hooks/useNow";

type TutorialCoachProps = {
  state: GameState;
  onFinish: () => void; // 건너뛰기 / 마지막 안내 확인
};

// 첫 플레이 안내 말풍선. 작업 화면 왼쪽 위(재료 선반·주문서 레일과 안 겹치는 자리)에 작게 띄운다.
// 어느 탭으로 가야 하는지는 하단 탭이 깜빡이는 것으로도 보여준다 (StationNav의 highlight).
export function TutorialCoach({ state, onFinish }: TutorialCoachProps) {
  // 오븐에 케이크가 있으면 "꺼낼 때"를 알아채도록 시간을 흘린다
  const now = useNow(!state.tutorialDone && state.ovenSlots.some(Boolean), 500);
  const step = getTutorialStep(state, now);
  if (!step) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-result-pop absolute top-2 left-[calc(0.5rem+var(--safe-l))] z-30 flex w-60 flex-col gap-1.5 rounded-2xl border border-black/5 bg-white/95 px-3 py-2 text-[var(--theme-text)] shadow-[0_6px_16px_rgba(0,0,0,0.15)] short:w-48 short:gap-1 short:px-2.5 short:py-1.5"
      key={step.id}
    >
      <p className="flex gap-1.5 text-sm leading-snug font-bold short:text-[11px]">
        <span aria-hidden className="text-base leading-none short:text-sm">
          🎂
        </span>
        <span>{step.text}</span>
      </p>
      {step.finish ? (
        <button
          type="button"
          onClick={onFinish}
          className="self-end rounded-full bg-[var(--theme-accent)] px-3 py-1 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 short:py-0.5"
        >
          알겠어요!
        </button>
      ) : (
        <button
          type="button"
          onClick={onFinish}
          className="self-end text-[11px] font-semibold text-[var(--theme-text)]/50 underline-offset-2 hover:underline short:text-[10px]"
        >
          안내 건너뛰기
        </button>
      )}
    </div>
  );
}
