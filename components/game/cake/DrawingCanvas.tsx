"use client";

import { useCallback, useEffect, useRef } from "react";
import type { CakeDrawing } from "@/lib/gameState";

export type DrawingTool = "pen" | "eraser";

type Point = { x: number; y: number };

type DrawingCanvasProps = {
  drawings: CakeDrawing[];
  color: string;
  size: number;
  tool: DrawingTool;
  enabled: boolean; // 텍스트 편집 중에는 캔버스가 터치를 가로채지 않도록 끈다
  onStrokeComplete: (drawing: CakeDrawing) => void;
  onEraseStart: () => void; // 지우개 한 번 긋기 = 실행 취소 1단계 (DecorationStage가 히스토리를 쌓음)
  onEraseAt: (point: Point) => void;
};

const CANVAS_PX = 224; // DecorationStage 래퍼(h-56 w-56 = 14rem)와 동일한 해상도

// 자유 그림 데코레이션. 좌표를 캔버스 크기 대비 퍼센트로 저장해서 토핑/텍스트와 같은 좌표계를 쓰고,
// 케이크 데이터(cake.drawings)에서 항상 다시 그리는 선언적 렌더러로 동작한다 (16장 원칙).
export function DrawingCanvas({
  drawings,
  color,
  size,
  tool,
  enabled,
  onStrokeComplete,
  onEraseStart,
  onEraseAt,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStroke = useRef<Point[]>([]);
  const isPointerDown = useRef(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const strokes = [...drawings];
    if (currentStroke.current.length > 1) {
      strokes.push({ points: currentStroke.current, color, size });
    }

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      stroke.points.forEach((point, index) => {
        const x = (point.x / 100) * canvas.width;
        const y = (point.y / 100) * canvas.height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [drawings, color, size]);

  useEffect(redraw, [redraw]);

  const getRelativePoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_PX}
      height={CANVAS_PX}
      aria-hidden
      className={`absolute inset-0 h-full w-full touch-none ${enabled ? "" : "pointer-events-none"} ${
        tool === "eraser" ? "cursor-cell" : "cursor-crosshair"
      }`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        isPointerDown.current = true;
        const point = getRelativePoint(event);
        if (tool === "eraser") {
          onEraseStart();
          onEraseAt(point);
          return;
        }
        currentStroke.current = [point];
      }}
      onPointerMove={(event) => {
        if (!isPointerDown.current) return;
        const point = getRelativePoint(event);
        if (tool === "eraser") {
          onEraseAt(point);
          return;
        }
        currentStroke.current = [...currentStroke.current, point];
        redraw();
      }}
      onPointerUp={() => {
        isPointerDown.current = false;
        if (tool === "pen" && currentStroke.current.length > 1) {
          onStrokeComplete({ points: currentStroke.current, color, size });
        }
        currentStroke.current = [];
      }}
    />
  );
}
