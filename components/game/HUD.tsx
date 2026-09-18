type HUDProps = {
  day: number;
  money: number;
};

export function HUD({ day, money }: HUDProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--theme-accent)]/30 bg-[var(--theme-secondary)] px-4 py-2">
      <span className="text-sm font-bold tracking-wide">DAY {day}</span>
      <span className="text-sm font-bold tracking-wide">${money}</span>
    </header>
  );
}
