"use client";

import type { Player } from "@/lib/gameState";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { RankBadge } from "./RankBadge";
import { formatMoney } from "@/lib/money";
import { SoundToggle } from "./SoundToggle";

type TopBarProps = {
  day: number;
  servedToday: number; // 오늘 서빙을 마친 손님 수 (customersToday명이면 하루 마감)
  customersToday: number; // 오늘 받을 손님 수
  player: Player;
  onOpenShop: () => void;
  onOpenAlbum: () => void; // 케이크 앨범
  onOpenDecor: () => void; // "가게 꾸미기" 창 열기
};

// 모든 화면 공통 상단 바: DAY + 오늘 손님 진행, 랭크 / 상점, 꾸미기, 돈. 주문서는 바 아래 오른쪽의 집게 레일(OrderClipRail)에 따로 걸린다.
export function TopBar({ day, servedToday, customersToday, player, onOpenShop, onOpenAlbum, onOpenDecor }: TopBarProps) {
  // 크롬이 설치 가능하다고 알려줄 때만 "앱 설치" 버튼이 보인다 (이미 설치한 앱 안에선 안 보임)
  const install = useInstallPrompt();

  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center justify-between gap-3 bg-[var(--theme-secondary)] pr-[calc(0.75rem+var(--safe-r))] pl-[calc(0.75rem+var(--safe-l))] shadow-[0_2px_6px_rgba(0,0,0,0.08)] short:h-9">
      <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-base font-bold tracking-wide text-[var(--theme-text)] shadow-sm short:py-0.5 short:text-sm">
        <span aria-hidden>📅</span> DAY {day}
        <span className="ml-1 text-sm font-semibold text-[var(--theme-text)]/60 short:text-xs">
          손님 {servedToday}/{customersToday}
        </span>
      </span>
      <RankBadge player={player} />
      <div className="ml-auto flex items-center gap-2">
        <SoundToggle />
        <button
          type="button"
          onClick={onOpenAlbum}
          aria-label="케이크 앨범"
          title="케이크 앨범"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-base shadow-sm transition-transform active:scale-95 short:h-6 short:w-6 short:text-sm"
        >
          <span aria-hidden>📔</span>
        </button>
        {install && (
          <button
            type="button"
            onClick={install}
            className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-sm font-bold text-[var(--theme-text)] shadow-sm transition-transform active:scale-95 short:py-0.5 short:text-xs"
          >
            <span aria-hidden>📲</span> 앱 설치
          </button>
        )}
        <button
          type="button"
          onClick={onOpenDecor}
          className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-sm font-bold text-[var(--theme-text)] shadow-sm transition-transform active:scale-95 short:py-0.5 short:text-xs"
        >
          <span aria-hidden>🎨</span> 가게 꾸미기
        </button>
        <button
          type="button"
          onClick={onOpenShop}
          className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-sm font-bold text-[var(--theme-text)] shadow-sm transition-transform active:scale-95 short:py-0.5 short:text-xs"
        >
          <span aria-hidden>🛒</span> 상점
        </button>
        <span className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-base font-bold tracking-wide text-[var(--theme-text)] shadow-sm short:py-0.5 short:text-sm">
          <span aria-hidden>💰</span> <span className={player.money < 0 ? "text-red-600" : ""}>{formatMoney(player.money)}</span>
        </span>
      </div>
    </header>
  );
}
