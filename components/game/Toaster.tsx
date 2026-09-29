"use client";

import { useSyncExternalStore } from "react";
import { getToast, starsText, subscribeToast } from "@/lib/toast";

// 단계 피드백 쪽지 (lib/toast.ts). 하단 탭 바로 위 가운데에 잠깐 떴다 사라진다 — 왼쪽 위 튜토리얼 말풍선과
// 오른쪽 위 주문서 레일을 피한 자리. 조작을 막지 않는다
export function Toaster() {
  const toast = useSyncExternalStore(subscribeToast, getToast, () => null);
  if (!toast) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(4rem+var(--safe-b))] z-[46] flex justify-center short:bottom-[calc(2.75rem+var(--safe-b))]">
      <p
        key={toast.id}
        role="status"
        className="animate-result-pop flex items-center gap-2 rounded-full border-2 border-[var(--theme-accent)] bg-white px-4 py-1.5 text-sm font-bold text-[var(--theme-text)] shadow-[0_6px_16px_rgba(0,0,0,0.18)] short:px-3 short:py-1 short:text-xs"
      >
        <span aria-hidden className="text-lg leading-none short:text-base">
          {toast.emoji}
        </span>
        <span className="font-extrabold">{toast.title}</span>
        {toast.stars !== undefined && (
          <span className="tracking-tight text-[var(--theme-accent)]" aria-label={`별 ${toast.stars}개`}>
            {starsText(toast.stars)}
          </span>
        )}
        <span>{toast.message}</span>
      </p>
    </div>
  );
}
