"use client";

import { useEffect, useRef, useState } from "react";
import type { CakeDrawing } from "@/lib/gameState";

type DrawingCanvasProps = {
  drawings: CakeDrawing[];
  color: string;
  size: number;
  onStrokeComplete: (drawing: CakeDrawing) => void;
};

const CANVAS_PX = 224; // DecorationStage 래퍼(h-56 w-56 = 14rem)와 동일한 해상도

// 자유 그림 데코레이션. 좌표를 캔버스 크기 대비 퍼센트로 저장해서 토핑/텍스트와 같은 좌표계를 쓰고,
// 케이크 데이터(cake.drawings)에서 항상 다시 그리는 선언적 렌더러로 동작한다 (16장 원칙).
export function DrawingCanvas({ drawings, color, size, onStrokeComplete }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStroke = useRef<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const redraw = () => {
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
  };

  useEffect(redraw, [drawings]);

  const getRelativePoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
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
      className="absolute inset-0 h-full w-full touch-none"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsDrawing(true);
        currentStroke.current = [getRelativePoint(event)];
      }}
      onPointerMove={(event) => {
        if (!isDrawing) return;
        currentStroke.current = [...currentStroke.current, getRelativePoint(event)];
        redraw();
      }}
      onPointerUp={() => {
        if (currentStroke.current.length > 1) {
          onStrokeComplete({ points: currentStroke.current, color, size });
        }
        currentStroke.current = [];
        setIsDrawing(false);
      }}
    />
  );
}
