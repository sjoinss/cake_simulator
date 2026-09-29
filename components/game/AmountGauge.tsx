import { AMOUNT_BAND } from "@/lib/gameLogic";

export type GaugeMark = { label: string; value: number };

type AmountGaugeProps = {
  value: number;
  max: number;
  label: string; // 스크린리더용 이름 (예: "부은 반죽 양")
  // 목표 눈금. 하나면 그 적정량 ±10%를 초록 띠로, 여러 개면(크림 조금/보통/듬뿍) 눈금선으로 그린다.
  // 케이크가 주문과 묶여 있지 않아서 크림은 목표를 하나로 정할 수 없다 — 주문서를 보고 맞출 눈금을 고른다.
  marks: GaugeMark[];
};

const nearMark = (value: number, mark: number) => Math.abs(value - mark) <= mark * AMOUNT_BAND;

// 세로로 차오르는 양 게이지 (반죽/필링/크림 공용).
export function AmountGauge({ value, max, label, marks }: AmountGaugeProps) {
  const fillPercent = Math.min(100, (value / max) * 100);
  const isSingle = marks.length === 1;
  const values = marks.map((mark) => mark.value);
  const matched = marks.find((mark) => nearMark(value, mark.value));
  const isOver = value > Math.max(...values) * (1 + AMOUNT_BAND);
  const stateText = matched
    ? isSingle
      ? "딱 좋아요"
      : `${matched.label} 정도`
    : value < Math.min(...values) * (1 - AMOUNT_BAND)
      ? "부족해요"
      : isOver
        ? "너무 많아요"
        : "사이예요";

  return (
    <div data-tutorial="gauge" className="flex h-full max-h-56 min-h-28 shrink-0 flex-col items-center gap-1.5 py-1 short:gap-1">
      <span className="text-xs font-bold whitespace-nowrap text-[var(--theme-text)] short:text-[10px]">
        {isSingle ? (
          <>
            목표: <span className="text-[var(--theme-accent)]">{marks[0].label}</span>
          </>
        ) : (
          "양"
        )}
      </span>
      <div className="relative flex flex-1 items-stretch">
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={Math.round(max)}
          aria-valuenow={Math.round(value)}
          aria-valuetext={stateText}
          className="relative w-8 overflow-hidden rounded-full border-2 border-white bg-white/50 shadow-inner short:w-6"
        >
          {isSingle && (
            <div
              className="absolute inset-x-0 bg-emerald-300/70"
              style={{
                bottom: `${(marks[0].value * (1 - AMOUNT_BAND) * 100) / max}%`,
                height: `${(marks[0].value * 2 * AMOUNT_BAND * 100) / max}%`,
              }}
              aria-hidden
            />
          )}
          <div
            className={`absolute inset-x-1 bottom-0 rounded-full ${
              isOver ? "bg-red-400" : "bg-amber-300 shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]"
            }`}
            style={{ height: `${fillPercent}%` }}
            aria-hidden
          />
          {!isSingle &&
            marks.map((mark) => (
              <div
                key={mark.label}
                aria-hidden
                className="absolute inset-x-0 h-0.5 bg-emerald-500/80"
                style={{ bottom: `${(mark.value * 100) / max}%` }}
              />
            ))}
        </div>
        {/* 여러 눈금일 때 눈금 이름을 게이지 오른쪽에 */}
        {!isSingle &&
          marks.map((mark) => (
            <span
              key={mark.label}
              aria-hidden
              className="absolute left-full ml-1 translate-y-1/2 text-[10px] font-bold whitespace-nowrap text-emerald-700"
              style={{ bottom: `${(mark.value * 100) / max}%` }}
            >
              {mark.label}
            </span>
          ))}
      </div>
      <span className="text-xs font-bold whitespace-nowrap text-[var(--theme-text)]/70 short:text-[10px]">
        {stateText}
      </span>
    </div>
  );
}
