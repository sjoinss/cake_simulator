"use client";

import { useLayoutEffect, useRef, useState } from "react";

// 요소의 실제 크기를 ResizeObserver로 잰다. 폰 가로 화면처럼 공간이 좁을 때 케이크 크기를 남은 공간에 맞추는 데 쓴다.
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
