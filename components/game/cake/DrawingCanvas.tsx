"use client";

import { useCallback, useEffect, useRef } from "react";
import type { CakeDrawing } from "@/lib/gameState";
import { rainbowColor, stampPoints, type BrushType, type StampShape } from "@/lib/decoration";

// pen: 자유 그림, eraser: 획 지우기, 모양(heart/star/circle): 톡 누른 자리에 모양 도장
export type DrawingTool = "pen" | "eraser" | StampShape;

type Point = { x: number; y: number };

type DrawingCanvasProps = {
  drawings: CakeDrawing[];
  color: string;
  size: number;
  brush: BrushType; // 새로 긋는 획의 펜 종류
  tool: DrawingTool;
  enabled: boolean; // 텍스트 편집 중에는 캔버스가 터치를 가로채지 않도록 끈다
  onStrokeComplete: (drawing: CakeDrawing) => void;
  onEraseStart: () => void; // 지우개 한 번 긋기 = 실행 취소 1단계 (DecorationStage가 히스토리를 쌓음)
  onEraseAt: (point: Point) => void;
};

const CANVAS_PX = 224; // DecorationStage 래퍼(h-56 w-56 = 14rem)와 동일한 해상도

// 획 하나를 펜 종류에 맞게 그린다. 결과 카드 등에서는 같은 규칙으로 SVG로 그린다 (CakeRenderer DecorationLayer)
function drawStroke(ctx: CanvasRenderingContext2D, stroke: CakeDrawing, width: number, height: number) {
  const points = stroke.points.map((point) => ({ x: (point.x / 100) * width, y: (point.y / 100) * height }));
  if (points.length < 2) return;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash(stroke.brushType === "dashed" ? [stroke.size * 1.2, stroke.size * 2.2] : []);

  if (stroke.brushType === "rainbow") {
    for (let i = 1; i < points.length; i++) {
      ctx.beginPath();
      ctx.strokeStyle = rainbowColor(i);
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }
    return;
  }

  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  points.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
  ctx.stroke();

  if (stroke.brushType === "sparkle") {
    // 선 위에 반짝이는 흰 점
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    points.forEach((point, index) => {
      if (index % 3 !== 0) return;
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(1, stroke.size * 0.32), 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// 자유 그림 데코레이션. 좌표를 캔버스 크기 대비 퍼센트로 저장해서 토핑/텍스트와 같은 좌표계를 쓰고,
// 케이크 데이터(cake.drawings)에서 항상 다시 그리는 선언적 렌더러로 동작한다 (16장 원칙).
export function DrawingCanvas({
  drawings,
  color,
  size,
  brush,
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
      strokes.push({ points: currentStroke.current, color, size, brushType: brush });
    }
    for (const stroke of strokes) drawStroke(ctx, stroke, canvas.width, canvas.height);
  }, [drawings, color, size, brush]);

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
        tool === "eraser" ? "cursor-cell" : tool === "pen" ? "cursor-crosshair" : "cursor-copy"
      }`}
      onPointerDown={(event) => {
        const point = getRelativePoint(event);
        if (tool !== "pen" && tool !== "eraser") {
          // 모양 도장: 누른 자리에 바로 찍는다
          onStrokeComplete({ points: stampPoints(tool, point), color, size, brushType: brush });
          return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        isPointerDown.current = true;
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
          onStrokeComplete({ points: currentStroke.current, color, size, brushType: brush });
        }
        currentStroke.current = [];
      }}
    />
  );
}
