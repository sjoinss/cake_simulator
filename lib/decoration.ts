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
