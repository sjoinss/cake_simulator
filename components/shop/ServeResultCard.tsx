import type { ServeResultCard as ServeResultCardData } from "@/hooks/useGameState";

type ServeResultCardProps = {
  result: ServeResultCardData;
  onClose: () => void;
};

const SCORE_ROWS: { key: "accuracy" | "quality" | "decoration" | "speed"; label: string }[] = [
  { key: "accuracy", label: "주문 정확도" },
  { key: "quality", label: "제작 품질" },
  { key: "decoration", label: "데코레이션" },
  { key: "speed", label: "속도" },
];

// 서빙 직후 뜨는 Papa's 스타일 결과 카드 (cake-tycoon-prompt.md 12장 결과 화면 형태, 17장 10번).
// 매장 화면 위에 겹쳐 띄우므로 뒤에서 손님이 먹고 퇴장하는 흐름은 그대로 진행된다.
export function ServeResultCard({ result, onClose }: ServeResultCardProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/25 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="serve-result-title"
        className="animate-result-pop flex w-72 max-w-full flex-col gap-3 rounded-2xl bg-white p-5 text-[var(--theme-text)] shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
      >
        <div className="text-center">
          <h2 id="serve-result-title" className="text-xl font-extrabold tracking-wide">
            CAKE COMPLETE!
          </h2>
          <p className="text-sm opacity-70">{result.customerName}님의 케이크</p>
        </div>

        <dl className="flex flex-col gap-1.5 text-base">
          {SCORE_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <dt>{row.label}</dt>
              <dd className="font-bold tabular-nums">{result[row.key]}%</dd>
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between gap-4 border-t border-black/10 pt-2 text-lg">
            <dt className="font-extrabold">TOTAL</dt>
            <dd className="font-extrabold tabular-nums">{result.total}%</dd>
          </div>
        </dl>

        <p className="text-center text-2xl font-extrabold text-[var(--theme-accent)]">+ ${result.money}</p>

        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="rounded-full bg-[var(--theme-accent)] px-6 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          확인
        </button>
      </div>
    </div>
  );
}
