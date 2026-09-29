"use client";

import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";
import type { MaterialCategory } from "@/lib/gameState";
import { CUSTOM_MATERIAL_RANK, TABLE_UNLOCK_RANKS, TOPPING_COUNT_RANK } from "@/lib/progress";

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  base: "시트",
  filling: "필링",
  cream: "크림",
  topping: "토핑",
  decoration: "장식",
};

type RankUpCardProps = {
  ranks: number[]; // 이번에 오른 랭크들 (보통 하나)
  onOpenShop: () => void;
  onClose: () => void;
};

// 랭크업 카드 (Papa's "Rank Up!"): 이번에 상점에 새로 진열된 재료와 새로 열린 기능을 보여준다
export function RankUpCard({ ranks, onOpenShop, onClose }: RankUpCardProps) {
  const registry = useMaterialRegistry();
  const newMaterials = (Object.keys(registry) as MaterialCategory[]).flatMap((category) =>
    registry[category].filter((material) => !material.isCustom && ranks.includes(material.unlockRank)),
  );
  const unlocksCustom = ranks.includes(CUSTOM_MATERIAL_RANK);
  // 새로 생긴 일들 (재료 말고)
  const news = [
    ...(ranks.some((rank) => TABLE_UNLOCK_RANKS.includes(rank)) ? ["🪑 테이블이 하나 더 열렸어요 — 손님이 더 많이 와요"] : []),
    ...(ranks.includes(TOPPING_COUNT_RANK) ? ["🍓 이제 손님이 토핑 개수까지 주문해요 (×4 등)"] : []),
  ];
  const hasNews = newMaterials.length > 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-4 short:p-2">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="rank-up-title"
        className="animate-result-pop flex w-80 max-w-full flex-col items-center gap-3 rounded-2xl bg-[#fff8ef] p-6 text-center text-[var(--theme-text)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] short:gap-2 short:p-4"
      >
        <p className="text-sm font-extrabold tracking-[0.2em] text-[var(--theme-accent)]">RANK UP!</p>
        <h2 id="rank-up-title" className="text-2xl font-extrabold short:text-xl">
          ⭐ 랭크 {ranks[ranks.length - 1]}
        </h2>

        {hasNews && (
          <div className="flex w-full flex-col gap-1.5">
            <p className="text-xs text-[var(--theme-text)]/70">상점에 새 재료가 들어왔어요</p>
            <ul className="flex flex-wrap justify-center gap-1.5">
              {newMaterials.map((material) => (
                <li
                  key={material.id}
                  className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold shadow-sm"
                >
                  <span aria-hidden>{material.emoji}</span>
                  {material.name}
                  <span className="font-semibold text-[var(--theme-text)]/50">{CATEGORY_LABELS[material.category]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {news.map((line) => (
          <p key={line} className="w-full rounded-xl bg-white/80 px-3 py-1.5 text-xs font-bold">
            {line}
          </p>
        ))}
        {unlocksCustom && (
          <p className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold">
            ✨ 나만의 재료 만들기가 열렸어요
            <br />
            <span className="font-semibold text-[var(--theme-text)]/60">가게 꾸미기 → 재료</span>
          </p>
        )}

        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm transition-transform active:scale-95 short:py-1.5"
          >
            {hasNews ? "나중에" : "확인"}
          </button>
          {hasNews && (
            <button
              type="button"
              autoFocus
              onClick={onOpenShop}
              className="flex-1 rounded-full bg-[var(--theme-accent)] px-4 py-2 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 short:py-1.5"
            >
              🛒 상점 가기
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
