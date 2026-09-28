import type { ActiveOrder, Customer } from "@/lib/gameState";
import { TABLE_COUNT } from "@/lib/gameState";
import { initialMaterials } from "@/lib/materials";
import { getOrderSteps } from "@/lib/order";
import { formatOrderNumber } from "@/lib/station";

type OrderClipRailProps = {
  orders: ActiveOrder[];
  customers: (Customer | null)[];
  openBillId: string | null;
  onBillTap: (order: ActiveOrder) => void;
  onCloseBill: () => void;
};

// 톱니 모양으로 잘린 영수증 아래 끝
const RECEIPT_EDGE =
  "polygon(0 0, 100% 0, 100% 100%, 90% 94%, 80% 100%, 70% 94%, 60% 100%, 50% 94%, 40% 100%, 30% 94%, 20% 100%, 10% 94%, 0 100%)";
// 손으로 대충 걸어둔 느낌이 나게 집게마다 살짝 다르게 기울인다
const TILTS = [-3, 2, -1.5];

// 주방 주문서 레일. 식당 주방처럼 금속 봉에 집게로 주문서를 집어 둔다 (Papa's의 티켓 레일 참고).
// 모든 화면 오른쪽 위에 떠 있어서 어느 스테이션에서든 주문서를 볼 수 있다 (1장 1번). 작은 주문서엔 번호만 적고,
// 누르면 아래로 큰 주문서가 펼쳐진다. 테이블이 3개라 동시에 걸리는 주문서도 최대 3장.
export function OrderClipRail({ orders, customers, openBillId, onBillTap, onCloseBill }: OrderClipRailProps) {
  const sorted = [...orders].sort((a, b) => a.orderNumber - b.orderNumber);
  const openOrder = sorted.find((order) => order.orderId === openBillId) ?? null;
  const openCustomer = openOrder ? customers.find((customer) => customer?.id === openOrder.customerId) : null;

  return (
    <div className="pointer-events-none absolute top-1 right-3 z-30 flex flex-col items-end">
      {/* 금속 봉 */}
      <div
        aria-hidden
        className="h-2 w-44 rounded-full bg-[linear-gradient(180deg,#e4e8ec,#9aa3ad)] shadow-[0_2px_3px_rgba(0,0,0,0.25)]"
      />
      <ul aria-label="주문서" className="-mt-1 flex w-44 justify-around">
        {Array.from({ length: TABLE_COUNT }, (_, slot) => {
          const order = sorted[slot];
          return (
            <li key={order?.orderId ?? `empty-${slot}`} className="flex flex-col items-center">
              {/* 집게 */}
              <span
                aria-hidden
                className="relative z-10 h-3 w-5 rounded-sm bg-[linear-gradient(180deg,#f4f6f8,#b8c0c8)] shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              />
              {order && (
                <button
                  type="button"
                  onClick={() => onBillTap(order)}
                  aria-expanded={order.orderId === openBillId}
                  aria-label={`${formatOrderNumber(order)} 주문서`}
                  className={`pointer-events-auto -mt-1 flex h-14 w-12 origin-top items-center justify-center bg-[#fffdf8] pb-1 text-lg font-extrabold text-[var(--theme-text)] shadow-[0_3px_5px_rgba(0,0,0,0.2)] ${
                    order.orderId === openBillId ? "ring-2 ring-[var(--theme-accent)] ring-inset" : ""
                  }`}
                  style={{ clipPath: RECEIPT_EDGE, transform: `rotate(${TILTS[slot % TILTS.length]}deg)` }}
                >
                  {formatOrderNumber(order)}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* 펼친 주문서 */}
      {openOrder && openCustomer && (
        <section
          aria-label={`${formatOrderNumber(openOrder)} 주문서`}
          className="animate-result-pop pointer-events-auto mt-2 w-56 bg-[#fffdf8] px-4 pt-3 pb-6 text-[var(--theme-text)] shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
          style={{ clipPath: RECEIPT_EDGE }}
        >
          <div className="flex items-start justify-between border-b border-dashed border-black/20 pb-2">
            <p className="text-2xl leading-none font-extrabold">{formatOrderNumber(openOrder)}</p>
            <button
              type="button"
              onClick={onCloseBill}
              aria-label="주문서 닫기"
              className="rounded-full px-2 text-lg leading-none text-[var(--theme-text)]/60 hover:bg-black/5"
            >
              ✕
            </button>
          </div>
          <ul className="flex flex-col gap-1.5 pt-2 text-sm">
            {getOrderSteps(openCustomer.order, initialMaterials).map((step) => (
              <li key={step.label} className="flex items-center gap-2">
                <span className="text-lg leading-none" aria-hidden>
                  {step.emoji}
                </span>
                <span className="flex-1 font-medium">{step.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
