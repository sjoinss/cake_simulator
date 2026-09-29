import type { Material, MaterialCategory, MaterialRegistry } from './gameState';
import { isMaterialOwned } from './progress';

// 기본 재료 (8장). 이모지는 윈도우 10에서도 보이는 것만 쓴다 (🫐 등 최신 이모지 제외).
const builtInMaterials: MaterialRegistry = {
  base: [
    {
      id: 'base_vanilla',
      category: 'base',
      name: '바닐라 시트',
      color: '#f5e6c8',
      emoji: '🍰',
      isCustom: false,
      unlockRank: 0,
    },
    {
      id: 'base_chocolate',
      category: 'base',
      name: '초코 시트',
      color: '#6b4432',
      emoji: '🍫',
      isCustom: false,
      unlockRank: 2,
    },
    {
      id: 'base_matcha',
      category: 'base',
      name: '말차 시트',
      color: '#b7c98a',
      emoji: '🍵',
      isCustom: false,
      unlockRank: 6,
    },
    {
      id: 'base_strawberry',
      category: 'base',
      name: '딸기 시트',
      color: '#f4b6c2',
      emoji: '🍓',
      isCustom: false,
      unlockRank: 4,
    },
  ],
  cream: [
    {
      id: 'cream_vanilla',
      category: 'cream',
      name: '바닐라 크림',
      color: '#fffaf0',
      emoji: '🍦',
      image: '/images/assets/creams/vanilla.png',
      isCustom: false,
      unlockRank: 0,
    },
    {
      id: 'cream_chocolate',
      category: 'cream',
      name: '초코 크림',
      color: '#8a5a44',
      emoji: '🍫',
      image: '/images/assets/creams/chocolate.png',
      isCustom: false,
      unlockRank: 3,
    },
    {
      id: 'cream_strawberry',
      category: 'cream',
      name: '딸기 크림',
      color: '#f9c9d4',
      emoji: '🍓',
      image: '/images/assets/creams/strawberry.png',
      isCustom: false,
      unlockRank: 5,
    },
    {
      id: 'cream_matcha',
      category: 'cream',
      name: '말차 크림',
      color: '#cfe0b0',
      emoji: '🍵',
      image: '/images/assets/creams/matcha.png',
      isCustom: false,
      unlockRank: 7,
    },
  ],
  filling: [
    {
      id: 'filling_strawberry',
      category: 'filling',
      name: '딸기잼',
      color: '#e8506a',
      emoji: '🍓',
      isCustom: false,
      unlockRank: 0,
    },
    {
      id: 'filling_chocolate',
      category: 'filling',
      name: '초코 가나슈',
      color: '#5a3a2a',
      emoji: '🍫',
      isCustom: false,
      unlockRank: 5,
    },
    {
      id: 'filling_custard',
      category: 'filling',
      name: '커스터드',
      color: '#f3d27a',
      emoji: '🍮',
      isCustom: false,
      unlockRank: 3,
    },
    {
      id: 'filling_lemon',
      category: 'filling',
      name: '레몬커드',
      color: '#f5e26a',
      emoji: '🍋',
      isCustom: false,
      unlockRank: 7,
    },
  ],
  topping: [
    {
      id: 'topping_strawberry',
      category: 'topping',
      name: '딸기',
      color: '#ff4d6d',
      emoji: '🍓',
      icon: '/images/assets/toppings/strawberry.png',
      isCustom: false,
      unlockRank: 0,
    },
    {
      id: 'topping_cherry',
      category: 'topping',
      name: '체리',
      color: '#c8102e',
      emoji: '🍒',
      icon: '/images/assets/toppings/cherry.png',
      isCustom: false,
      unlockRank: 4,
    },
    {
      id: 'topping_chocochip',
      category: 'topping',
      name: '초코칩',
      color: '#5a3a2a',
      emoji: '🍫',
      icon: '/images/assets/toppings/chocochip.png',
      isCustom: false,
      unlockRank: 2,
    },
    {
      id: 'topping_kiwi',
      category: 'topping',
      name: '키위',
      color: '#8cc63f',
      emoji: '🥝',
      icon: '/images/assets/toppings/kiwi.png',
      isCustom: false,
      unlockRank: 6,
    },
    // 랭크 8 이후 후반 해금 (그림 에셋으로 추가). 이모지는 그림이 안 뜰 때 대신 쓰는 것
    {
      id: 'topping_blueberry',
      category: 'topping',
      name: '블루베리',
      color: '#4f6fd0',
      emoji: '🔵',
      icon: '/images/assets/toppings/blueberry.png',
      isCustom: false,
      unlockRank: 8,
    },
    {
      id: 'topping_raspberry',
      category: 'topping',
      name: '라즈베리',
      color: '#e94a6f',
      emoji: '🍓',
      icon: '/images/assets/toppings/raspberry.png',
      isCustom: false,
      unlockRank: 8,
    },
    {
      id: 'topping_green_grape',
      category: 'topping',
      name: '청포도',
      color: '#9fd356',
      emoji: '🍇',
      icon: '/images/assets/toppings/green_grape.png',
      isCustom: false,
      unlockRank: 9,
    },
    {
      id: 'topping_peach',
      category: 'topping',
      name: '복숭아',
      color: '#ffb38a',
      emoji: '🍑',
      icon: '/images/assets/toppings/peach.png',
      isCustom: false,
      unlockRank: 9,
    },
    {
      id: 'topping_mango',
      category: 'topping',
      name: '망고',
      color: '#ffc93c',
      emoji: '🟨',
      icon: '/images/assets/toppings/mango.png',
      isCustom: false,
      unlockRank: 10,
    },
    {
      id: 'topping_marshmallow',
      category: 'topping',
      name: '마시멜로',
      color: '#f7d6e0',
      emoji: '☁️',
      icon: '/images/assets/toppings/marshmallow.png',
      isCustom: false,
      unlockRank: 10,
    },
  ],
  decoration: [],
};

