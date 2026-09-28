"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const subscribe = () => () => {};

// 브라우저에서만 그린다. 게임은 저장된 진행(localStorage)을 읽어 시작하는데, 서버에서 미리 그린 화면과 달라지면
// 하이드레이션 불일치가 나서, 서버 렌더링(정적 내보내기 포함) 때는 비워 두고 브라우저에서 처음부터 그린다.
export function ClientOnly({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  return isClient ? children : null;
}
