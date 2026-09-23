import type { Customer } from "@/lib/gameState";
import { initialMaterials } from "@/lib/materials";
import { getOrderSteps } from "@/lib/order";

type OrderTicketProps = {
  customer: Customer;
};

// 주문서 상시 노출 (cake-tycoon-prompt.md 1장: 모든 제작 단계에서 다시 확인할 수 있어야 한다)
export function OrderTicket({ customer }: OrderTicketProps) {
  const steps = getOrderSteps(customer.order, initialMaterials);

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 shadow-sm">
      <span className="text-sm font-bold text-[var(--theme-text)]">{customer.name}</span>
      <span className="flex items-center gap-1 text-base" aria-label="주문 내용">
        {steps.map((step) => (
          <span key={step.label} title={step.label} aria-hidden>
            {step.emoji}
          </span>
        ))}
      </span>
    </div>
  );
}
