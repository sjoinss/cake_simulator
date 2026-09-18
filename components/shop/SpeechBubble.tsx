import type { ReactNode } from "react";

type SpeechBubbleProps = {
  children: ReactNode;
};

// "..." 대기 / 순차 주문 말풍선 공용 컨테이너. 실제 내용은 다음 단계(주문 흐름)에서 채운다.
export function SpeechBubble({ children }: SpeechBubbleProps) {
  return (
    <div className="relative rounded-2xl bg-white px-3 py-1 text-sm text-black shadow-sm after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-white">
      {children}
    </div>
  );
}
