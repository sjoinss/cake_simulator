type HUDProps = {
  day: number;
  money: number;
};

export function HUD({ day, money }: HUDProps) {
  return (
    <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 bg-[var(--theme-secondary)] px-4 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
      <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-base font-bold tracking-wide text-[var(--theme-text)] shadow-sm">
        <span aria-hidden>📅</span> DAY {day}
      </span>
      <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-base font-bold tracking-wide text-[var(--theme-text)] shadow-sm">
        <span aria-hidden>💰</span> ${money.toLocaleString()}
      </span>
    </header>
  );
}
