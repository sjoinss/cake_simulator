import { sounds } from "@/lib/sound";
import { useMountSound } from "@/hooks/useMountSound";
import type { DayProgress } from "@/lib/gameState";

type DayEndCardProps = {
  day: number;
  today: DayProgress;
  onNextDay: () => void;
  onOpenShop: () => void; // 다음 날 전에 재료·장비 사기
};

// 하루 마감 결산: 오늘 손님을 다 서빙하고 가게가 비면 뜬다. 다음 날을 누르면 날짜가 넘어가고 손님을 다시 받는다.
export function DayEndCard({ day, today, onNextDay, onOpenShop }: DayEndCardProps) {
  useMountSound(sounds.dayEnd);
  const averageScore = today.served > 0 ? Math.round(today.scoreTotal / today.served) : 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-4 short:p-2">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-end-title"
        className="animate-result-pop flex w-80 max-w-full flex-col items-center gap-4 rounded-2xl bg-[#fff8ef] p-6 text-center text-[var(--theme-text)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] short:gap-2 short:p-4"
      >
        <h2 id="day-end-title" className="text-2xl font-extrabold short:text-xl">
          DAY {day} 마감
        </h2>
        <dl className="grid w-full grid-cols-3 gap-2">
          <div className="flex flex-col gap-0.5 rounded-xl bg-white/80 py-2">
            <dt className="text-xs text-[var(--theme-text)]/60">손님</dt>
            <dd className="text-xl font-extrabold tabular-nums short:text-lg">{today.served}명</dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-white/80 py-2">
            <dt className="text-xs text-[var(--theme-text)]/60">번 돈</dt>
            <dd className="text-xl font-extrabold text-[var(--theme-accent)] tabular-nums short:text-lg">
              ${today.money}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-white/80 py-2">
            <dt className="text-xs text-[var(--theme-text)]/60">평균 점수</dt>
            <dd className="text-xl font-extrabold tabular-nums short:text-lg">{averageScore}%</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={onOpenShop}
          className="-mb-2 w-full rounded-full bg-white px-6 py-2 text-sm font-bold shadow-sm transition-transform active:scale-95 short:-mb-1 short:py-1"
        >
          🛒 상점 들르기
        </button>
        <button
          type="button"
          autoFocus
          onClick={onNextDay}
          className="w-full rounded-full bg-[var(--theme-accent)] px-6 py-2.5 text-base font-bold text-white shadow-sm transition-transform active:scale-95 short:py-1.5"
        >
          DAY {day + 1} 시작
        </button>
      </section>
    </div>
  );
}
