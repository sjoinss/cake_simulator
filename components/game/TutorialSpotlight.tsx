"use client";

import { useEffect, useState } from "react";

type Rect = { x: number; y: number; width: number; height: number };

const PADDING = 6; // 짚은 요소 둘레 여백
const DIM = "rgba(20, 12, 10, 0.55)";

// 선택자에 맞는 화면 요소들의 위치 (보이는 것만)
function measure(selectors: string[]): Rect[][] {
  return selectors.map((selector) =>
    Array.from(document.querySelectorAll<HTMLElement>(selector))
      .map((element) => element.getBoundingClientRect())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => ({
        x: rect.left - PADDING,
        y: rect.top - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      })),
  );
}

// 튜토리얼 스포트라이트: 화면 전체를 어둡게 깔고 짚은 요소들만 구멍을 뚫어 밝게 남긴다.
// 구멍마다 숨 쉬는 테두리, 첫 요소엔 손가락. drag면 손가락이 첫 요소에서 둘째 요소로 끄는 시늉을 한다.
// 입력은 막지 않는다(pointer-events 없음) — 어두운 곳도 누를 수는 있고, 안내는 따라갈 뿐이다.
// 요소 위치는 화면 크기·스크롤·애니메이션에 따라 바뀌어서 매 프레임 재고, 바뀌었을 때만 다시 그린다.
export function TutorialSpotlight({ targets, drag }: { targets: string[]; drag?: boolean }) {
  const [groups, setGroups] = useState<Rect[][]>([]);
  const key = targets.join("|");

  useEffect(() => {
    let frame = 0;
    let last = "";
    const selectors = key.split("|");
    const tick = () => {
      const next = measure(selectors);
      const serialized = JSON.stringify(next);
      if (serialized !== last) {
        last = serialized;
        setGroups(next);
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [key]);

  const holes = groups.flat();
  if (holes.length === 0) return null;

  const first = groups.find((group) => group.length > 0)?.[0];
  const dropTarget = drag ? groups[1]?.[0] : undefined;
  const pointsDown = first ? first.y + first.height / 2 > window.innerHeight * 0.6 : false;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40">
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {holes.map((rect, index) => (
              <rect key={index} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={14} fill="black" />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={DIM} mask="url(#tutorial-spotlight-mask)" />
      </svg>

      {holes.map((rect, index) => (
        <div
          key={index}
          className="animate-tutorial-ring absolute rounded-[14px]"
          style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
        />
      ))}

      {first &&
        (dropTarget ? (
          // 끌어다 놓기 시늉: 첫 요소 가운데에서 도착점 가운데까지
          <span
            className="animate-tutorial-drag absolute text-4xl leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]"
            style={
              {
                left: first.x + first.width / 2 - 12,
                top: first.y + first.height / 2 - 6,
                "--drag-x": `${dropTarget.x + dropTarget.width / 2 - (first.x + first.width / 2)}px`,
                "--drag-y": `${dropTarget.y + dropTarget.height / 2 - (first.y + first.height / 2)}px`,
              } as React.CSSProperties
            }
          >
            👆
          </span>
        ) : (
          <span
            className="absolute -translate-x-1/2 animate-bounce text-4xl leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]"
            style={{
              left: first.x + first.width / 2,
              top: pointsDown ? first.y - 44 : first.y + first.height + 4,
            }}
          >
            {pointsDown ? "👇" : "👆"}
          </span>
        ))}
    </div>
  );
}
