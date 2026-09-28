"use client";

import { useEffect, useState } from "react";

// 실시간으로 흐르는 값(오븐 진행률 등)을 그리기 위해 현재 시각을 주기적으로 갱신한다. active가 false면 멈춘다.
export function useNow(active: boolean, intervalMs = 200): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
