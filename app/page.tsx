import { ShopScreen } from "@/components/shop/ShopScreen";

export default function Home() {
  return (
    <>
      <div className="rotate-notice fixed inset-0 z-50 flex-col items-center justify-center gap-3 bg-[var(--theme-background)] p-8 text-center">
        <span className="text-4xl" aria-hidden>
          📱
        </span>
        <p className="text-base font-semibold">화면을 가로로 돌려주세요</p>
      </div>
      <ShopScreen />
    </>
  );
}
