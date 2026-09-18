import type { Customer } from './gameState';

// Phase 1: 손님 종류 1~2명만 하드코딩 (cake-tycoon-prompt.md 14장).
// 주문에 쓰인 재료 id는 lib/materials.ts의 초기 재료와 맞춰뒀다.
type CustomerTemplate = {
  name: string;
  order: Customer['order'];
};

const customerPool: CustomerTemplate[] = [
  {
    name: '미나',
    order: { cake: 'base_vanilla', frosting: 'cream_vanilla', topping: 'topping_strawberry' },
  },
  {
    name: '준호',
    order: { cake: 'base_vanilla', frosting: 'cream_vanilla', topping: 'topping_strawberry', message: 'Happy Birthday' },
  },
];

let nextCustomerSeq = 0;

export function createCustomer(tableIndex: number): Customer {
  const template = customerPool[nextCustomerSeq % customerPool.length];
  nextCustomerSeq += 1;

  return {
    id: `customer_${Date.now()}_${nextCustomerSeq}`,
    name: template.name,
    tableIndex,
    patience: 100,
    basePatienceMultiplier: 1.0, // Phase 1 고정, Phase 3에서 손님별 성격치로 확장
    status: 'waiting',
    starCount: 0,
    order: template.order,
  };
}
