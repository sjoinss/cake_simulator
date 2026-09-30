import type { Station } from './gameState';

// 사이트가 하위 경로(GitHub Pages의 /cake_simulator 등)에 올라가 있을 때 public/ 파일 경로 앞에 그 경로를 붙인다.
// next.config.ts가 NEXT_PUBLIC_BASE_PATH를 넣어준다. 아래 경로들은 "/images/..."처럼 적고, 쓰는 곳에서 이걸 거친다.
export const withBasePath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;

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

// 주인 캐릭터 기본 그림 (매장 화면 계산대 뒤). 플레이어가 그림을 끌어다 놓으면 그게 우선이고, X를 누르면 이걸로 돌아온다.
// null이면 크기를 가늠하는 반투명 네모 자리만 보여준다.
// 자리 크기: 넓은 화면 224x384px, 폰 가로 144x224px — 이 비율(약 3:5)로 발끝이 아래에 오게 그리면 된다.
// 아래쪽 1/4쯤은 계산대 뒤로 가려진다.
export const DEFAULT_OWNER_IMAGE: string | null = null; // 예: "/images/characters/owner.png"

// 손님 모습 종류 수. 종류마다 평소 모습 + 케이크를 먹는 모습 두 장을 "가게 꾸미기" 창에서 넣는다 (브라우저에 저장).
// 손님 그림 자리: 64x64px(폰 48x48px), 발끝/몸 아래쪽이 테이블에 살짝 가려진다.
export const CUSTOMER_LOOK_COUNT = 6;

// 손님 기본 그림 (종류마다 평소/먹는 중). 플레이어가 그 칸에 평소 모습을 넣으면 그 종류는 플레이어 그림이 우선이고,
// 비워 두면 이 기본 그림이 나온다. null이면 이모지 손님. 먹는 중이 null이면 평소 그림을 쓴다.
// 크기: 256x256 투명 PNG 권장 (화면에선 64x64, 폰 48x48)
export const DEFAULT_CUSTOMER_IMAGES: { idle: string | null; eating: string | null }[] = Array.from(
  { length: CUSTOMER_LOOK_COUNT },
  () => ({ idle: null, eating: null }), // 예: { idle: "/images/customers/1-idle.png", eating: "/images/customers/1-eating.png" }
);
