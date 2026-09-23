import type { ActiveOrder, MaterialRegistry } from "@/lib/gameState";
import { findMaterial } from "@/lib/materials";

type CakeRendererProps = {
  cake: ActiveOrder["cake"];
  materials: MaterialRegistry;
};

// 케이크의 현재 상태(시트/크림/토핑/데코)를 선언적으로 그리는 순수 렌더러.
// 항상 이 데이터만 보고 다시 그리므로, 저장/재현/undo가 쉬워진다 (cake-tycoon-prompt.md 16장).
export function CakeRenderer({ cake, materials }: CakeRendererProps) {
  const base = cake.base ? findMaterial(materials, cake.base) : undefined;
  const frostingMaterial = cake.filling ? findMaterial(materials, cake.filling) : undefined;

  return (
    <div
      className="relative aspect-square w-56 max-w-full rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.2)]"
      style={{ backgroundColor: base?.color ?? "#f2e9da" }}
    >
      {!base && (
        <span className="absolute inset-0 flex items-center justify-center text-sm text-[var(--theme-text)]/50">
          시트를 선택하세요
        </span>
      )}

      {cake.frosting.coverage > 0 && (
        <div
          className="absolute inset-2 rounded-full"
          style={{
            backgroundColor: frostingMaterial?.color ?? "#fffaf0",
            opacity: Math.min(cake.frosting.coverage / 100, 1),
          }}
          aria-hidden
        />
      )}

      {cake.toppings.map((topping, index) => {
        const material = findMaterial(materials, topping.itemId);
        if (!material) return null;
        return (
          <span
            key={index}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-2xl leading-none"
            style={{ left: `${topping.x}%`, top: `${topping.y}%` }}
            aria-hidden
          >
            {material.emoji}
          </span>
        );
      })}

    </div>
  );
}
