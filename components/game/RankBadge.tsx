import type { Player } from "@/lib/gameState";

// 랭크 + 다음 랭크까지 경험치 막대 (상단 바, 상점)
export function RankBadge({ player }: { player: Player }) {
  const ratio = Math.min(player.exp / player.rankUpThreshold, 1);
  return (
    <span
      className="flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-sm font-bold text-[var(--theme-text)] shadow-sm short:py-0.5 short:text-xs"
      title={`다음 랭크까지 ${Math.max(0, player.rankUpThreshold - player.exp)}점`}
    >
      <span aria-hidden>⭐</span>
      <span className="tabular-nums">랭크 {player.rank}</span>
      <span
        role="progressbar"
        aria-label="다음 랭크까지"
        aria-valuemin={0}
        aria-valuemax={player.rankUpThreshold}
        aria-valuenow={player.exp}
        className="block h-1.5 w-10 overflow-hidden rounded-full bg-black/10 short:w-8"
      >
        <span className="block h-full bg-[var(--theme-accent)]" style={{ width: `${ratio * 100}%` }} />
      </span>
    </span>
  );
}
