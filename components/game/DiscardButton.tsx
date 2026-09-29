"use client";

import { useState } from "react";

type DiscardButtonProps = {
  orderLabel: string; // "#1"
  onDiscard: () => void;
  compact?: boolean;
};

// 케이크 버리기 (타거나 실수했을 때 처음부터 다시). 되돌릴 수 없는 조작이라 한 번 더 확인한다.
// 브라우저 confirm() 대화상자 대신 버튼 자리에서 바로 "버릴까요? 예/아니오"로 바뀐다.
export function DiscardButton({ orderLabel, onDiscard, compact }: DiscardButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <span
        role="group"
        aria-label={`${orderLabel} 케이크 버리기 확인`}
        className="flex flex-wrap items-center justify-center gap-1"
      >
        <span className="text-xs font-bold whitespace-nowrap text-red-600">버릴까요?</span>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onDiscard();
          }}
          className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-white shadow-sm active:scale-95"
        >
          버리기
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-[var(--theme-text)] shadow-sm active:scale-95"
        >
          취소
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`${orderLabel} 케이크 버리기`}
      className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-[var(--theme-text)] shadow-sm transition-transform active:scale-95"
    >
      🗑️{!compact && " 버리기"}
    </button>
  );
}
