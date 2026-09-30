"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { CakeData, MaterialRegistry } from "@/lib/gameState";
import { findMaterial } from "@/lib/materials";
import { BATTER_TARGET, getBakedColor, getBakedRatio } from "@/lib/gameLogic";
import { FROSTING_GRID, ON_CAKE_CELLS, SIDE_SEGMENTS, sideThickness } from "@/lib/frosting";
import { rainbowColor } from "@/lib/decoration";
import { MaterialGlyph } from "../MaterialGlyph";
import { StickerGlyph } from "./StickerGlyph";

// 케이크를 데이터만 보고 다시 그리는 선언적 렌더러 모음 (cake-tycoon-prompt.md 16장).
// - CakeTopView: 위에서 내려다본 평면. 데코 단계(Top View 연출)와 입체 케이크 윗면의 원본으로 쓴다.
// - CakeInsideView: 시트를 가로로 갈라 필링을 바르는 아랫단 단면.
// - Cake3D: 윗면(타원) + 옆면이 보이는 입체 케이크. 데코 단계를 뺀 나머지 화면은 모두 이걸로 그린다.


export const TOP_VIEW_PX = 224; // 평면 케이크 기준 크기. 자유 그림/텍스트 좌표계(%)와 크기 비율의 기준 (DrawingCanvas와 동일)
const ELLIPSE_RATIO = 0.42; // 입체 케이크 윗면 타원의 세로/가로 비율 (비스듬히 내려다보는 각도)

