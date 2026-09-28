import { AMOUNT_BAND } from "@/lib/gameLogic";

type AmountGaugeProps = {
  value: number;
  target: number;
  max: number;
  label: string; // 스크린리더용 이름 (예: "부은 반죽 양")
  targetLabel: string; // 게이지 위에 보이는 목표 (예: "적정량", "듬뿍")
};

// 세로로 차오르는 양 게이지 (반죽/필링/크림 공용). 초록 띠 = 적정량 ±10%, 넘치면 빨갛게 변한다.
export function AmountGauge({ value, target, max, label, targetLabel }: AmountGaugeProps) {
  const fillPercent = Math.min(100, (value / max) * 100);
  const bandLow = (target * (1 - AMOUNT_BAND) * 100) / max;
  const bandHigh = (target * (1 + AMOUNT_BAND) * 100) / max;
  const state = value < target * (1 - AMOUNT_BAND) ? "low" : value > target * (1 + AMOUNT_BAND) ? "over" : "ok";
  const stateText = { low: "부족해요", ok: "딱 좋아요", over: "너무 많아요" }[state];

  return (
    <div className="flex h-full max-h-56 min-h-28 shrink-0 flex-col items-center gap-1.5 py-1 short:gap-1">
      <span className="text-xs font-bold whitespace-nowrap text-[var(--theme-text)] short:text-[10px]">
        목표: <span className="text-[var(--theme-accent)]">{targetLabel}</span>
      </span>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.round(max)}
        aria-valuenow={Math.round(value)}
        aria-valuetext={stateText}
        className="relative w-8 flex-1 overflow-hidden rounded-full border-2 border-white bg-white/50 shadow-inner short:w-6"
      >
        <div
          className="absolute inset-x-0 bg-emerald-300/70"
          style={{ bottom: `${bandLow}%`, height: `${bandHigh - bandLow}%` }}
          aria-hidden
        />
        <div
          className={`absolute inset-x-1 bottom-0 rounded-full ${
            state === "over" ? "bg-red-400" : "bg-amber-300 shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]"
          }`}
          style={{ height: `${fillPercent}%` }}
          aria-hidden
        />
      </div>
      <span className="text-xs font-bold whitespace-nowrap text-[var(--theme-text)]/70 short:text-[10px]">{stateText}</span>
    </div>
  );
}
