import type { CreamAmount, Customer } from './gameState';

// Phase 1: 손님 종류 1~2명만 하드코딩 (cake-tycoon-prompt.md 14장).
// 주문에 쓰인 재료 id는 lib/materials.ts의 초기 재료와 맞춰뒀다.
type CustomerTemplate = {
  name: string;
  order: Omit<Customer['order'], 'creamAmount'>;
};

const customerPool: CustomerTemplate[] = [
  {
    name: '미나',
    order: { cake: 'base_vanilla', filling: 'filling_strawberry', frosting: 'cream_vanilla', topping: 'topping_strawberry' },
  },
  {
    name: '준호',
    order: {
      cake: 'base_vanilla',
      filling: 'filling_strawberry',
      frosting: 'cream_vanilla',
      topping: 'topping_strawberry',
      message: 'Happy Birthday',
    },
  },
];

// 손님이 2명뿐이라 매번 같은 주문이 되지 않도록 크림 양은 무작위로 정한다
const CREAM_AMOUNTS: CreamAmount[] = ['light', 'normal', 'heavy'];

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
    orderNumber: null,
    orderedAt: null,
    starCount: 0,
    order: { ...template.order, creamAmount: CREAM_AMOUNTS[Math.floor(Math.random() * CREAM_AMOUNTS.length)] },
  };
}