const hexToRgb = (hex: string) => {
  const value = parseInt(hex.replace("#", ""), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
};

// 아주 얇게 발린 크림은 반투명(시트가 비침), 조금만 쌓여도 불투명
const creamAlpha = (thickness: number) => Math.min(1, thickness / 0.3);
// 두께가 늘수록 계속 봉긋해 보이게 하는 정도(0~1). 불투명해진 뒤에도 짜는 만큼 모양이 변해야
// "누르고 있는 동안 크림이 쌓인다"가 눈에 보인다 (예전엔 금방 포화돼서 떼야 반영되는 것처럼 보였음)
const creamPuff = (thickness: number) => Math.min(1, Math.max(0, thickness / 2));

const DEFAULT_SHEET_COLOR = "#f2e9da";

// 구운 정도가 반영된 시트 색 (오븐 안에서는 now를 넘겨 실시간으로)
const sheetColorOf = (cake: CakeData, baseColor: string | undefined, now?: number) =>
  getBakedColor(
    baseColor ?? DEFAULT_SHEET_COLOR,
    getBakedRatio(cake.baking, now ?? cake.baking.endTime ?? cake.baking.startTime ?? 0)
  );

type CakeTopViewProps = {
  cake: CakeData;
  materials: MaterialRegistry;
  now?: number;
  showToppings?: boolean; // 입체 케이크는 토핑을 윗면에 눕히지 않고 따로 세워서 그리므로 끈다
  showDecoration?: boolean; // 완성 케이크(스냅샷)에서 자유 그림/텍스트까지 그릴 때
};

export function CakeTopView({ cake, materials, now, showToppings = true, showDecoration = false }: CakeTopViewProps) {
  const base = cake.base ? findMaterial(materials, cake.base) : undefined;
  const cream = findMaterial(materials, cake.frosting.materialId ?? "");

  return (
    <div className="relative shrink-0" style={{ width: TOP_VIEW_PX, height: TOP_VIEW_PX }}>
      <div
        className="absolute inset-0 rounded-full shadow-[inset_0_-6px_0_rgba(0,0,0,0.08)]"
        style={{ backgroundColor: sheetColorOf(cake, base?.color, now) }}
      />
      <CreamCanvas cells={cake.frosting.cells} color={cream?.color ?? "#fffaf0"} />
      {showToppings && <FlatToppings cake={cake} materials={materials} />}
      {showDecoration && <DecorationLayer cake={cake} />}
    </div>
  );
}

export function CakeInsideView({ cake, materials }: { cake: CakeData; materials: MaterialRegistry }) {
  const base = cake.base ? findMaterial(materials, cake.base) : undefined;
  const filling = findMaterial(materials, cake.filling.materialId ?? "");

  return (
    <div className="relative shrink-0" style={{ width: TOP_VIEW_PX, height: TOP_VIEW_PX }}>
      {/* 갈라진 단면: 겉(구운 껍질) 테두리 안쪽으로 밝은 속살이 보인다 */}
      <div
        className="absolute inset-0 rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.2)]"
        style={{ backgroundColor: sheetColorOf(cake, base?.color) }}
      />
      <div
        className="absolute inset-[5%] rounded-full"
        style={{
          backgroundColor: base?.color ?? DEFAULT_SHEET_COLOR,
          backgroundImage: "radial-gradient(rgba(160,120,70,0.18) 1px, transparent 1.5px)",
          backgroundSize: "9px 9px",
        }}
      />
      <CreamCanvas cells={cake.filling.cells} color={filling?.color ?? "#ff6f91"} />
    </div>
  );
}

type Cake3DProps = {
  cake: CakeData;
  materials: MaterialRegistry;
  size: number; // 케이크 가로 폭(px)
  now?: number; // 오븐 안에서 실시간으로 익어가는 색을 그릴 때
  rotation?: number; // 회전판 각도(도). 옆면 크림 무늬가 같이 돈다
  showDecoration?: boolean;
  faceLayer?: ReactNode; // 윗면(눕혀진 평면, TOP_VIEW_PX 좌표계) 위에 같이 눕혀 그릴 것 — 토핑 그리드 등
  topOverlay?: ReactNode; // 윗면 타원을 감싸는 영역(눕히지 않음) — 포인터 입력용
  sideOverlay?: ReactNode; // 옆면 영역 — 포인터 입력용
};

export function Cake3D({
  cake,
  materials,
  size,
  now,
  rotation = 0,
  showDecoration = false,
  faceLayer,
  topOverlay,
  sideOverlay,
}: Cake3DProps) {
  const base = cake.base ? findMaterial(materials, cake.base) : undefined;
  const cream = findMaterial(materials, cake.frosting.materialId ?? "");
  const filling = findMaterial(materials, cake.filling.materialId ?? "");

  const scale = size / TOP_VIEW_PX;
  const faceHeight = size * ELLIPSE_RATIO;
  // 반죽을 적게 부으면 낮고, 많이 부으면 높은 케이크가 된다
  const heightFactor = cake.batter.amount > 0 ? Math.min(1.35, Math.max(0.55, cake.batter.amount / BATTER_TARGET)) : 1;
  const sideHeight = size * 0.26 * heightFactor;
  const toppingRoom = size * 0.14; // 윗면 위로 솟은 토핑이 잘리지 않을 여유
  const rimRadius = `${size / 2}px ${faceHeight / 2}px`;
  const hasFilling = cake.filling.cells.some((value) => value > 0.02);

  return (
    <div className="relative shrink-0" style={{ width: size, height: toppingRoom + faceHeight + sideHeight + size * 0.04 }}>
      {/* 바닥 그림자: 케이크 밑바닥 곡선에 딱 붙인다. 예전엔 바닥보다 아래로 내려와 있어서 케이크와 접시 사이에
          틈이 있는 것처럼(공중에 뜬 것처럼) 보였다 */}
      <div
        aria-hidden
        className="absolute rounded-[50%] bg-black/12 blur-[3px]"
        style={{ left: "1%", width: "98%", height: faceHeight, top: toppingRoom + sideHeight + faceHeight * 0.1 }}
      />

      {/* 옆면: 아래쪽이 타원 곡선으로 둥글게 말린 원기둥 벽 */}
      <div
        aria-hidden
        className="absolute left-0 overflow-hidden"
        style={{
          top: toppingRoom + faceHeight / 2,
          width: size,
          height: sideHeight + faceHeight / 2,
          borderBottomLeftRadius: rimRadius,
          borderBottomRightRadius: rimRadius,
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: sheetColorOf(cake, base?.color, now) }} />
        {/* 시트 사이 필링 줄 (옆에서 보이는 층) — 아래 곡선만 그려서 원기둥을 따라 휘어 보이게 한다 */}
        {hasFilling && (
          <div
            className="absolute left-0 w-full"
            style={{
              top: sideHeight * 0.42,
              height: faceHeight / 2 + sideHeight * 0.1,
              borderBottom: `${Math.max(2, sideHeight * 0.1)}px solid ${filling?.color ?? "#ff6f91"}`,
              borderBottomLeftRadius: rimRadius,
              borderBottomRightRadius: rimRadius,
            }}
          />
        )}
        <div className="absolute inset-0" style={{ background: sideCreamGradient(cake.frosting.side, rotation, cream?.color) }} />
        {/* 원기둥 음영: 양 끝이 어둡다 */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.2),transparent_22%,transparent_70%,rgba(0,0,0,0.24))]" />
      </div>

      {/* 윗면: 평면 케이크를 세로로 눌러 타원으로 눕힌다 */}
      <div
        aria-hidden
        className="absolute left-0 overflow-hidden rounded-[50%]"
        style={{ top: toppingRoom, width: size, height: faceHeight }}
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{ transform: `scale(${scale}, ${faceHeight / TOP_VIEW_PX})` }}
        >
          <CakeTopView cake={cake} materials={materials} now={now} showToppings={false} showDecoration={showDecoration} />
          {faceLayer && <div className="absolute inset-0">{faceLayer}</div>}
        </div>
        <div className="absolute inset-0 rounded-[50%] shadow-[inset_0_-2px_3px_rgba(0,0,0,0.12),inset_0_2px_2px_rgba(255,255,255,0.4)]" />
      </div>

      {/* 토핑: 윗면에 눕히지 않고 세워서 그린다. 뒤쪽(위) 토핑이 앞쪽에 가려지도록 y 순서대로 쌓는다 */}
      <div aria-hidden className="pointer-events-none absolute left-0" style={{ top: toppingRoom, width: size, height: faceHeight }}>
        {[...cake.toppings]
          .sort((a, b) => a.y - b.y)
          .map((topping, index) => {
            const material = findMaterial(materials, topping.itemId);
            if (!material) return null;
            return (
              <span
                key={index}
                className="absolute leading-none"
                style={{
                  left: `${topping.x}%`,
                  top: `${topping.y}%`,
                  transform: "translate(-50%, -80%)",
                }}
              >
                <MaterialGlyph material={material} size={24 * scale} />
              </span>
            );
          })}
      </div>

      {topOverlay && (
        <div className="absolute left-0" style={{ top: toppingRoom, width: size, height: faceHeight }}>
          {topOverlay}
        </div>
      )}
      {sideOverlay && (
        <div className="absolute left-0" style={{ top: toppingRoom + faceHeight / 2, width: size, height: sideHeight + faceHeight / 2 }}>
          {sideOverlay}
        </div>
      )}
    </div>
  );
}

