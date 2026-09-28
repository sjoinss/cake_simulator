"use client";

import type { ReactNode } from "react";
import { useElementSize } from "@/hooks/useElementSize";

type FitBoxProps = {
  maxSize: number; // 공간이 넉넉할 때의 최대 가로 폭(px)
  heightRatio: number; // 그릴 것의 세로/가로 비율 (입체 케이크 ≈ 0.95, 평면 케이크 = 1)
  minSize?: number;
  align?: "center" | "end"; // end: 아래쪽에 붙인다 (조리대 위에 놓인 것처럼)
  className?: string;
  children: (size: number) => ReactNode;
};

// 남은 공간을 재서 그 안에 들어가는 가장 큰 크기를 children에 넘긴다.
// 폰 가로 화면(세로 ~320px)에서도 케이크가 잘리지 않게 하기 위한 것 (11장 모바일 가로 UI).
export function FitBox({ maxSize, heightRatio, minSize = 96, align = "end", className = "", children }: FitBoxProps) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const size = Math.floor(Math.max(minSize, Math.min(maxSize, width, height / heightRatio)));

  return (
    <div
      ref={ref}
      className={`flex min-h-0 min-w-0 flex-1 justify-center self-stretch ${align === "end" ? "items-end" : "items-center"} ${className}`}
    >
      {width > 0 && children(size)}
    </div>
  );
}

type ScaledProps = {
  width: number; // 화면에 보일 가로 폭(px)
  baseWidth: number; // 원래 디자인 크기
  baseHeight: number;
  children: ReactNode;
};

// 고정 크기로 디자인된 것(반죽 틀, 필링 단면, 데코 케이크 등)을 비율 그대로 줄여서 보여준다.
// 포인터 좌표는 모두 getBoundingClientRect 기준이라 축소해도 입력 위치가 그대로 맞는다.
export function Scaled({ width, baseWidth, baseHeight, children }: ScaledProps) {
  const scale = width / baseWidth;
  return (
    <div className="relative shrink-0" style={{ width, height: baseHeight * scale }}>
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: baseWidth, height: baseHeight, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
