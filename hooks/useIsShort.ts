"use client";

import { useSyncExternalStore } from "react";

// globals.css의 `short` 변형(@media (max-height: 480px))과 같은 조건. 폰 가로 화면처럼 세로가 짧을 때 true.
// CSS 클래스만으로 안 되는 곳(케이크 스냅샷 px 크기 등)에서 쓴다.
const QUERY = "(max-height: 480px)";

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

export function useIsShort(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