// 커스텀 재료 (8장 "커스텀 재료 추가는 이 레지스트리에 push"). 플레이어가 가게 꾸미기 창에서 만든다.
// 지운 재료도 retired로 남겨 둔다 — 이미 받은 주문이나 만들던 케이크가 그 재료를 가리키고 있을 수 있어서.
// 선반·새 주문에는 retired가 아닌 재료만 나온다.
export type CustomMaterialCategory = Exclude<MaterialCategory, 'decoration'>;
const CUSTOM_KEY = 'cake-tycoon.customMaterials';

let customMaterials: Material[] = [];
let registry: MaterialRegistry = builtInMaterials;
const listeners = new Set<() => void>();

function rebuild() {
  const next = { ...builtInMaterials };
  for (const category of Object.keys(next) as MaterialCategory[]) {
    const extra = customMaterials.filter((material) => material.category === category);
    if (extra.length > 0) next[category] = [...next[category], ...extra];
  }
  registry = next;
}

function loadCustomMaterials() {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) customMaterials = parsed.filter(isMaterial);
  } catch {
    customMaterials = [];
  }
  rebuild();
}

function isMaterial(value: unknown): value is Material {
  const material = value as Material;
  return (
    typeof material?.id === 'string' &&
    typeof material.name === 'string' &&
    typeof material.color === 'string' &&
    typeof material.emoji === 'string' &&
    ['base', 'cream', 'filling', 'topping'].includes(material.category)
  );
}

function commit(next: Material[]) {
  customMaterials = next;
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customMaterials));
  } catch {
    // 저장소가 막혀 있어도 이번 판에서는 쓸 수 있게 둔다
  }
  rebuild();
  listeners.forEach((listener) => listener());
}

if (typeof window !== 'undefined') loadCustomMaterials();

// 기본 + 커스텀 재료 전체. 재료가 바뀌면 새 객체가 되므로 useSyncExternalStore 스냅샷으로 쓸 수 있다.
export function getMaterialRegistry(): MaterialRegistry {
  return registry;
}

export function subscribeMaterials(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveCustomMaterials(): Material[] {
  return customMaterials.filter((material) => !material.retired);
}

export function addCustomMaterial(input: {
  category: CustomMaterialCategory;
  name: string;
  color: string;
  emoji: string;
}): Material {
  const material: Material = {
    id: `custom_${input.category}_${Date.now().toString(36)}`,
    category: input.category,
    name: input.name,
    color: input.color,
    emoji: input.emoji,
    isCustom: true,
    unlockRank: 0,
  };
  commit([...customMaterials, material]);
  return material;
}

export function removeCustomMaterial(id: string) {
  commit(customMaterials.map((material) => (material.id === id ? { ...material, retired: true } : material)));
}

// 선반에 올리고 새 주문에 쓸 수 있는 재료: 처음부터 가진 재료 + 상점에서 산 재료(owned = player.unlockedItems) + 커스텀 재료.
// 지운 커스텀 재료는 뺀다
export function getUnlockedMaterials(
  registry: MaterialRegistry,
  category: MaterialCategory,
  owned: readonly string[],
): Material[] {
  return registry[category].filter((material) => !material.retired && isMaterialOwned(material, owned));
}

export function findMaterial(registry: MaterialRegistry, id: string): Material | undefined {
  for (const category of Object.keys(registry) as MaterialCategory[]) {
    const found = registry[category].find((material) => material.id === id);
    if (found) return found;
  }
  return undefined;
}
