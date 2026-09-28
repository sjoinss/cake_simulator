import type { ServeResultCard as ServeResultCardData } from "@/hooks/useGameState";
import { CakeSnapshot } from "@/components/game/cake/CakeSnapshot";
import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";
import { useIsShort } from "@/hooks/useIsShort";
import { formatOrderNumber } from "@/lib/station";

type ServeResultCardProps = {
  result: ServeResultCardData;
  onClose: () => void;
};

const SCORE_ROWS: { key: "accuracy" | "quality" | "speed"; label: string }[] = [
  { key: "accuracy", label: "주문 정확도" },
  { key: "quality", label: "제작 품질" },
  { key: "speed", label: "속도" },
];

// 서빙 직후 뜨는 Papa's 스타일 결과 카드 (cake-tycoon-prompt.md 12장 결과 화면 형태, 17장 10번).
// 매장 화면 위에 겹쳐 띄우므로 뒤에서 손님이 먹고 퇴장하는 흐름은 그대로 진행된다.
export function ServeResultCard({ result, onClose }: ServeResultCardProps) {
  const materialRegistry = useMaterialRegistry();
  const isShort = useIsShort();
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/25 p-4 short:p-2">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="serve-result-title"
        className="animate-result-pop flex max-h-full w-96 max-w-full flex-col gap-3 overflow-y-auto rounded-2xl bg-white p-5 text-[var(--theme-text)] shadow-[0_8px_24px_rgba(0,0,0,0.2)] short:gap-1.5 short:p-3"
      >
        <div className="text-center">
          <h2 id="serve-result-title" className="text-xl font-extrabold tracking-wide short:text-base">
            CAKE COMPLETE!
          </h2>
          <p className="text-sm opacity-70 short:text-xs">
            {result.orderNumber != null ? `${formatOrderNumber(result.orderNumber)} 주문` : "손님의 케이크"}
          </p>
        </div>

        {/* 가로 모드 폰은 세로 공간이 좁아서 케이크를 점수표 옆에 둔다 */}
        <div className="flex items-center gap-4">
          <CakeSnapshot
            cake={result.cake}
            materials={materialRegistry}
            size={isShort ? 72 : 96}
            label="서빙한 케이크"
          />
          <dl className="flex flex-1 flex-col gap-1.5 text-base short:gap-0.5 short:text-sm">
            {SCORE_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-4">
                <dt>{row.label}</dt>
                <dd className="font-bold tabular-nums">{result[row.key]}%</dd>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between gap-4 border-t border-black/10 pt-2 text-lg short:pt-1 short:text-base">
              <dt className="font-extrabold">TOTAL</dt>
              <dd className="font-extrabold tabular-nums">{result.total}%</dd>
            </div>
          </dl>
        </div>

        {/* 짧은 화면에선 금액과 확인 버튼을 한 줄에 둔다 */}
        <div className="flex flex-col gap-3 short:flex-row short:items-center short:justify-between short:gap-2">
          <p className="text-center text-2xl font-extrabold text-[var(--theme-accent)] short:text-lg">
            + ${result.money}
            {result.tip > 0 && (
              <span className="ml-2 align-middle text-sm font-bold text-[var(--theme-text)]/70 short:text-xs">
                데코 팁 +${result.tip}
              </span>
            )}
          </p>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="rounded-full bg-[var(--theme-accent)] px-6 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95 short:py-1 short:text-sm"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
