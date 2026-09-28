import type { CakeData, MaterialRegistry } from "@/lib/gameState";
import { Cake3D } from "./CakeRenderer";

type CakeSnapshotProps = {
  cake: CakeData;
  materials: MaterialRegistry;
  size: number; // 케이크 가로 폭(px). 높이는 케이크 모양(반죽 양)에 따라 정해진다
  label: string;
  now?: number; // 오븐 안에서 실시간으로 익어가는 색을 그릴 때만 넘긴다
};

// 조작 없이 보여주는 입체 케이크 (오븐, 계산대, 서빙 중 드래그, 결과 카드, 손님 테이블 위 등).
// 자유 그림/텍스트까지 윗면에 그대로 다시 그린다.
export function CakeSnapshot({ cake, materials, size, label, now }: CakeSnapshotProps) {
  return (
    <div role="img" aria-label={label} className="pointer-events-none shrink-0">
      <Cake3D cake={cake} materials={materials} size={size} now={now} showDecoration />
    </div>
  );
}
