import type { ReactNode } from "react";
import type { CakeData, Customer } from "@/lib/gameState";
import { initialMaterials } from "@/lib/materials";
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
  return (
    <section
      aria-label="손님 공간"
      className="flex flex-1 basis-3/5 items-end justify-around gap-2 overflow-hidden bg-[linear-gradient(180deg,var(--theme-primary)_0%,var(--theme-background)_70%)] px-3 pb-4"
    >
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
            bubble={getBubbleContent(customer, orderingCustomerId, orderingStepIndex)}
            shouldAnimateEntrance={!!customer && justArrivedIds.has(customer.id)}
            onTap={() => onCustomerTap(index)}
            orderTag={customer?.orderNumber != null ? formatOrderNumber(customer.orderNumber) : null}
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
    return null; // 주문서는 상단 레일에 있으니 손님 앞에 다시 띄우지 않는다
  }

  return "...";
}
