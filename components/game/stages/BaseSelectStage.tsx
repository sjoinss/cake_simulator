import type { ActiveOrder, MaterialRegistry } from "@/lib/gameState";
import { getUnlockedMaterials } from "@/lib/materials";
import { CakeRenderer } from "../cake/CakeRenderer";

type BaseSelectStageProps = {
  order: ActiveOrder;
  materials: MaterialRegistry;
  rank: number;
  onSelectBase: (materialId: string) => void;
  onNext: () => void;
};

// 시트 선택 단계. Phase 1은 카테고리별 재료가 1개뿐이라 사실상 확인만 하는 단계지만,
// 나중에 재료가 늘어나도 그대로 쓸 수 있도록 선택 UI 구조를 갖춰둔다.
export function BaseSelectStage({ order, materials, rank, onSelectBase, onNext }: BaseSelectStageProps) {
  const options = getUnlockedMaterials(materials, "base", rank);
  // 오븐에 넣은 뒤에는 시트를 바꿀 수 없다 (이미 구워진 케이크의 재료가 바뀌면 굽기 판정이 어긋남)
  const isBaked = order.cake.baking.startTime !== null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <CakeRenderer cake={order.cake} materials={materials} />

      <div className="flex flex-wrap justify-center gap-3">
        {options.map((material) => {
          const isSelected = order.cake.base === material.id;
          return (
            <button
              key={material.id}
              type="button"
              onClick={() => onSelectBase(material.id)}
              disabled={isBaked}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-4 py-3 shadow-sm transition-transform active:scale-95 disabled:opacity-60 disabled:active:scale-100 ${
                isSelected ? "border-[var(--theme-accent)] bg-white" : "border-transparent bg-white/70"
              }`}
            >
              <span className="text-3xl leading-none" aria-hidden>
                {material.emoji}
              </span>
              <span className="text-sm font-bold text-[var(--theme-text)]">{material.name}</span>
            </button>
          );
        })}
      </div>

      {isBaked && <p className="text-sm text-[var(--theme-text)]/70">이미 오븐에 넣어서 시트를 바꿀 수 없어요</p>}

      {order.cake.base && (
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-[var(--theme-accent)] px-6 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          다음 단계로 →
        </button>
      )}
    </div>
  );
}
