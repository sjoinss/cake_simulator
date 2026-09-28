import type { Station } from "@/lib/gameState";
import { STATION_BACKGROUNDS, withBasePath } from "@/lib/assets";

// 제작 스테이션 배경: 위쪽은 파스텔 타일 벽, 아래쪽은 매장 계산대와 같은 나무 조리대 (케이크가 놓이는 곳).
// lib/assets.ts의 STATION_BACKGROUNDS에 그림 경로를 넣으면 CSS로 그린 배경 대신 그 그림을 깐다.
export function StationBackdrop({ station }: { station: Station }) {
  const image = STATION_BACKGROUNDS[station];

  if (image) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${withBasePath(image)})` }}
      />
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 타일 벽 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#f9e6de",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.7) 1.5px, transparent 1.5px)",
          backgroundSize: "34px 34px",
        }}
      />
      {/* 벽 위쪽 은은한 그늘 */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-[linear-gradient(180deg,rgba(74,55,51,0.08),transparent)]" />
      {/* 조리대: 넓은 상판(위에서 내려다보는 면) + 얇은 앞면. 매장 계산대와 같은 톤 */}
      <div className="absolute inset-x-0 bottom-0 h-[30%]">
        <div className="absolute inset-x-0 top-0 h-[72%] bg-[#e7c3a0] shadow-[inset_0_3px_0_rgba(255,255,255,0.45),0_-3px_8px_rgba(0,0,0,0.06)]" />
        <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[#b98559] shadow-[inset_0_2px_0_rgba(255,255,255,0.15)]" />
      </div>
    </div>
  );
}
