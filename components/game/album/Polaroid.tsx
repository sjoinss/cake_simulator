import type { CakeData, MaterialRegistry } from "@/lib/gameState";
import { CakeSnapshot } from "@/components/game/cake/CakeSnapshot";

type PolaroidProps = {
  cake: CakeData;
  materials: MaterialRegistry;
  name: string; // 아래 여백에 손글씨로 (없으면 빈칸)
  size: "sm" | "lg";
  tilt?: number; // 살짝 기울인 각도 (deg)
};

// 폴라로이드 사진 한 장: 흰 테두리(아래가 두꺼움) + 테이프 + 사진 속 케이크 + 아래 여백에 손글씨 이름.
// 앨범 목록, 결산의 케이크 고르기, 저장용 카드 이미지에서 같이 쓴다
export function Polaroid({ cake, materials, name, size, tilt = 0 }: PolaroidProps) {
  const large = size === "lg";
  return (
    <div
      className={`relative flex shrink-0 flex-col bg-white shadow-[0_6px_14px_rgba(60,30,20,0.22)] ${
        large ? "w-[340px] p-[16px] pb-0" : "w-[116px] p-[7px] pb-0"
      }`}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      {/* 테이프 */}
      <span
        aria-hidden
        className={`absolute left-1/2 -translate-x-1/2 rotate-[-4deg] bg-[color-mix(in_srgb,var(--theme-accent)_45%,white)] opacity-80 ${
          large ? "-top-4 h-8 w-28" : "-top-2 h-4 w-12"
        }`}
      />
      {/* 사진: 파스텔 벽 + 나무 조리대 위 케이크 */}
      <div
        className={`relative flex items-end justify-center overflow-hidden ${large ? "h-[300px]" : "h-[100px]"}`}
        style={{
          background:
            "linear-gradient(180deg, var(--theme-wall) 0 62%, #e7c3a0 62% 88%, #c99466 88%)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1.5px, transparent 2px)",
            backgroundSize: large ? "22px 22px" : "12px 12px",
            height: "62%",
          }}
        />
        <div className={large ? "mb-[28px]" : "mb-[9px]"}>
          <CakeSnapshot cake={cake} materials={materials} size={large ? 240 : 70} label="케이크" />
        </div>
      </div>
      {/* 아래 여백: 손글씨 이름 */}
      <p
        className={`flex items-center justify-center truncate text-[var(--theme-text)] ${
          large ? "h-[78px] px-2 text-[40px]" : "h-[30px] px-1 text-[17px]"
        }`}
        style={{ fontFamily: "var(--font-hand), cursive" }}
      >
        {name}
      </p>
    </div>
  );
}
