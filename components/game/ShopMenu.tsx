"use client";

import { useState } from "react";
import type { MaterialCategory, Player } from "@/lib/gameState";
import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";
import { DECOR_ITEMS, hasDecor, isMaterialOwned, materialPrice, UPGRADES, upgradeLevel, type UpgradeId } from "@/lib/progress";
import { sounds } from "@/lib/sound";
import { formatMoney } from "@/lib/money";
import { MaterialIcon, type MaterialContainer } from "./MaterialPicker";
import { RankBadge } from "./RankBadge";

// 선반과 같은 모양으로 진열한다 (시트·토핑은 그릇, 필링은 병, 크림은 짤주머니)
const SHELVES: { category: MaterialCategory; label: string; container: MaterialContainer }[] = [
  { category: "base", label: "시트", container: "bowl" },
  { category: "filling", label: "필링", container: "jar" },
  { category: "cream", label: "크림", container: "bag" },
  { category: "topping", label: "토핑", container: "bowl" },
];

type ShopTab = "materials" | "equipment" | "decor";
const TABS: { id: ShopTab; label: string }[] = [
  { id: "materials", label: "재료" },
  { id: "equipment", label: "장비" },
  { id: "decor", label: "장식" },
];

type ShopMenuProps = {
  player: Player;
  onBuyMaterial: (materialId: string) => void;
  onBuyUpgrade: (id: UpgradeId) => void;
  onBuyDecor: (id: string) => void;
  onClose: () => void;
};

