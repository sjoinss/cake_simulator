import type { Customer, MaterialRegistry } from './gameState';
import { CREAM_AMOUNT_LABEL } from './frosting';
import { findMaterial } from './materials';

export type OrderStep = {
  emoji: string;
  label: string;
  badge?: string; // 이모지만 보여주는 좁은 곳(주문서 티켓 등)에서도 꼭 보여야 하는 짧은 글자 (예: 크림 양)
};

// 손님 주문(Customer.order)을 말풍선에 하나씩 순차 표시할 단계 목록으로 변환한다.
export function getOrderSteps(order: Customer['order'], materials: MaterialRegistry): OrderStep[] {
  const steps: OrderStep[] = [];

  const cake = findMaterial(materials, order.cake);
  if (cake) steps.push({ emoji: cake.emoji, label: cake.name });

  const filling = findMaterial(materials, order.filling);
  // 필링 재료는 토핑과 이모지가 겹칠 수 있어(딸기잼/딸기) 티켓에서 구분되도록 배지를 붙인다
  if (filling) steps.push({ emoji: filling.emoji, label: `${filling.name} 필링`, badge: '필링' });

  const frosting = findMaterial(materials, order.frosting);
  if (frosting) {
    const amount = CREAM_AMOUNT_LABEL[order.creamAmount];
    steps.push({ emoji: frosting.emoji, label: `${frosting.name} ${amount}`, badge: amount });
  }

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
