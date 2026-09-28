import type { ReactNode } from "react";
import type { CakeData, Customer } from "@/lib/gameState";
import { initialMaterials } from "@/lib/materials";
import { CakeSnapshot } from "@/components/game/cake/CakeSnapshot";
import { SpeechBubble } from "./SpeechBubble";

type CustomerTableProps = {
  tableIndex: number;
  customer: Customer | null;
  bubble: ReactNode | null;
  shouldAnimateEntrance: boolean;
  onTap: () => void;
  orderTag: string | null; // 머리 위에 띄우는 주문 번호 ("#1")
  servedCake: CakeData | null; // 서빙 완료 후 먹는 중인 케이크 (테이블 위에 표시)
  isLeaving: boolean; // 먹고 나서 퇴장 애니메이션 재생 중
  dropState: "available" | "hover" | null; // 케이크를 끄는 중: available = 줄 수 있는 손님, hover = 지금 이 테이블 위에 있음
};

export function CustomerTable({
  tableIndex,
  customer,
  bubble,
  shouldAnimateEntrance,
  onTap,
  orderTag,
  servedCake,
  isLeaving,
  dropState,
}: CustomerTableProps) {
  return (
    <div
      aria-label={customer ? `테이블 ${tableIndex + 1}, ${customer.name}` : `테이블 ${tableIndex + 1}, 빈 테이블`}
      data-table-index={tableIndex} // 드래그 서빙 시 드롭 대상 판별용 (ShopScreen)
      className="relative flex flex-1 basis-0 flex-col items-center justify-end gap-1"
    >
      {customer && (
        // 애니메이션은 DOM 마운트가 아니라 shouldAnimateEntrance(방금 배정됐는지)로만 재생 여부를 결정한다.
        // 그래야 제작 화면을 왕복해서 이 컴포넌트가 다시 마운트돼도, 이미 있던 손님까지 매번 튀어나오지 않는다.
        <div
          key={customer.id}
          className={`flex flex-col items-center gap-1 ${shouldAnimateEntrance ? "animate-customer-enter" : ""} ${
            isLeaving ? "animate-customer-leave" : ""
          }`}
        >
          {bubble && <SpeechBubble>{bubble}</SpeechBubble>}
          {orderTag && (
            <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-sm font-extrabold text-[var(--theme-text)] shadow-sm">
              {orderTag}
            </span>
          )}
          <button
            type="button"
            onClick={onTap}
            aria-label={`${customer.name} 주문 확인`}
            className="cursor-pointer border-0 bg-transparent p-0 text-5xl leading-none transition-transform active:scale-90"
          >
            {servedCake ? "😋" : "🧑"}
          </button>
          {/* 발밑 그림자 */}
          <div className="h-2 w-10 rounded-full bg-black/10 blur-[1px]" aria-hidden />
        </div>
      )}
      {/* 드래그 중 드롭 안내: 색만으로 구분하지 않도록 텍스트 라벨을 함께 보여준다 (18장) */}
      {dropState === "hover" && (
        <span className="pointer-events-none absolute bottom-16 z-10 rounded-full bg-[var(--theme-accent)] px-3 py-1 text-sm font-bold whitespace-nowrap text-white shadow-sm">
          이 손님에게 주기 ⬇
        </span>
      )}
      {/* 각자의 영역(칸) 가로를 꽉 채우는 개별 테이블. 플레이어 쪽 계산대와 높이가 완전히 같으면 어색해서 살짝 낮게 둔다. */}
      <div
        className={`relative mb-2 h-12 w-full rounded-t-md bg-[var(--theme-secondary)] shadow-[inset_0_2px_0_rgba(255,255,255,0.6),0_3px_0_rgba(0,0,0,0.08)] ${
          dropState ? "outline-3 outline-offset-2 outline-dashed outline-[var(--theme-accent)]" : ""
        }`}
      >
        {/* 서빙된 케이크: 먹는 동안 테이블 위에 놓여 있다 */}
        {servedCake && (
          <div className="absolute bottom-[45%] left-1/2 -translate-x-1/2">
            <CakeSnapshot cake={servedCake} materials={initialMaterials} size={52} label="서빙된 케이크" />
          </div>
        )}
      </div>
    </div>
  );
}
