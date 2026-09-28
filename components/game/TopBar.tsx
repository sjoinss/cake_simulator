type TopBarProps = {
  day: number;
  money: number;
};

// 모든 화면 공통 상단 바: DAY / 돈. 주문서는 바 아래 오른쪽의 집게 레일(OrderClipRail)에 따로 걸린다.
export function TopBar({ day, money }: TopBarProps) {
  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center justify-between gap-3 bg-[var(--theme-secondary)] px-3 shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
      <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-base font-bold tracking-wide text-[var(--theme-text)] shadow-sm">
        <span aria-hidden>📅</span> DAY {day}
      </span>
      <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-base font-bold tracking-wide text-[var(--theme-text)] shadow-sm">
        <span aria-hidden>💰</span> ${money.toLocaleString()}
      </span>
    </header>
  );
}
