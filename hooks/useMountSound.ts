"use client";

import { useEffect, useRef } from "react";

// 카드가 처음 뜰 때 소리를 한 번 낸다. 개발 모드(StrictMode)가 효과를 두 번 실행해도 한 번만 울리게 ref로 막는다
export function useMountSound(play: () => void) {
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    play();
  }, [play]);
}
