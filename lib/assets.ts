import type { Station } from "./gameState";

// 나중에 실제 그림 에셋이 생기면 경로만 채우면 되는 자리 (7장 "이미지 에셋 최소화" — 지금은 전부 CSS로 그린다).
// 파일은 public/images/ 아래에 두고 "/images/..." 로 적는다. null이면 CSS로 그린 기본 배경을 쓴다.
export const STATION_BACKGROUNDS: Record<Station, string | null> = {
  order: null, // 예: "/images/backgrounds/shop.png"
  base: null, // 예: "/images/backgrounds/base.png"
  oven: null,
  cream: null,
  decorate: null,
};

// 재료 그림은 lib/materials.ts의 각 재료에 image 필드로 넣는다 (예: image: "/images/materials/base_vanilla.png").
