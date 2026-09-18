import type { ActiveOrder } from "@/lib/gameState";

type CakeCounterProps = {
  cake: ActiveOrder | null; // 완성된 케이크가 올라오면 표시. Phase 1은 최대 1개
};

export function CakeCounter({ cake }: CakeCounterProps) {
  return (
    <div
      role="img"
      aria-label={cake ? "완성된 케이크" : "빈 계산대"}
      className="flex h-16 w-40 items-center justify-center rounded-lg border-2 border-dashed border-[var(--theme-accent)] bg-[var(--theme-background)] text-sm text-[var(--theme-text)]/60"
    >
      {cake ? "🎂" : "계산대"}
    </div>
  );
}
