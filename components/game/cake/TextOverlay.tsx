"use client";

import { useRef } from "react";
import type { CakeText } from "@/lib/gameState";
import { clampToCake } from "@/lib/decoration";

type TextOverlayProps = {
  texts: CakeText[];
  enabled: boolean; // 그리기 모드에서는 텍스트가 붓질을 가로막지 않도록 끈다
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onMoveStart: (index: number) => void; // 드래그 한 번 = 실행 취소 1단계
  onMove: (index: number, x: number, y: number) => void;
};

const KEYBOARD_STEP = 3; // 방향키 한 번에 움직일 거리(%)

// 자유 배치 가능한 텍스트 데코레이션. Canvas가 아니라 드래그 가능한 DOM 오버레이로 구현한다 (16장 원칙).
// 각 텍스트는 button이라 탭/클릭으로 선택하고, 키보드로는 선택 후 방향키로 옮길 수 있다 (18장 접근성).
export function TextOverlay({ texts, enabled, selectedIndex, onSelect, onMoveStart, onMove }: TextOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const moveTo = (index: number, x: number, y: number) => {
    const clamped = clampToCake({ x, y });
    onMove(index, clamped.x, clamped.y);
  };

  const handlePointerDown = (index: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(index);
    onMoveStart(index);

    const move = (moveEvent: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      moveTo(
        index,
        ((moveEvent.clientX - rect.left) / rect.width) * 100,
        ((moveEvent.clientY - rect.top) / rect.height) * 100,
      );
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const handleKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-KEYBOARD_STEP, 0],
      ArrowRight: [KEYBOARD_STEP, 0],
      ArrowUp: [0, -KEYBOARD_STEP],
      ArrowDown: [0, KEYBOARD_STEP],
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    if (!event.repeat) onMoveStart(index);
    moveTo(index, texts[index].x + delta[0], texts[index].y + delta[1]);
  };

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      {texts.map((text, index) => (
        <button
          key={index}
          type="button"
          tabIndex={enabled ? 0 : -1}
          aria-label={`케이크 문구 "${text.content}" 선택 (방향키로 이동)`}
          aria-pressed={selectedIndex === index}
          onPointerDown={handlePointerDown(index)}
          onKeyDown={handleKeyDown(index)}
          onClick={() => onSelect(index)}
          className={`absolute touch-none rounded border-0 bg-transparent px-1 font-bold whitespace-nowrap select-none ${
            enabled ? "pointer-events-auto cursor-grab active:cursor-grabbing" : ""
          } ${enabled && selectedIndex === index ? "outline-2 outline-dashed outline-[var(--theme-accent)]" : ""}`}
          style={{
            left: `${text.x}%`,
            top: `${text.y}%`,
            color: text.color,
            fontFamily: text.font,
            transform: `translate(-50%, -50%) rotate(${text.rotation}deg) scale(${text.scale})`,
          }}
        >
          {text.content}
        </button>
      ))}
    </div>
  );
}
