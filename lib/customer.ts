import type { CreamAmount, Customer, MaterialCategory, MaterialRegistry } from './gameState';
import { CUSTOMER_LOOK_COUNT } from './assets';
import { getUnlockedMaterials } from './materials';
import { TOPPING_COUNT_MAX, TOPPING_COUNT_MIN, TOPPING_COUNT_RANK } from './progress';

// 손님은 이름 없이 주문 번호(#N)로만 구분한다. 주문은 지금 선반에 있는 재료(기본 + 커스텀)에서 무작위로 조합한다.
// 손님 종류(취향/성격) 다양화는 Phase 3 (14장).
const CREAM_AMOUNTS: CreamAmount[] = ['light', 'normal', 'heavy'];

const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

let nextCustomerSeq = 0;

export function createCustomer(
  tableIndex: number,
  materials: MaterialRegistry,
  owned: readonly string[],
  rank: number,
): Customer {
  nextCustomerSeq += 1;
  const pickMaterial = (category: MaterialCategory) => pick(getUnlockedMaterials(materials, category, owned)).id;

  return {
    id: `customer_${Date.now()}_${nextCustomerSeq}`,
    tableIndex,
    patience: 100,
    basePatienceMultiplier: 1.0, // Phase 1 고정, Phase 3에서 손님별 성격치로 확장
    status: 'waiting',
    orderNumber: null,
    look: Math.floor(Math.random() * CUSTOMER_LOOK_COUNT),
    orderedAt: null,
    order: {
      cake: pickMaterial('base'),
      filling: pickMaterial('filling'),
      frosting: pickMaterial('cream'),
      creamAmount: pick(CREAM_AMOUNTS),
      topping: pickMaterial('topping'),
      // 랭크가 오르면 토핑 개수까지 맞춰야 한다
      ...(rank >= TOPPING_COUNT_RANK && {
        toppingCount: TOPPING_COUNT_MIN + Math.floor(Math.random() * (TOPPING_COUNT_MAX - TOPPING_COUNT_MIN + 1)),
      }),
    },
  };
}
