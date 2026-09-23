import type { Customer, MaterialRegistry } from './gameState';
import { findMaterial } from './materials';

export type OrderStep = {
  emoji: string;
  label: string;
};

// 손님 주문(Customer.order)을 말풍선에 하나씩 순차 표시할 단계 목록으로 변환한다.
export function getOrderSteps(order: Customer['order'], materials: MaterialRegistry): OrderStep[] {
  const steps: OrderStep[] = [];

  const cake = findMaterial(materials, order.cake);
  if (cake) steps.push({ emoji: cake.emoji, label: cake.name });

  const frosting = findMaterial(materials, order.frosting);
  if (frosting) steps.push({ emoji: frosting.emoji, label: frosting.name });

  const topping = findMaterial(materials, order.topping);
  if (topping) steps.push({ emoji: topping.emoji, label: topping.name });

  if (order.decoration) {
    const decoration = findMaterial(materials, order.decoration);
    if (decoration) steps.push({ emoji: decoration.emoji, label: decoration.name });
  }

  if (order.message) {
    steps.push({ emoji: '💌', label: order.message });
  }

  return steps;
}
