"use client";

import { useEffect, useState } from "react";
import type { ActiveOrder, CakeDrawing, MaterialRegistry } from "@/lib/gameState";
import { CakeRenderer } from "../cake/CakeRenderer";
import { DrawingCanvas } from "../cake/DrawingCanvas";
import { TextOverlay } from "../cake/TextOverlay";

type DecorationStageProps = {
  order: ActiveOrder;
  materials: MaterialRegistry;
  onAddDrawing: (drawing: CakeDrawing) => void;
  onClearDrawings: () => void;
  onAddText: (content: string) => void;
  onMoveText: (index: number, x: number, y: number) => void;
  onFinish: () => void;
};

const BRUSH_COLORS = ["#ff7f66", "#f2a0d8", "#7ec8e3", "#8bd17c", "#4a3733"];

// 데코레이션 단계. 진입 시 카메라가 위로 이동해 케이크를 완전히 내려다보는 Top View로 전환되는
// 연출이 핵심 차별화 요소라 반드시 구현한다 (cake-tycoon-prompt.md 4장 — 생략 대상 아님).
export function DecorationStage({
  order,
  materials,
  onAddDrawing,
  onClearDrawings,
  onAddText,
  onMoveText,
  onFinish,
}: DecorationStageProps) {
  const [isTopView, setIsTopView] = useState(false);
  const [color, setColor] = useState(BRUSH_COLORS[0]);

  useEffect(() => {
    const timer = setTimeout(() => setIsTopView(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6" style={{ perspective: "600px" }}>
      <div
        className="relative h-56 w-56 max-w-full transition-transform duration-700 ease-out"
        style={{ transform: isTopView ? "rotateX(0deg) scale(1.05)" : "rotateX(55deg) scale(0.9)" }}
      >
        <CakeRenderer cake={order.cake} materials={materials} />
        <DrawingCanvas drawings={order.cake.drawings} color={color} size={4} onStrokeComplete={onAddDrawing} />
        <TextOverlay texts={order.cake.text} onMove={onMoveText} />
      </div>

      <div className="flex items-center gap-2">
        {BRUSH_COLORS.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`브러시 색상 ${swatch}`}
            onClick={() => setColor(swatch)}
            className={`h-7 w-7 rounded-full border-2 transition-transform active:scale-90 ${
              color === swatch ? "border-[var(--theme-text)]" : "border-white"
            }`}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onClearDrawings}
          className="rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-[var(--theme-text)] shadow-sm transition-transform active:scale-95"
        >
          그림 지우기
        </button>
        <button
          type="button"
          onClick={() => {
            const content = window.prompt("케이크에 남길 문구를 입력하세요", "Happy Birthday");
            if (content) onAddText(content);
          }}
          className="rounded-full bg-white/70 px-4 py-1.5 text-sm font-bold text-[var(--theme-text)] shadow-sm transition-transform active:scale-95"
        >
          텍스트 추가
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="rounded-full bg-[var(--theme-accent)] px-6 py-1.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          완성 🎉
        </button>
      </div>
    </div>
  );
}
