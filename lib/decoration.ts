import type { CakeDrawing } from './gameState';

// 데코레이션 단계(cake-tycoon-prompt.md 5장/6장) 좌표 계산. 좌표는 모두 케이크 영역 대비 %(0~100).

type Point = { x: number; y: number };

// 케이크(원) 중심에서 이 반경(%) 밖으로는 텍스트가 나가지 않게 한다 (6장 "케이크 영역 밖으로 나가지 않도록")
const TEXT_MAX_RADIUS = 42;

export function clampToCake(point: Point, maxRadius: number = TEXT_MAX_RADIUS): Point {
  const dx = point.x - 50;
  const dy = point.y - 50;
  const distance = Math.hypot(dx, dy);
  if (distance <= maxRadius) return point;
  const ratio = maxRadius / distance;
  return { x: 50 + dx * ratio, y: 50 + dy * ratio };
}

function distanceToSegment(point: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSq = abx * abx + aby * aby;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * abx + (point.y - a.y) * aby) / lengthSq));
  return Math.hypot(point.x - (a.x + abx * t), point.y - (a.y + aby * t));
}

// ---- 모양 도장 (4장 "선·하트·별 그리기") ----
// 케이크를 톡 누르면 그 자리에 모양 하나를 "획"으로 찍는다 — 일반 그림과 같은 데이터라 지우개·실행 취소·
// 결과 카드 다시 그리기가 그대로 된다.
export type StampShape = 'heart' | 'star' | 'circle';
export const STAMP_RADIUS = 9; // 모양 크기 (케이크 대비 %)

export function stampPoints(shape: StampShape, center: Point, radius: number = STAMP_RADIUS): Point[] {
  const points: Point[] = [];
  if (shape === 'circle') {
    for (let i = 0; i <= 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      points.push({ x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
    }
  } else if (shape === 'star') {
    for (let i = 0; i <= 10; i++) {
      const angle = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const r = i % 2 === 0 ? radius : radius * 0.45;
      points.push({ x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r });
    }
  } else {
    // 하트 곡선 (x = 16 sin³t, y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t)
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      const x = 16 * Math.sin(t) ** 3;
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      points.push({ x: center.x + (x / 17) * radius, y: center.y - (y / 17) * radius });
    }
  }
  return points.map((point) => clampToCake(point, 48));
}

// ---- 펜 종류 (CakeDrawing.brushType) ----
export type BrushType = 'basic' | 'dashed' | 'rainbow' | 'sparkle';
export const BRUSHES: { type: BrushType; label: string; emoji: string }[] = [
  { type: 'basic', label: '기본 펜', emoji: '✏️' },
  { type: 'dashed', label: '점선 펜', emoji: '┅' },
  { type: 'rainbow', label: '무지개 펜', emoji: '🌈' },
  { type: 'sparkle', label: '반짝이 펜', emoji: '✨' },
];
// 무지개 펜: 선을 따라 색이 바뀐다 (i번째 마디의 색)
export const rainbowColor = (segment: number) => `hsl(${(segment * 14) % 360} 85% 62%)`;

// ---- 스티커 (CakeDecoration type "sticker") ----
// 윈도우 10에서도 보이는 이모지만
export const STICKERS = ['❤️', '💕', '⭐', '✨', '🌸', '🌷', '🎀', '🦋', '🍒', '🎂', '🐰', '🐻', '👑', '💎', '🎈', '🌈'];
export const STICKER_SCALE = { min: 0.6, max: 2.2, step: 0.2 };

// 지우개: 픽셀 단위로 긁어내는 대신, 지우개가 닿은 획을 통째로 지운다.
// 그림 데이터가 항상 "획 목록"으로 유지되어 결과 카드 등 다른 곳에서도 그대로 다시 그릴 수 있다.
export function eraseStrokesAt(drawings: CakeDrawing[], point: Point, radius: number): CakeDrawing[] {
  return drawings.filter((stroke) => {
    if (stroke.points.length === 1) return Math.hypot(point.x - stroke.points[0].x, point.y - stroke.points[0].y) > radius;
    for (let i = 1; i < stroke.points.length; i += 1) {
      if (distanceToSegment(point, stroke.points[i - 1], stroke.points[i]) <= radius) return false;
    }
    return true;
  });
}
