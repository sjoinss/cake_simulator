"use client";

import { useEffect, useRef } from "react";

// 프레스&홀드 조작(반죽 붓기, 크림 짜기)용 루프. active인 동안 매 프레임 경과 시간(초)을 넘겨 onTick을 부른다 (1장 4번).
export function useHoldLoop(active: boolean, onTick: (dtSeconds: number) => void) {
  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = performance.now();
    const tick = (time: number) => {
      // rAF 타임스탬프는 루프 시작 시각보다 앞설 수 있어 음수를 막고, 프레임이 끊겨도 한 번에 몰아서 쏟아지지 않게 상한을 둔다
      const dt = Math.max(0, Math.min(0.1, (time - last) / 1000));
      last = time;
      onTickRef.current(dt);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
}
