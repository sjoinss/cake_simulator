import type { Material, MaterialRegistry } from './gameState';

// Phase 1: 카테고리별 재료 1개씩만 존재 (cake-tycoon-prompt.md 13-2 튜토리얼 구간).
// 커스텀 재료 추가는 나중에 이 레지스트리에 push하는 방식으로 동일하게 처리된다.
export const initialMaterials: MaterialRegistry = {
  base: [
    { id: 'base_vanilla', category: 'base', name: '바닐라 시트', color: '#f5e6c8', emoji: '🍰', isCustom: false, unlockRank: 0 },
  ],
  cream: [
    { id: 'cream_vanilla', category: 'cream', name: '바닐라 크림', color: '#fffaf0', emoji: '🍦', isCustom: false, unlockRank: 0 },
  ],
  filling: [
    { id: 'filling_strawberry', category: 'filling', name: '딸기잼', color: '#ff6f91', emoji: '🍓', isCustom: false, unlockRank: 0 },
  ],
  topping: [
    { id: 'topping_strawberry', category: 'topping', name: '딸기', color: '#ff4d6d', emoji: '🍓', isCustom: false, unlockRank: 0 },
  ],
  decoration: [],
};

export function getUnlockedMaterials(registry: MaterialRegistry, category: keyof MaterialRegistry, rank: number): Material[] {
  return registry[category].filter((material) => material.unlockRank <= rank);
}

export function findMaterial(registry: MaterialRegistry, id: string): Material | undefined {
  for (const category of Object.keys(registry) as (keyof MaterialRegistry)[]) {
    const found = registry[category].find((material) => material.id === id);
    if (found) return found;
  }
  return undefined;
}
