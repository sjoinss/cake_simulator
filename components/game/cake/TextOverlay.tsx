"use client";

import { useRef } from "react";
import type { CakeText } from "@/lib/gameState";

type TextOverlayProps = {
  texts: CakeText[];
  onMove: (index: number, x: number, y: number) => void;
};

// 자유 배치 가능한 텍스트 데코레이션. Canvas가 아니라 드래그 가능한 DOM 오버레이로 구현한다 (16장 원칙).
export function TextOverlay({ texts, onMove }: TextOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (index: number) => (event: React.PointerEvent<HTMLSpanElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    const move = (moveEvent: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.min(100, Math.max(0, ((moveEvent.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((moveEvent.clientY - rect.top) / rect.height) * 100));
      onMove(index, x, y);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      {texts.map((text, index) => (
        <span
          key={index}
          onPointerDown={handlePointerDown(index)}
          className="pointer-events-auto absolute cursor-grab touch-none rounded px-1 font-bold whitespace-nowrap select-none active:cursor-grabbing"
          style={{
            left: `${text.x}%`,
            top: `${text.y}%`,
            color: text.color,
            transform: `translate(-50%, -50%) rotate(${text.rotation}deg) scale(${text.scale})`,
          }}
        >
          {text.content}
        </span>
      ))}
    </div>
  );
}
