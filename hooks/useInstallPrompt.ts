"use client";

import { useSyncExternalStore } from "react";
import { withBasePath } from "@/lib/assets";

// 크롬(안드로이드/PC)이 "이 사이트는 앱으로 설치할 수 있다"고 알려줄 때 오는 이벤트. 표준 타입에 아직 없다.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // 브라우저 기본 안내 대신 상단 바의 설치 버튼으로 받는다
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });

  // 개발 서버에선 캐시가 수정 사항을 가릴 수 있어서 배포본에서만 등록한다
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    const register = () =>
      navigator.serviceWorker.register(withBasePath("/sw.js"), { scope: withBasePath("/") }).catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// 설치할 수 있을 때만 install 함수를 돌려준다 (이미 설치했거나 iOS 사파리처럼 지원 안 하면 null)
export function useInstallPrompt(): (() => void) | null {
  const canInstall = useSyncExternalStore(
    subscribe,
    () => deferred !== null,
    () => false,
  );
  if (!canInstall) return null;
  return () => {
    const event = deferred;
    if (!event) return;
    deferred = null; // 한 번 띄운 이벤트는 다시 못 쓴다
    notify();
    event.prompt().catch(() => {});
  };
}
