"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { getSoundSettings, setSoundSettings, subscribeSoundSettings, type SoundSettings } from "@/lib/sound";

const DEFAULT: SoundSettings = { sfx: true, bgm: true };
const OPTIONS: { key: keyof SoundSettings; label: string }[] = [
  { key: "sfx", label: "효과음" },
  { key: "bgm", label: "배경음악" },
];

// 상단 바 소리 버튼: 누르면 효과음 / 배경음악을 따로 켜고 끄는 작은 창이 열린다
export function SoundToggle() {
  const settings = useSyncExternalStore(subscribeSoundSettings, getSoundSettings, () => DEFAULT);
  // 열린 창 위치 (버튼 바로 아래, 오른쪽 맞춤). 상단 바 밖(body)에 그려서 튜토리얼 어둠막보다 위에 뜨게 한다
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const allOff = !settings.sfx && !settings.bgm;

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          if (anchor) return setAnchor(null);
          const rect = event.currentTarget.getBoundingClientRect();
          setAnchor({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        }}
        aria-label="소리 설정"
        aria-expanded={anchor !== null}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-base shadow-sm transition-transform active:scale-95 short:h-6 short:w-6 short:text-sm"
      >
        <span aria-hidden>{allOff ? "🔇" : "🔊"}</span>
      </button>
      {anchor &&
        createPortal(
          <>
            {/* 바깥을 누르면 닫힌다 */}
            <div className="fixed inset-0 z-[60]" onClick={() => setAnchor(null)} />
            <div
              style={{ top: anchor.top, right: anchor.right }}
              className="animate-result-pop fixed z-[61] flex w-40 flex-col gap-1 rounded-2xl bg-[#fff8ef] p-2 text-[var(--theme-text)] shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
            >
              {OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-sm font-bold hover:bg-black/5"
                >
                  {label}
                  <input
                    type="checkbox"
                    role="switch"
                    checked={settings[key]}
                    onChange={(event) => setSoundSettings({ [key]: event.target.checked })}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="relative h-5 w-9 rounded-full bg-black/15 transition-colors peer-checked:bg-[var(--theme-accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--theme-accent)] after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
                  />
                </label>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
