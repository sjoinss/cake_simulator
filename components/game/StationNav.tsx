"use client";

import type { GameState, Station } from "@/lib/gameState";
import { getBakingElapsedRatio, OVEN_BURNT_RATIO, OVEN_IDEAL_END_RATIO, OVEN_IDEAL_START_RATIO } from "@/lib/gameLogic";
import { getCakesAtStage, getOvenQueue, STATIONS } from "@/lib/station";
import { useNow } from "@/hooks/useNow";
import { useEffect, useRef } from "react";
import { sounds } from "@/lib/sound";

type StationNavProps = {
  state: GameState;
  onSelect: (station: Station) => void;
};

// 하단 스테이션 탭 (Papa's 시리즈). 매장 포함 어느 화면에서든 항상 보이고 언제든 이동할 수 있다.
// 각 탭에 "할 일" 개수 배지를 달고, 오븐 탭은 칸별 진행 바 + 꺼낼 때(초록)/타기 시작할 때(빨강) 깜빡여서
// 다른 스테이션에서 일하다가도 오븐을 챙길 수 있게 한다.
export function StationNav({ state, onSelect }: StationNavProps) {
  const bakingCakes = state.ovenSlots.map((id) => state.cakes.find((job) => job.jobId === id) ?? null);
  const now = useNow(bakingCakes.some(Boolean));
  const ovenRatios = bakingCakes.map((job) =>
    job?.cake.baking.startTime ? getBakingElapsedRatio(job.cake.baking.startTime, job.cake.baking.duration, now) : null,
  );
  const ovenAlert = ovenRatios.some((ratio) => ratio !== null && ratio > OVEN_IDEAL_END_RATIO)
    ? "over"
    : ovenRatios.some((ratio) => ratio !== null && ratio >= OVEN_IDEAL_START_RATIO)
      ? "ideal"
      : null;

  // 오븐 알림이 바뀌는 순간 소리로도 알린다 (다른 스테이션에 있어도 들리게): 다 구워짐 딩동 / 타기 시작 삐삐
  const lastAlert = useRef(ovenAlert);
  useEffect(() => {
    if (ovenAlert === lastAlert.current) return;
    if (ovenAlert === "ideal") sounds.ovenDing();
    if (ovenAlert === "over") sounds.ovenWarning();
    lastAlert.current = ovenAlert;
  }, [ovenAlert]);

  const counts: Record<Station, number> = {
    // 주문 받을 손님 + 서빙할 케이크
    order:
      state.tables.filter((customer) => customer?.status === "waiting").length + getCakesAtStage(state, "ready").length,
    base: 0, // 시트 스테이션엔 항상 빈 틀이 놓여 있어서 "할 일" 배지를 달지 않는다
    oven: getOvenQueue(state).length,
    cream: getCakesAtStage(state, "cream").length,
    decorate: getCakesAtStage(state, "decorate").length,
  };

  return (
    <nav
      aria-label="스테이션"
      className="relative z-20 shrink-0 border-t border-black/5 bg-[var(--theme-secondary)] pt-1.5 pr-[calc(0.5rem+var(--safe-r))] pb-[calc(0.375rem+var(--safe-b))] pl-[calc(0.5rem+var(--safe-l))] short:pt-1 short:pb-[calc(0.25rem+var(--safe-b))]"
    >
      <ul className="flex items-stretch gap-1.5">
        {STATIONS.map(({ station, emoji, label }) => {
          const isCurrent = state.station === station;
          const alert = station === "oven" ? ovenAlert : null;
          return (
            <li key={station} className="flex-1">
              <button
                type="button"
                data-station-tab={station}
                onClick={() => {
                  sounds.click();
                  onSelect(station);
                }}
                aria-current={isCurrent ? "page" : undefined}
                className={`relative flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-bold short:h-8 short:text-xs shadow-sm transition-transform active:scale-95 ${
                  isCurrent ? "bg-[var(--theme-accent)] text-white" : "bg-white/70 text-[var(--theme-text)]"
                } ${alert === "ideal" ? "animate-pulse ring-3 ring-emerald-400" : ""} ${
                  alert === "over" ? "animate-pulse ring-3 ring-red-500" : ""
                }`}
              >
                <span className="text-xl leading-none short:text-base" aria-hidden>
                  {emoji}
                </span>
                {label}
                {station === "oven" && (
                  <span className="flex flex-col gap-0.5" aria-hidden>
                    {ovenRatios.map((ratio, index) => (
                      <span key={index} className="block h-1 w-5 overflow-hidden rounded-full bg-black/10">
                        {ratio !== null && (
                          <span
                            className={`block h-full ${
                              ratio > OVEN_IDEAL_END_RATIO
                                ? "bg-red-500"
                                : ratio >= OVEN_IDEAL_START_RATIO
                                  ? "bg-emerald-500"
                                  : "bg-orange-400"
                            }`}
                            style={{ width: `${Math.min(ratio / OVEN_BURNT_RATIO, 1) * 100}%` }}
                          />
                        )}
                      </span>
                    ))}
                  </span>
                )}
                {alert && (
                  <span className="sr-only">{alert === "ideal" ? " 꺼낼 때가 됐어요" : " 케이크가 타고 있어요"}</span>
                )}
                {counts[station] > 0 && (
                  <span className="absolute -top-1.5 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] leading-none text-white shadow">
                    {counts[station]}
                    <span className="sr-only">건 대기</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
