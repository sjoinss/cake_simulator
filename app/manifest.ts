import type { MetadataRoute } from "next";

// 정적 내보내기라 빌드 때 manifest.webmanifest 파일로 만들어진다
export const dynamic = "force-static";

// GitHub Pages 하위 경로(/cake_simulator). 매니페스트 안의 경로엔 Next가 알아서 붙여주지 않는다
const base = process.env.PAGES_BASE_PATH ?? "";

// 홈 화면에 추가(앱 설치)했을 때의 모습: 주소창·상태 표시줄 없이 전체 화면, 가로 고정
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${base}/`,
    name: "케이크 타이쿤",
    short_name: "케이크 타이쿤",
    description: "모바일 가로 화면으로 즐기는 캐주얼 케이크 타이쿤 게임",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "fullscreen",
    // fullscreen을 못 하는 브라우저는 차례로 다음 방식을 쓴다
    display_override: ["fullscreen", "standalone"],
    orientation: "landscape",
    background_color: "#fdf6f2",
    theme_color: "#f8d7cf",
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${base}/icons/maskable-512.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
