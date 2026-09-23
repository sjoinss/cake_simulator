import type { ReactNode } from "react";
import type { ActiveOrder, Customer } from "@/lib/gameState";
import { initialMaterials } from "@/lib/materials";
import { getOrderSteps } from "@/lib/order";
import { CustomerTable } from "./CustomerTable";

type CustomerSideProps = {
  tables: (Customer | null)[];
  activeOrders: ActiveOrder[];
  orderingCustomerId: string | null;
  orderingStepIndex: number;
  justArrivedIds: ReadonlySet<string>;
  servedCakes: Readonly<Record<string, ActiveOrder["cake"]>>;
  leavingIds: ReadonlySet<string>;
  draggingCustomerId: string | null; // 지금 드래그 중인 케이크의 주인
  hoverTableIndex: number | null; // 드래그 중인 케이크가 올라가 있는 테이블
  onCustomerTap: (tableIndex: number) => void;
  onStartOrResumeOrder: (customerId: string) => void;
};

export function CustomerSide({
  tables,
  activeOrders,
  orderingCustomerId,
  orderingStepIndex,
  justArrivedIds,
  servedCakes,
  leavingIds,
  draggingCustomerId,
  hoverTableIndex,
  onCustomerTap,
  onStartOrResumeOrder,
}: CustomerSideProps) {
  return (
    <section
      aria-label="손님 공간"
      className="flex flex-1 basis-3/5 items-end justify-around gap-2 overflow-hidden bg-[linear-gradient(180deg,var(--theme-primary)_0%,var(--theme-background)_70%)] px-3 pb-4"
    >
      {tables.map((customer, index) => {
        // 주문이 확정된 손님만 "만들기"/"이어 만들기" 버튼을 보여준다 (cake-tycoon-prompt.md 17장 5번).
        const activeOrder = customer ? activeOrders.find((order) => order.customerId === customer.id) : undefined;
        const isAwaitingServe = activeOrder?.stage === "ready";
        const canMake =
          !!customer && customer.status === "order_confirmed" && orderingCustomerId !== customer.id && !isAwaitingServe;
        const isDragTarget = !!customer && customer.id === draggingCustomerId;
        const dropState = isDragTarget ? "target" : customer && hoverTableIndex === index ? "hover" : null;

        return (
          <CustomerTable
            key={index}
            tableIndex={index}
            customer={customer}
            bubble={getBubbleContent(customer, orderingCustomerId, orderingStepIndex)}
            shouldAnimateEntrance={!!customer && justArrivedIds.has(customer.id)}
            onTap={() => onCustomerTap(index)}
            makeButtonLabel={canMake ? (activeOrder ? "이어 만들기" : "만들기") : null}
            onMakeClick={customer ? () => onStartOrResumeOrder(customer.id) : undefined}
            isAwaitingServe={isAwaitingServe}
            servedCake={customer ? (servedCakes[customer.id] ?? null) : null}
            isLeaving={!!customer && leavingIds.has(customer.id)}
            dropState={dropState}
          />
        );
      })}
    </section>
  );
}

// 손님 상태(대기/순차 주문/확정)에 따라 말풍선에 보여줄 내용을 계산한다.
function getBubbleContent(
  customer: Customer | null,
  orderingCustomerId: string | null,
  orderingStepIndex: number,
): ReactNode | null {
  if (!customer) return null;

  const steps = getOrderSteps(customer.order, initialMaterials);

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
    return (
      <span aria-hidden className="tracking-wide">
        {steps.map((step) => step.emoji).join(" ")}
      </span>
    );
  }

  return "...";
}
