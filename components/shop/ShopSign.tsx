"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "cake-tycoon.shopName";
const DEFAULT_NAME = "케이크 가게";
const CHANGE_EVENT = "cake-tycoon:shop-name";

// 가게 이름은 브라우저에 저장해서 새로고침해도 남는다 (서버 렌더링 때는 기본 이름)
const subscribe = (onChange: () => void) => {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
};
export const readShopName = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_NAME;
  } catch {
    return DEFAULT_NAME;
  }
};
const writeName = (name: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // 저장이 막힌 환경이면 이번 판에서만 쓴다
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

// 차양 아래 매달린 작은 나무 간판. 펜(✏️)을 누르면 이름을 고칠 수 있고, 펜이 체크(✔)로 바뀌어 누르면 확정된다.
export function ShopSign() {
  const name = useSyncExternalStore(subscribe, readShopName, () => DEFAULT_NAME);
  const [draft, setDraft] = useState<string | null>(null); // null이 아니면 수정 중
  const isEditing = draft !== null;

  const confirm = () => {
    const next = (draft ?? "").trim();
    if (next) writeName(next);
    setDraft(null);
  };

  return (
    <div className="relative mx-auto flex w-fit flex-col items-center">
      {/* 매단 끈 */}
      <div aria-hidden className="flex w-full justify-between px-5">
        <span className="h-3 w-0.5 bg-[#b98559] short:h-1.5" />
        <span className="h-3 w-0.5 bg-[#b98559] short:h-1.5" />
      </div>
      <div className="flex items-center gap-1.5 rounded-xl border-2 border-[#b98559] bg-[#fff8ef] px-3 py-1 shadow-[0_3px_0_#e7c3a0,0_5px_8px_rgba(90,50,30,0.15)] short:px-2 short:py-0.5">
        {isEditing ? (
          <input
            autoFocus
            value={draft}
            maxLength={12}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") confirm();
              if (event.key === "Escape") setDraft(null);
            }}
            aria-label="가게 이름"
            className="w-28 rounded-md border border-[#e7c3a0] bg-white px-1.5 text-center text-sm font-extrabold text-[var(--theme-text)] outline-none focus:border-[var(--theme-accent)] short:w-24 short:text-xs"
          />
        ) : (
          <span className="text-base font-extrabold tracking-wide whitespace-nowrap text-[#8a5c3c] short:text-sm">
            {name}
          </span>
        )}
        <button
          type="button"
          onClick={() => (isEditing ? confirm() : setDraft(name))}
          aria-label={isEditing ? "가게 이름 확정" : "가게 이름 고치기"}
          title={isEditing ? "확정" : "이름 고치기"}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform active:scale-90 short:h-5 short:w-5"
        >
          {isEditing ? "✔" : "✏️"}
        </button>
      </div>
    </div>
  );
}
