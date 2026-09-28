import type { ReactNode } from "react";
import type { CakeData, Customer, MaterialRegistry } from "@/lib/gameState";
import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";
import { getOrderSteps } from "@/lib/order";
import { formatOrderNumber } from "@/lib/station";
import { CustomerTable } from "./CustomerTable";

type CustomerSideProps = {
  tables: (Customer | null)[];
  orderingCustomerId: string | null;
  orderingStepIndex: number;
  justArrivedIds: ReadonlySet<string>;
  servedCakes: Readonly<Record<string, CakeData>>;
  leavingIds: ReadonlySet<string>;
  isDraggingCake: boolean; // 계산대 케이크를 끌고 있는 중
  hoverTableIndex: number | null; // 드래그 중인 케이크가 올라가 있는 테이블
  onCustomerTap: (tableIndex: number) => void;
};

export function CustomerSide({
  tables,
  orderingCustomerId,
  orderingStepIndex,
  justArrivedIds,
  servedCakes,
  leavingIds,
  isDraggingCake,
  hoverTableIndex,
  onCustomerTap,
}: CustomerSideProps) {
  const materialRegistry = useMaterialRegistry();
  return (
    <section aria-label="손님 공간" className="relative flex flex-1 basis-3/5 overflow-hidden">
      <DiningRoom />
      <div className="relative flex flex-1 items-end justify-around gap-2 px-3 pb-[4%]">
        {tables.map((customer, index) => {
          // 주문이 확정된 손님 머리 위에는 주문 번호를 항상 띄운다(먹는 동안까지). 주문 내용은 주문서 레일에서 언제든 볼 수 있다.
          // 케이크는 주문과 묶여 있지 않아서, 주문을 받고 아직 케이크를 못 받은 손님이면 누구에게든 줄 수 있다.
          const canReceive = customer?.status === "order_confirmed";
          const dropState = isDraggingCake && canReceive ? (hoverTableIndex === index ? "hover" : "available") : null;

          return (
            <CustomerTable
              key={index}
              tableIndex={index}
              customer={customer}
              bubble={getBubbleContent(customer, orderingCustomerId, orderingStepIndex, materialRegistry)}
              shouldAnimateEntrance={!!customer && justArrivedIds.has(customer.id)}
              onTap={() => onCustomerTap(index)}
              orderTag={customer?.orderNumber != null ? formatOrderNumber(customer.orderNumber) : null}
              servedCake={customer ? (servedCakes[customer.id] ?? null) : null}
              isLeaving={!!customer && leavingIds.has(customer.id)}
              dropState={dropState}
            />
          );
        })}
      </div>
    </section>
  );
}

// 손님이 앉는 홀: 은은한 줄무늬 벽지 + 아치형 창문 하나 + 아래쪽 벽 패널(웨인스코팅) + 나무 바닥.
// 계산대 쪽(타일 벽, 차양)보다 조용하게 두어 손님과 말풍선이 잘 보이게 한다.
function DiningRoom() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* 벽지 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--theme-wallpaper)",
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--theme-wallpaper-stripe) 0 14px, transparent 14px 40px)",
        }}
      />
      {/* 아치형 창문: 바깥 하늘 + 창살. 두 번째 테이블(가운데) 위쪽에 둔다 */}
      <div className="absolute top-[9%] left-1/2 h-[34%] w-[22%] -translate-x-1/2 overflow-hidden rounded-t-full border-[5px] border-[#fffaf6] bg-[linear-gradient(180deg,#bfe3f2,#e6f4f7_70%,#fff3e8)] shadow-[0_4px_10px_rgba(120,70,50,0.12)]">
        <div className="absolute inset-y-0 left-1/2 w-[5px] -translate-x-1/2 bg-[#fffaf6]" />
        <div className="absolute inset-x-0 top-[55%] h-[5px] bg-[#fffaf6]" />
        <div className="absolute bottom-[12%] left-[12%] h-3 w-8 rounded-full bg-white/80 blur-[1px]" />
      </div>
      {/* 창턱 */}
      <div className="absolute top-[43%] left-1/2 h-1.5 w-[26%] -translate-x-1/2 rounded-sm bg-[#fffaf6] shadow-[0_2px_3px_rgba(120,70,50,0.15)]" />
      {/* 아래쪽 벽 패널 + 몰딩 */}
      <div className="absolute inset-x-0 bottom-[24%] h-[22%] border-t-4 border-[#fffaf6] bg-[var(--theme-wainscot)] shadow-[inset_0_2px_0_rgba(0,0,0,0.04)]">
        <div
          className="absolute inset-x-3 inset-y-2"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 8px, rgba(255,255,255,0.55) 8px 10px, transparent 10px 64px)",
          }}
        />
      </div>
      {/* 나무 바닥 */}
      <div
        className="absolute inset-x-0 bottom-0 h-[24%] shadow-[inset_0_4px_6px_rgba(0,0,0,0.1)]"
        style={{
          backgroundColor: "#d8b08a",
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0 1.5px, transparent 1.5px 14px), repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 60px, rgba(0,0,0,0.03) 60px 120px)",
        }}
      />
    </div>
  );
}

// 손님 상태(대기/순차 주문/확정)에 따라 말풍선에 보여줄 내용을 계산한다.
function getBubbleContent(
  customer: Customer | null,
  orderingCustomerId: string | null,
  orderingStepIndex: number,
  materialRegistry: MaterialRegistry,
): ReactNode | null {
  if (!customer) return null;

  const steps = getOrderSteps(customer.order, materialRegistry);

  if (orderingCustomerId === customer.id) {
    const step = steps[orderingStepIndex];
    if (!step) return null;
    return (
      <span className="flex items-center gap-1">
        <span aria-hidden>{step.emoji}</span>
        <span>{step.label}</span>
      </span>
    );
  }

  if (customer.status === "served") {
    return "냠냠 😋";
  }

  if (customer.status === "order_confirmed") {
    return null; // 주문서는 상단 레일에 있으니 손님 앞에 다시 띄우지 않는다
  }

  return "...";
}
