"use client";

import { useRef } from "react";
import type { CakeDecoration } from "@/lib/gameState";
import { clampToCake } from "@/lib/decoration";

type StickerOverlayProps = {
  stickers: CakeDecoration[];
  enabled: boolean; // 스티커 모드일 때만 누를 수 있다 (그리기·글자 모드에선 방해하지 않게)
  placing: string | null; // 고른 스티커 — 빈 자리를 누르면 이걸 붙인다
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onPlace: (x: number, y: number) => void;
  onMoveStart: () => void; // 드래그 한 번 = 실행 취소 1단계
  onMove: (index: number, x: number, y: number) => void;
};

const KEYBOARD_STEP = 3;

// 케이크 위 이모지 스티커. 빈 자리를 톡 누르면 고른 스티커가 붙고, 붙은 스티커는 끌어서 옮긴다 (TextOverlay와 같은 방식).
export function StickerOverlay({
  stickers,
  enabled,
  placing,
  selectedIndex,
  onSelect,
  onPlace,
  onMoveStart,
  onMove,
}: StickerOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const toPercent = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return clampToCake({
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleStickerDown = (index: number) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // 빈 자리 누르기(새 스티커 붙이기)로 번지지 않게
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(index);
    onMoveStart();
    const move = (moveEvent: PointerEvent) => {
      const point = toPercent(moveEvent.clientX, moveEvent.clientY);
      if (point) onMove(index, point.x, point.y);
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
    if (!event.repeat) onMoveStart();
    const point = clampToCake({ x: stickers[index].x + delta[0], y: stickers[index].y + delta[1] });
    onMove(index, point.x, point.y);
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 touch-none ${enabled ? (placing ? "cursor-copy" : "") : "pointer-events-none"}`}
      onPointerDown={(event) => {
        if (!enabled || !placing) return;
        const point = toPercent(event.clientX, event.clientY);
        if (point) onPlace(point.x, point.y);
      }}
    >
      {stickers.map((sticker, index) => (
        <button
          key={index}
          type="button"
          tabIndex={enabled ? 0 : -1}
          aria-label={`스티커 ${sticker.emoji} 선택 (방향키로 이동)`}
          aria-pressed={selectedIndex === index}
          onPointerDown={handleStickerDown(index)}
          onKeyDown={handleKeyDown(index)}
          onClick={() => onSelect(index)}
          className={`absolute touch-none rounded-lg border-0 bg-transparent p-0 text-2xl leading-none select-none ${
            enabled ? "pointer-events-auto cursor-grab active:cursor-grabbing" : "pointer-events-none"
          } ${enabled && selectedIndex === index ? "outline-2 outline-offset-2 outline-dashed outline-[var(--theme-accent)]" : ""}`}
          style={{
            left: `${sticker.x}%`,
            top: `${sticker.y}%`,
            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
          }}
        >
          {sticker.emoji}
        </button>
      ))}
    </div>
  );
}
