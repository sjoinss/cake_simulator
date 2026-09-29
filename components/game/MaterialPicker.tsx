import type { Material } from "@/lib/gameState";
import { withBasePath } from "@/lib/assets";
import { MaterialGlyph } from "./MaterialGlyph";
import { sounds } from "@/lib/sound";

export type MaterialContainer = "jar" | "bag" | "bowl";

type MaterialPickerProps = {
  materials: Material[];
  selectedId: string | null;
  label: string; // 스크린리더용 그룹 이름 (예: "시트 재료")
  container: MaterialContainer; // 그림이 없을 때 그릴 모양: 잼 병 / 짤주머니 / 그릇
  locked?: boolean; // 이미 넣기 시작해서 재료를 바꿀 수 없는 상태 (고르지 않은 재료는 흐리게)
  inactive?: boolean; // 작업할 케이크가 없는 상태 — 선반은 그대로 보여주되 누를 수만 없게 한다
  onSelect: (materialId: string) => void;
};

// 벽에 붙은 재료 선반. 모든 재료는 나중에 늘어난다는 전제라 개수와 상관없이 "먼저 고르고 → 넣는" 흐름을 쓴다 (8장).
// 내부적으로는 단일 선택(radiogroup)이지만, 고른 재료는 선반에서 살짝 떠오르는 것으로만 보여준다 (체크 표시·테두리 없음).
// 재료에 image가 있으면 그 그림을, 없으면 CSS로 그린 병/짤주머니/그릇 + 이모지를 올려둔다.
export function MaterialPicker({
  materials,
  selectedId,
  label,
  container,
  locked,
  inactive,
  onSelect,
}: MaterialPickerProps) {
  // 재료가 많아 화면 폭을 넘으면 선반을 옆으로 밀어서 본다. 위아래 여백(py-3, -my-3으로 상쇄)은
  // 스크롤 영역에 떠오른 재료와 선반 다리가 잘리지 않게 하기 위한 것.
  return (
    <div className="-my-3 max-w-full shrink-0 overflow-x-auto overscroll-x-contain py-3 [scrollbar-width:none]">
      <div className="relative mx-auto flex w-max flex-col items-center">
        <div
          role="radiogroup"
          aria-label={label}
          className="relative z-10 flex items-end gap-4 px-5 short:gap-2.5 short:px-3"
        >
          {materials.map((material) => {
            const isSelected = material.id === selectedId;
            return (
              <button
                key={material.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={material.name}
                title={material.name}
                onClick={() => {
                  sounds.pop();
                  onSelect(material.id);
                }}
                disabled={inactive || (locked && !isSelected)}
                className={`group relative flex h-16 w-14 items-end justify-center border-0 bg-transparent p-0 short:h-12 short:w-10 ${
                  locked && !isSelected ? "opacity-40" : ""
                }`}
              >
                {/* 선반 위 그림자: 떠오르면 작고 옅어진다 */}
                <span
                  aria-hidden
                  className={`absolute bottom-0 left-1/2 h-1.5 -translate-x-1/2 rounded-[50%] bg-black/25 blur-[1.5px] transition-all duration-200 ${
                    isSelected ? "w-6 opacity-40" : "w-10 opacity-100 short:w-7"
                  }`}
                />
                <span
                  className={`relative flex origin-bottom items-end justify-center transition-transform duration-200 ease-out short:scale-[0.72] ${
                    isSelected
                      ? "-translate-y-3 short:-translate-y-2"
                      : "group-hover:-translate-y-0.5 group-active:translate-y-0"
                  }`}
                >
                  <MaterialIcon material={material} container={container} />
                </span>
              </button>
            );
          })}
        </div>

        {/* 선반 판자 + 앞면에 붙은 이름표 */}
        <div aria-hidden className="relative -mt-0.5 w-full min-w-24">
          <div className="h-2 rounded-sm bg-[#d8a878] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.45)]" />
          <div className="h-1.5 rounded-b-sm bg-[#a8764c] shadow-[0_3px_5px_rgba(0,0,0,0.18)]" />
          <div className="absolute top-full left-3 h-2.5 w-1.5 bg-[#a8764c]" />
          <div className="absolute top-full right-3 h-2.5 w-1.5 bg-[#a8764c]" />
        </div>
        <div className="mt-0.5 flex gap-4 px-5 short:hidden">
          {materials.map((material) => (
            <span
              key={material.id}
              className={`w-14 truncate text-center text-[10px] font-bold ${
                material.id === selectedId ? "text-[var(--theme-accent)]" : "text-[var(--theme-text)]/70"
              }`}
            >
              {material.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// 선반에 놓이는 재료 한 개의 모습 (그림이 있으면 그림, 없으면 병/짤주머니/그릇). 상점 진열대에서도 쓴다
export function MaterialIcon({ material, container }: { material: Material; container: MaterialContainer }) {
  if (material.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 재료 그림은 작은 정적 에셋이라 next/image 최적화가 필요 없다
      <img src={withBasePath(material.image)} alt="" draggable={false} className="h-14 w-auto object-contain" />
    );
  }
  if (container === "jar") return <Jar material={material} />;
  if (container === "bag") return <PipingBag material={material} />;
  return <Bowl material={material} />;
}

// 잼 병: 유리병 + 뚜껑 + 이모지 라벨
function Jar({ material }: { material: Material }) {
  return (
    <span aria-hidden className="relative flex h-14 w-11 flex-col items-center">
      <span className="h-2.5 w-9 rounded-t-md rounded-b-sm bg-[#d9a066] shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]" />
      <span className="relative h-11 w-11 overflow-hidden rounded-t-md rounded-b-xl border-2 border-white/90 bg-white/40 shadow-[inset_2px_0_0_rgba(255,255,255,0.7)]">
        <span className="absolute inset-x-0 bottom-0 h-[78%]" style={{ backgroundColor: material.color }} />
        <span className="absolute top-1/2 left-1/2 flex h-5 w-6 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-sm bg-white/90 text-xs leading-none">
          <MaterialGlyph material={material} size={12} />
        </span>
      </span>
    </span>
  );
}

// 짤주머니: 아래로 뾰족한 주머니 + 금속 깍지, 안에 크림 색이 비친다
function PipingBag({ material }: { material: Material }) {
  return (
    <span aria-hidden className="relative flex h-14 w-11 flex-col items-center">
      <span
        className="h-11 w-11"
        style={{
          backgroundColor: material.color,
          clipPath: "polygon(0 0, 100% 0, 62% 100%, 38% 100%)",
          boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.08)",
        }}
      />
      <span className="h-3 w-2.5 bg-[#b8c0c8]" style={{ clipPath: "polygon(0 0, 100% 0, 70% 100%, 30% 100%)" }} />
      <span className="absolute top-1 left-1/2 -translate-x-1/2 leading-none">
        <MaterialGlyph material={material} size={14} />
      </span>
    </span>
  );
}

// 그릇: 반죽이나 토핑이 소복이 담긴 볼
function Bowl({ material }: { material: Material }) {
  return (
    <span aria-hidden className="relative flex h-14 w-14 flex-col items-center justify-end">
      <span className="absolute top-0.5 leading-none">
        <MaterialGlyph material={material} size={material.icon ? 26 : 20} />
      </span>
      <span className="relative h-3 w-14 rounded-[50%]" style={{ backgroundColor: material.color }} />
      <span className="-mt-1.5 h-7 w-14 rounded-b-full bg-[#eef1f4] shadow-[inset_0_-4px_0_rgba(0,0,0,0.08),0_3px_4px_rgba(0,0,0,0.12)]" />
    </span>
  );
}
