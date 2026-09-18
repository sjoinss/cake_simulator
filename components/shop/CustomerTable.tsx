import type { Customer } from "@/lib/gameState";
import { SpeechBubble } from "./SpeechBubble";

type CustomerTableProps = {
  tableIndex: number;
  customer: Customer | null;
};

// Phase 1: 정적 배치만 구현. 등장 애니메이션/순차 주문은 다음 단계에서 붙인다.
export function CustomerTable({ tableIndex, customer }: CustomerTableProps) {
  return (
    <div
      aria-label={
        customer ? `테이블 ${tableIndex + 1}, ${customer.name}` : `테이블 ${tableIndex + 1}, 빈 테이블`
      }
      className="flex flex-1 basis-0 flex-col items-center justify-end gap-1"
    >
      {customer && <SpeechBubble>...</SpeechBubble>}
      <div className="text-5xl leading-none" aria-hidden>
        {customer ? "🧑" : ""}
      </div>
      <div className="h-10 w-full max-w-28 rounded-full border-2 border-[var(--theme-accent)]/60 bg-[var(--theme-secondary)]" />
    </div>
  );
}
