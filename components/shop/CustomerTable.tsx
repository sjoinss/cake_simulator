import type { ReactNode } from "react";
import type { CakeData, Customer } from "@/lib/gameState";
import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";
import { CakeSnapshot } from "@/components/game/cake/CakeSnapshot";
import { SpeechBubble } from "./SpeechBubble";
import { useCustomImages } from "@/components/game/CustomImages";

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
  lockedRank: number | null; // 아직 안 열린 테이블이면 열리는 랭크 (13-3)
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
  lockedRank,
}: CustomerTableProps) {
  const materialRegistry = useMaterialRegistry();
  const { getCustomerImage } = useCustomImages();
  const customerImage = customer ? getCustomerImage(customer.look, servedCake ? "eating" : "idle") : null;
  return (
    <div
      aria-label={
        customer
          ? `테이블 ${tableIndex + 1}, 손님`
          : lockedRank !== null
            ? `테이블 ${tableIndex + 1}, 랭크 ${lockedRank}에 열려요`
            : `테이블 ${tableIndex + 1}, 빈 테이블`
      }
      data-table-index={tableIndex} // 드래그 서빙 시 드롭 대상 판별용 (ShopScreen)
      className="relative flex max-w-44 flex-1 basis-0 flex-col items-center justify-end"
    >
      {/* 아직 안 여는 테이블: 흐리게 + 상판 위 "예약" 팻말 */}
      {lockedRank !== null && !customer && (
        <span className="absolute bottom-[4.6rem] z-30 flex flex-col items-center short:bottom-[2.9rem]">
          <span className="rounded-md border border-black/10 bg-white px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-[var(--theme-text)]/70 shadow-sm short:px-1.5 short:text-[10px]">
            🔒 랭크 {lockedRank}
          </span>
          <span aria-hidden className="h-1.5 w-1 bg-[#c9b8ac]" />
        </span>
      )}
      {/* 의자 등받이: 손님 뒤에 있어서 앉아 있는 것처럼 보인다. 빈 테이블에도 놓여 있다 */}
      <div
        aria-hidden
        className={`absolute bottom-14 left-1/2 h-24 w-20 -translate-x-1/2 rounded-t-[1.8rem] border-4 border-b-0 border-[#b98559] bg-[#d9aa7e] shadow-[inset_0_3px_0_rgba(255,255,255,0.3)] short:bottom-9 short:h-16 short:w-14 short:rounded-t-[1.2rem] ${lockedRank !== null && !customer ? "opacity-50" : ""}`}
      >
        <div className="mx-auto mt-2 h-[70%] w-1.5 rounded-full bg-[#b98559]/60" />
      </div>
      {customer && (
        // 애니메이션은 DOM 마운트가 아니라 shouldAnimateEntrance(방금 배정됐는지)로만 재생 여부를 결정한다.
        // 그래야 제작 화면을 왕복해서 이 컴포넌트가 다시 마운트돼도, 이미 있던 손님까지 매번 튀어나오지 않는다.
        <div
          key={customer.id}
          className={`relative z-10 -mb-1 flex flex-col items-center gap-1 ${shouldAnimateEntrance ? "animate-customer-enter" : ""} ${
            isLeaving ? "animate-customer-leave" : ""
          }`}
        >
          {bubble && <SpeechBubble>{bubble}</SpeechBubble>}
          {/* 주문 번호 이름표: 손님 머리 위에 조금 띄워 둔다. 손님 그림 상자 기준으로 간격을 잡아서
              이모지를 이미지로 바꿔도 위치가 그대로 맞는다 */}
          {orderTag && (
            <span className="relative mb-3.5 rounded-full bg-white px-2.5 py-0.5 text-sm font-extrabold text-[var(--theme-text)] shadow-[0_2px_4px_rgba(90,50,30,0.15)] short:mb-2.5 short:text-xs">
              {orderTag}
              <span
                aria-hidden
                className="absolute top-full left-1/2 h-1.5 w-2.5 -translate-x-1/2 bg-white"
                style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
              />
            </span>
          )}
          {/* 손님 그림 자리: 이미지로 바꿀 때도 이 상자 크기(64x64, 폰 가로 48x48)에 맞춰 넣는다 */}
          <button
            type="button"
            onClick={onTap}
            aria-label={"손님 주문 확인"}
            className="flex h-16 w-16 cursor-pointer items-end justify-center border-0 bg-transparent p-0 text-6xl leading-none transition-transform active:scale-90 short:h-12 short:w-12 short:text-5xl"
          >
            {customerImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- 플레이어가 넣은 blob URL이라 next/image를 쓸 수 없다
              <img
                src={customerImage}
                alt=""
                draggable={false}
                className="h-full w-full object-contain object-bottom"
              />
            ) : servedCake ? (
              "😋"
            ) : (
              "🧑"
            )}
          </button>
        </div>
      )}
      {/* 드래그 중 드롭 안내: 색만으로 구분하지 않도록 텍스트 라벨을 함께 보여준다 (18장) */}
      {dropState === "hover" && (
        <span className="pointer-events-none absolute bottom-28 z-30 rounded-full bg-[var(--theme-accent)] px-3 py-1 text-sm font-bold whitespace-nowrap text-white shadow-sm">
          이 손님에게 주기 ⬇
        </span>
      )}
      {/* 둥근 카페 테이블 (옆에서 본 모습): 흰 대리석 상판 + 가는 다리 + 둥근 받침. 손님은 상판 뒤에 앉아 있다 */}
      <div className={`relative z-20 flex w-[94%] flex-col items-center ${lockedRank !== null && !customer ? "opacity-50" : ""}`}>
        <div
          className={`relative h-5 w-full rounded-[50%] short:h-4 bg-[linear-gradient(180deg,#ffffff,#f1e9e4)] shadow-[0_3px_0_#e0d2c9,0_6px_8px_rgba(90,50,30,0.15)] ${
            dropState ? "outline-3 outline-offset-4 outline-dashed outline-[var(--theme-accent)]" : ""
          }`}
        >
          {/* 서빙된 케이크: 먹는 동안 테이블 위에 놓여 있다 */}
          {servedCake && (
            <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2">
              <CakeSnapshot cake={servedCake} materials={materialRegistry} size={52} label="서빙된 케이크" />
            </div>
          )}
        </div>
        <div
          aria-hidden
          className="h-14 w-2.5 bg-[linear-gradient(90deg,#9c6a45,#c99466,#9c6a45)] short:h-7 short:w-2"
        />
        <div
          aria-hidden
          className="h-2.5 w-16 rounded-[50%] bg-[#9c6a45] shadow-[0_3px_4px_rgba(0,0,0,0.2)] short:h-2 short:w-12"
        />
      </div>
    </div>
  );
}
