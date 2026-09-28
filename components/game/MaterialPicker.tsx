import type { Material } from "@/lib/gameState";

export type MaterialContainer = "jar" | "bag" | "bowl";

type MaterialPickerProps = {
  materials: Material[];
  selectedId: string | null;
  label: string; // 스크린리더용 그룹 이름 (예: "시트 재료")
  container: MaterialContainer; // 재료가 담긴 모양: 잼 병 / 짤주머니 / 그릇
  locked?: boolean; // 이미 넣기 시작해서 재료를 바꿀 수 없는 상태
  onSelect: (materialId: string) => void;
};

// 재료 선반. 모든 재료는 나중에 늘어난다는 전제라 개수와 상관없이 "먼저 고르고 → 넣는" 흐름을 쓴다 (8장).
// 내부적으로는 단일 선택이지만 체크박스처럼 보이지 않게, 재료가 담긴 병/짤주머니/그릇을 집어 드는 모양으로 보여준다.
export function MaterialPicker({ materials, selectedId, label, container, locked, onSelect }: MaterialPickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-end justify-center gap-3">
      {materials.map((material) => {
        const isSelected = material.id === selectedId;
        return (
          <button
            key={material.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={material.name}
            onClick={() => onSelect(material.id)}
            disabled={locked && !isSelected}
            className={`group flex flex-col items-center gap-1 border-0 bg-transparent p-0 transition-transform duration-150 disabled:opacity-40 ${
              isSelected ? "-translate-y-1.5" : "hover:-translate-y-0.5 active:scale-95"
            }`}
          >
            <span
              className={`relative flex items-end justify-center rounded-full p-1 transition-shadow ${
                isSelected ? "bg-white/70 shadow-[0_0_0_3px_var(--theme-accent),0_6px_10px_rgba(0,0,0,0.15)]" : ""
              }`}
            >
              {container === "jar" && <Jar material={material} />}
              {container === "bag" && <PipingBag material={material} />}
              {container === "bowl" && <Bowl material={material} />}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap shadow-sm ${
                isSelected ? "bg-[var(--theme-accent)] text-white" : "bg-white/80 text-[var(--theme-text)]"
              }`}
            >
              {material.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// 잼 병: 유리병 + 뚜껑 + 이모지 라벨
function Jar({ material }: { material: Material }) {
  return (
    <span aria-hidden className="relative flex h-14 w-11 flex-col items-center">
      <span className="h-2.5 w-9 rounded-t-md rounded-b-sm bg-[#d9a066] shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)]" />
      <span className="relative h-11 w-11 overflow-hidden rounded-b-xl rounded-t-md border-2 border-white/90 bg-white/40 shadow-[inset_2px_0_0_rgba(255,255,255,0.7)]">
        <span className="absolute inset-x-0 bottom-0 h-[78%]" style={{ backgroundColor: material.color }} />
        <span className="absolute top-1/2 left-1/2 flex h-5 w-6 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-sm bg-white/90 text-xs leading-none">
          {material.emoji}
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
        className="h-11 w-11 border-white"
        style={{
          backgroundColor: material.color,
          clipPath: "polygon(0 0, 100% 0, 62% 100%, 38% 100%)",
          boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.08)",
        }}
      />
      <span className="h-3 w-2.5 bg-[#b8c0c8]" style={{ clipPath: "polygon(0 0, 100% 0, 70% 100%, 30% 100%)" }} />
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-sm leading-none">{material.emoji}</span>
    </span>
  );
}

// 그릇: 반죽이나 토핑이 소복이 담긴 볼
function Bowl({ material }: { material: Material }) {
  return (
    <span aria-hidden className="relative flex h-14 w-14 flex-col items-center justify-end">
      <span className="absolute top-1 text-xl leading-none">{material.emoji}</span>
      <span className="relative h-3 w-14 rounded-[50%]" style={{ backgroundColor: material.color }} />
      <span className="-mt-1.5 h-7 w-14 rounded-b-full bg-[#eef1f4] shadow-[inset_0_-4px_0_rgba(0,0,0,0.08),0_3px_4px_rgba(0,0,0,0.12)]" />
    </span>
  );
}
