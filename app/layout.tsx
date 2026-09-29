import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const base = process.env.PAGES_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "케이크 타이쿤",
  description: "모바일 가로 화면으로 즐기는 캐주얼 케이크 타이쿤 게임",
  // 홈 화면에 추가했을 때 (안드로이드는 app/manifest.ts, iOS는 아래 appleWebApp) 주소창 없이 앱처럼 뜬다
  appleWebApp: { capable: true, title: "케이크 타이쿤", statusBarStyle: "black-translucent" },
  icons: {
    icon: [{ url: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png" }],
    apple: [{ url: `${base}/icons/apple-touch-icon.png`, sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8d7cf",
  // 카메라 홀(노치) 자리까지 화면을 쓴다. 조작 요소는 globals.css의 --safe-l/r/b만큼 안쪽으로 민다
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      data-theme="pink"
      // 저장된 테마를 브라우저에서 바로 입히므로(lib/theme.ts) 서버 값(pink)과 달라도 된다
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
