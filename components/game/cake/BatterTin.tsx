import type { CakeData, MaterialRegistry } from "@/lib/gameState";
import { BATTER_MAX } from "@/lib/gameLogic";
import { findMaterial } from "@/lib/materials";

type BatterTinProps = {
  cake: CakeData;
  materials: MaterialRegistry;
  width: number; // 틀 가로 폭(px)
};

// 반죽을 부어 둔 케이크 틀 (옆에서 본 모습). 시트 스테이션의 틀과 같은 모양으로, 반죽 재료 색과 부은 양만큼 차 있다.
// 오븐 대기 줄에 세워 두고 오븐 칸으로 끌어다 넣는다.
export function BatterTin({ cake, materials, width }: BatterTinProps) {
  const base = cake.base ? findMaterial(materials, cake.base) : undefined;
  const levelPercent = Math.min(100, (cake.batter.amount / BATTER_MAX) * 100);
  const border = Math.max(2, Math.round(width / 52));

  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-b-[22%] border-t-0 border-[#9aa3ad] bg-[#e7ebef] shadow-[inset_0_-4px_8px_rgba(0,0,0,0.12),0_4px_8px_rgba(0,0,0,0.18)]"
      style={{ width, height: width * 0.54, borderWidth: border, borderTopWidth: 0 }}
    >
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: `${levelPercent}%`,
          backgroundColor: base?.color ?? "#f2e9da",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.5)",
        }}
      />
    </div>
  );
}
