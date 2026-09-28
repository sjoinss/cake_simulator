"use client";

import { useSyncExternalStore } from "react";
import { getDefaultTheme, getTheme, setTheme, subscribeTheme, THEMES } from "@/lib/theme";

// "가게 꾸미기" 창의 테마 탭 (10장): 파스텔 테마 7가지 중 하나를 고르면 가게와 작업대 색이 바로 바뀐다.
export function ThemePicker() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getDefaultTheme);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[var(--theme-text)]/70">고르는 즉시 가게와 작업대 색이 바뀌어요.</p>
      <div role="radiogroup" aria-label="테마" className="grid grid-cols-7 gap-2 short:gap-1.5">
        {THEMES.map(({ id, label, swatch: [light, strong] }) => {
          const isSelected = id === theme;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center gap-1 rounded-xl p-1.5 transition-colors active:scale-95 ${
                isSelected ? "bg-white shadow-sm" : "hover:bg-white/60"
              }`}
            >
              {/* 차양처럼 연한색·진한색 줄무늬 동그라미 */}
              <span
                aria-hidden
                className={`h-10 w-10 rounded-full border-2 short:h-8 short:w-8 ${
                  isSelected ? "border-[var(--theme-text)]/60" : "border-white"
                } shadow-[0_2px_4px_rgba(0,0,0,0.12)]`}
                style={{ background: `repeating-linear-gradient(90deg, ${strong} 0 6px, ${light} 6px 12px)` }}
              />
              <span
                className={`text-[11px] ${isSelected ? "font-extrabold" : "font-bold text-[var(--theme-text)]/60"}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