// 옆면 크림: 둘레 조각별 두께를 정면에서 보이는 반원(-90°~90°)에 투영해 가로 그라데이션으로 그린다.
function sideCreamGradient(side: number[], rotation: number, color = "#fffaf0"): string {
  if (side.length === 0 || side.every((value) => value <= 0.01)) return "none";
  const { r, g, b } = hexToRgb(color);
  const columns = 28;
  const stops = Array.from({ length: columns + 1 }, (_, index) => {
    const x = index / columns;
    const worldDeg = (Math.asin(Math.max(-1, Math.min(1, 2 * x - 1))) * 180) / Math.PI;
    const cakeDeg = worldDeg - rotation;
    const segment = Math.round(((((cakeDeg % 360) + 360) % 360) / 360) * SIDE_SEGMENTS) % SIDE_SEGMENTS;
    const alpha = creamAlpha(sideThickness(side[segment] ?? 0));
    return `rgba(${r},${g},${b},${alpha.toFixed(2)}) ${(x * 100).toFixed(1)}%`;
  });
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

// 칸별 크림 두께를 canvas에 부드러운 원으로 그린다. 짜는 동안 매 프레임 바뀌므로 DOM(SVG) 대신 canvas를 쓰고,
// 화면에 그려지기 전에 동기적으로 다시 그리도록 useLayoutEffect를 쓴다 (짜는 중 화면이 한 박자 늦지 않게).
function CreamCanvas({ cells, color }: { cells: number[]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const px = Math.round(TOP_VIEW_PX * dpr);
    if (canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, TOP_VIEW_PX, TOP_VIEW_PX);

    ctx.save();
    ctx.beginPath();
    ctx.arc(TOP_VIEW_PX / 2, TOP_VIEW_PX / 2, TOP_VIEW_PX * 0.47, 0, Math.PI * 2);
    ctx.clip();

    const { r, g, b } = hexToRgb(color);
    const cell = TOP_VIEW_PX / FROSTING_GRID;
    const blobs = ON_CAKE_CELLS.filter((index) => (cells[index] ?? 0) > 0.02).map((index) => ({
      cx: ((index % FROSTING_GRID) + 0.5) * cell,
      cy: (Math.floor(index / FROSTING_GRID) + 0.5) * cell,
      thickness: cells[index],
    }));

    // 1) 그림자: 두꺼울수록 짙고 크게, 오른쪽 아래로 삐져나와 높이감을 준다
    for (const { cx, cy, thickness } of blobs) {
      const puff = creamPuff(thickness);
      ctx.fillStyle = `rgba(90,60,40,${0.18 * puff})`;
      ctx.beginPath();
      ctx.arc(cx + 1.5 + 2 * puff, cy + 2 + 2.5 * puff, cell * (0.45 + 0.25 * puff), 0, Math.PI * 2);
      ctx.fill();
    }
    // 2) 크림 본체
    for (const { cx, cy, thickness } of blobs) {
      const radius = cell * 0.9;
      const alpha = creamAlpha(thickness);
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      gradient.addColorStop(0.6, `rgba(${r},${g},${b},${alpha * 0.85})`);
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
    // 3) 하이라이트: 두꺼울수록 크고 밝게 — 봉긋하게 솟은 느낌.
    //    칸마다 또렷한 흰 점을 찍으면 물방울무늬 격자처럼 보여서, 가장자리가 사라지는 부드러운 빛으로 그린다
    for (const { cx, cy, thickness } of blobs) {
      const puff = creamPuff(thickness);
      if (puff < 0.3) continue;
      const hx = cx - 1.5 - puff;
      const hy = cy - 1.5 - puff;
      const radius = cell * (0.35 + 0.35 * puff);
      const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, radius);
      glow.addColorStop(0, `rgba(255,255,255,${0.35 * puff})`);
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(hx - radius, hy - radius, radius * 2, radius * 2);
    }
    ctx.restore();
  }, [cells, color]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}

function FlatToppings({ cake, materials }: { cake: CakeData; materials: MaterialRegistry }) {
  return cake.toppings.map((topping, index) => {
    const material = findMaterial(materials, topping.itemId);
    if (!material) return null;
    return (
      <span
        key={index}
        className="absolute -translate-x-1/2 -translate-y-1/2 leading-none"
        style={{ left: `${topping.x}%`, top: `${topping.y}%` }}
        aria-hidden
      >
        <MaterialGlyph material={material} size={24} />
      </span>
    );
  });
}

// 자유 그림 획 하나를 SVG로 (DrawingCanvas의 drawStroke와 같은 규칙: 점선 / 무지개 / 반짝이)
function StrokeSvg({ stroke }: { stroke: CakeData["drawings"][number] }) {
  const width = (stroke.size / TOP_VIEW_PX) * 100;
  if (stroke.brushType === "rainbow") {
    return (
      <g strokeWidth={width} strokeLinecap="round" fill="none">
        {stroke.points.slice(1).map((point, index) => (
          <line
            key={index}
            x1={stroke.points[index].x}
            y1={stroke.points[index].y}
            x2={point.x}
            y2={point.y}
            stroke={rainbowColor(index + 1)}
          />
        ))}
      </g>
    );
  }
  return (
    <g>
      <polyline
        points={stroke.points.map((point) => `${point.x},${point.y}`).join(" ")}
        fill="none"
        stroke={stroke.color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={stroke.brushType === "dashed" ? `${width * 1.2} ${width * 2.2}` : undefined}
      />
      {stroke.brushType === "sparkle" &&
        stroke.points
          .filter((_, index) => index % 3 === 0)
          .map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r={Math.max(0.45, width * 0.32)} fill="rgba(255,255,255,0.95)" />
          ))}
    </g>
  );
}

// 자유 그림은 Canvas 대신 같은 % 좌표계의 SVG로, 텍스트·스티커는 DOM으로 다시 그린다 (16장 "데이터에서 다시 그리기")
function DecorationLayer({ cake }: { cake: CakeData }) {
  return (
    <>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        {cake.drawings.map((stroke, index) => (
          <StrokeSvg key={index} stroke={stroke} />
        ))}
      </svg>
      {(cake.decorations ?? []).map((sticker, index) => (
        <span
          key={`sticker-${index}`}
          className="absolute leading-none"
          style={{
            left: `${sticker.x}%`,
            top: `${sticker.y}%`,
            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
          }}
          aria-hidden
        >
          <StickerGlyph sticker={sticker} />
        </span>
      ))}
      {cake.text.map((text, index) => (
        <span
          key={index}
          className="absolute rounded px-1 font-bold whitespace-nowrap"
          style={{
            left: `${text.x}%`,
            top: `${text.y}%`,
            color: text.color,
            fontFamily: text.font,
            transform: `translate(-50%, -50%) rotate(${text.rotation}deg) scale(${text.scale})`,
          }}
          aria-hidden
        >
          {text.content}
        </span>
      ))}
    </>
  );
}
