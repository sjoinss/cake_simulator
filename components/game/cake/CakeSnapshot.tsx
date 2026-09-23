import type { ActiveOrder, MaterialRegistry } from "@/lib/gameState";
import { CakeRenderer } from "./CakeRenderer";

type CakeSnapshotProps = {
  cake: ActiveOrder["cake"];
  materials: MaterialRegistry;
  size: number; // 표시할 한 변 크기(px)
  label: string;
};

// 제작 화면 케이크와 같은 크기(14rem)로 그린 뒤 통째로 축소한다. 토핑 이모지/텍스트 크기 비율까지
// 제작 화면과 똑같이 유지되도록 하기 위함 (DrawingCanvas의 CANVAS_PX와 동일 기준).
const BASE_PX = 224;

// 완성된 케이크를 조작 없이 보여주는 읽기 전용 렌더러 (결과 카드, 손님 테이블 위 등).
// 자유 그림은 Canvas 대신 같은 % 좌표계의 SVG polyline으로 다시 그린다 (16장 "데이터에서 다시 그리기" 원칙).
export function CakeSnapshot({ cake, materials, size, label }: CakeSnapshotProps) {
  return (
    <div role="img" aria-label={label} className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="pointer-events-none absolute top-0 left-0 origin-top-left"
        style={{ width: BASE_PX, height: BASE_PX, transform: `scale(${size / BASE_PX})` }}
      >
        <CakeRenderer cake={cake} materials={materials} />
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          {cake.drawings.map((stroke, index) => (
            <polyline
              key={index}
              points={stroke.points.map((point) => `${point.x},${point.y}`).join(" ")}
              fill="none"
              stroke={stroke.color}
              strokeWidth={(stroke.size / BASE_PX) * 100}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
        {cake.text.map((text, index) => (
          <span
            key={index}
            className="absolute rounded px-1 font-bold whitespace-nowrap"
            style={{
              left: `${text.x}%`,
              top: `${text.y}%`,
              color: text.color,
              transform: `translate(-50%, -50%) rotate(${text.rotation}deg) scale(${text.scale})`,
            }}
            aria-hidden
          >
            {text.content}
          </span>
        ))}
      </div>
    </div>
  );
}