// 상점 (13장 성장 시스템): 랭크가 오르면 진열되는 재료를 돈으로 사고, 장비는 랭크와 무관하게 언제든 산다.
// 산 재료는 바로 선반에 올라가고 그 뒤로 오는 손님 주문에도 나온다.
export function ShopMenu({ player, onBuyMaterial, onBuyUpgrade, onBuyDecor, onClose }: ShopMenuProps) {
  const registry = useMaterialRegistry();
  const [tab, setTab] = useState<ShopTab>("materials");

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 p-4 short:p-2"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-title"
        className="animate-result-pop flex max-h-full w-[40rem] max-w-full flex-col gap-3 overflow-y-auto rounded-2xl bg-[#fff8ef] p-5 text-[var(--theme-text)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] short:gap-2 short:p-3"
      >
        <header className="flex items-center justify-between gap-2">
          <h2 id="shop-title" className="text-lg font-extrabold short:text-base">
            🛒 상점
          </h2>
          <div className="flex items-center gap-2">
            <RankBadge player={player} />
            <span className="rounded-full bg-white px-3 py-0.5 text-sm font-bold tabular-nums shadow-sm">
              💰 {formatMoney(player.money)}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              autoFocus
              className="rounded-full px-2 text-lg leading-none text-[var(--theme-text)]/60 hover:bg-black/5"
            >
              ✕
            </button>
          </div>
        </header>

        <div role="tablist" aria-label="상점 종류" className="flex gap-1 border-b border-black/10">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`shop-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`shop-panel-${id}`}
              onClick={() => setTab(id)}
              className={`-mb-px rounded-t-lg border border-b-0 px-4 py-1 text-sm font-bold ${
                tab === id
                  ? "border-black/10 bg-white text-[var(--theme-text)]"
                  : "border-transparent text-[var(--theme-text)]/50 hover:text-[var(--theme-text)]/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "materials" ? (
          <div
            role="tabpanel"
            id="shop-panel-materials"
            aria-labelledby="shop-tab-materials"
            className="flex flex-col gap-2 short:gap-1.5"
          >
            <p className="text-xs text-[var(--theme-text)]/70">
              랭크가 오르면 새 재료가 진열돼요. 사면 바로 선반에 올라가고 손님들도 주문하기 시작해요.
            </p>
            {SHELVES.map(({ category, label, container }) => (
              <div key={category} className="flex items-center gap-2 rounded-xl bg-white/70 px-2 py-1.5">
                <h3 className="w-9 shrink-0 text-center text-xs font-bold text-[var(--theme-text)]/70">{label}</h3>
                <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none]">
                  {registry[category]
                    .filter((material) => !material.isCustom)
                    .toSorted((a, b) => a.unlockRank - b.unlockRank)
                    .map((material) => {
                      const owned = isMaterialOwned(material, player.unlockedItems);
                      const locked = !owned && player.rank < material.unlockRank;
                      const price = materialPrice(material);
                      return (
                        <li
                          key={material.id}
                          className="flex w-20 shrink-0 flex-col items-center gap-0.5 short:w-16"
                        >
                          <span
                            className={`flex h-14 items-end short:h-10 [&>*]:origin-bottom short:[&>*]:scale-[0.72] ${
                              locked ? "opacity-35 grayscale" : ""
                            }`}
                          >
                            <MaterialIcon material={material} container={container} />
                          </span>
                          <span className="w-full truncate text-center text-[11px] font-bold">
                            {locked ? "???" : material.name}
                          </span>
                          {owned ? (
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold text-[var(--theme-text)]/50">
                              보유
                            </span>
                          ) : locked ? (
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-[var(--theme-text)]/50">
                              🔒 랭크 {material.unlockRank}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                sounds.coin();
                                onBuyMaterial(material.id);
                              }}
                              disabled={player.money < price}
                              aria-label={`${material.name} $${price}에 사기`}
                              className="rounded-full bg-[var(--theme-accent)] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm transition-transform active:scale-95 disabled:bg-black/15 disabled:text-[var(--theme-text)]/50"
                            >
                              ${price}
                            </button>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        ) : tab === "decor" ? (
          <div role="tabpanel" id="shop-panel-decor" aria-labelledby="shop-tab-decor" className="flex flex-col gap-2">
            <p className="text-xs text-[var(--theme-text)]/70">가게 홀에 놓는 장식이에요. 점수와는 상관없이 가게를 꾸며요.</p>
            <ul className="grid grid-cols-3 gap-2 short:grid-cols-6">
              {DECOR_ITEMS.map((item) => {
                const owned = hasDecor(player.unlockedItems, item.id);
                return (
                  <li key={item.id} className="flex flex-col items-center gap-1 rounded-xl bg-white/80 p-2 text-center">
                    <span className="text-3xl leading-none short:text-2xl" aria-hidden>
                      {item.emoji}
                    </span>
                    <span className="text-xs font-extrabold">{item.name}</span>
                    <span className="text-[10px] opacity-60">{item.place}</span>
                    {owned ? (
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-bold text-[var(--theme-text)]/50">
                        놓았어요
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.coin();
                          onBuyDecor(item.id);
                        }}
                        disabled={player.money < item.price}
                        aria-label={`${item.name} ${item.price}에 사기`}
                        className="rounded-full bg-[var(--theme-accent)] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm transition-transform active:scale-95 disabled:bg-black/15 disabled:text-[var(--theme-text)]/50"
                      >
                        ${item.price}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div
            role="tabpanel"
            id="shop-panel-equipment"
            aria-labelledby="shop-tab-equipment"
            className="grid grid-cols-2 gap-2 short:grid-cols-4"
          >
            {UPGRADES.map((upgrade) => {
              const level = upgradeLevel(player, upgrade.id);
              const next = upgrade.levels[level];
              const current = level === 0 ? upgrade.base : upgrade.levels[level - 1].label;
              return (
                <div key={upgrade.id} className="flex flex-col gap-1.5 rounded-xl bg-white/80 p-3 short:gap-1 short:p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl leading-none short:text-xl" aria-hidden>
                      {upgrade.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-extrabold">{upgrade.name}</h3>
                      <p className="text-xs text-[var(--theme-text)]/70">지금: {current}</p>
                      {upgrade.note && next && (
                        <p className="text-[10px] font-bold text-[var(--theme-accent)]">{upgrade.note}</p>
                      )}
                    </div>
                  </div>
                  {/* 단계 표시 */}
                  <div className="flex gap-1" aria-label={`${upgrade.levels.length}단계 중 ${level}단계`}>
                    {upgrade.levels.map((_, index) => (
                      <span
                        key={index}
                        className={`h-1.5 flex-1 rounded-full ${index < level ? "bg-[var(--theme-accent)]" : "bg-black/10"}`}
                      />
                    ))}
                  </div>
                  {next ? (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.coin();
                        onBuyUpgrade(upgrade.id);
                      }}
                      disabled={player.money < next.price}
                      className="flex items-center justify-between gap-2 rounded-full bg-[var(--theme-accent)] px-3 py-1 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 disabled:bg-black/15 disabled:text-[var(--theme-text)]/50"
                    >
                      <span className="truncate">→ {next.label}</span>
                      <span className="tabular-nums">${next.price}</span>
                    </button>
                  ) : (
                    <span className="rounded-full bg-black/5 px-3 py-1 text-center text-xs font-bold text-[var(--theme-text)]/50">
                      최고 단계
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
