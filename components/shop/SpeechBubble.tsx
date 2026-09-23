import type { ReactNode } from "react";

type SpeechBubbleProps = {
  children: ReactNode;
};

// "..." 대기 / 순차 주문 말풍선 공용 컨테이너. 실제 내용은 다음 단계(주문 흐름)에서 채운다.
export function SpeechBubble({ children }: SpeechBubbleProps) {
  return (
    <div className="relative rounded-xl border border-black/5 bg-white px-3.5 py-1.5 text-base font-medium text-[var(--theme-text)] shadow-[0_3px_8px_rgba(0,0,0,0.12)] after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[7px] after:border-transparent after:border-t-white">
      {children}
    </div>
  );
}
