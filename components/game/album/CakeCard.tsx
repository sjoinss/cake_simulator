import { forwardRef } from "react";
import type { MaterialRegistry } from "@/lib/gameState";
import type { AlbumEntry } from "@/lib/album";
import { Polaroid } from "./Polaroid";

export const CARD_WIDTH = 800;
export const CARD_HEIGHT = 540;

const SCORE_ROWS: { key: "accuracy" | "quality" | "speed"; label: string; emoji: string }[] = [
  { key: "accuracy", label: "주문 정확도", emoji: "🧾" },
  { key: "quality", label: "제작 품질", emoji: "🥣" },
  { key: "speed", label: "속도", emoji: "⏱️" },
];

const stars = (total: number) => (total >= 90 ? 3 : total >= 70 ? 2 : 1);
const formatDate = (time: number) => {
  const date = new Date(time);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

// 이미지로 저장하는 케이크 카드 (800x540 고정). 왼쪽에 폴라로이드(케이크 + 손글씨 이름), 오른쪽에 그때 받은 점수 막대.
// 화면에서는 바깥에서 줄여서 보여주고, 저장할 때는 이 요소를 그대로 PNG로 찍는다 (lib/cardImage.ts)
export const CakeCard = forwardRef<HTMLDivElement, { entry: AlbumEntry; materials: MaterialRegistry }>(
  function CakeCard({ entry, materials }, ref) {
    // 망친 케이크는 별이 없다
    const starCount = entry.failReason ? 0 : stars(entry.scores.total);
    return (
      <div
        ref={ref}
        className="relative flex shrink-0 items-center gap-10 overflow-hidden rounded-[28px] px-12 text-[var(--theme-text)]"
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          backgroundColor: "var(--theme-background)",
          backgroundImage:
            "radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 35%, transparent) 2.5px, transparent 3px)",
          backgroundSize: "28px 28px",
          fontFamily: "var(--font-geist-sans), 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
        }}
      >
        {/* 테두리 장식 */}
        <div aria-hidden className="pointer-events-none absolute inset-3 rounded-[22px] border-[3px] border-dashed border-[color-mix(in_srgb,var(--theme-accent)_45%,white)]" />
        <span aria-hidden className="absolute top-7 left-9 rotate-[-12deg] text-4xl">✨</span>
        <span aria-hidden className="absolute right-10 bottom-7 rotate-[10deg] text-4xl">🍓</span>

        <div className="relative z-10 mt-2">
          <Polaroid cake={entry.cake} materials={materials} name={entry.name} size="lg" tilt={-3} />
        </div>

        <div className="relative z-10 flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="self-start rounded-full bg-[var(--theme-accent)] px-4 py-1 text-sm font-extrabold tracking-[0.2em] text-white">
              CAKE CARD
            </span>
            <p className="mt-1 text-2xl font-extrabold">{entry.shopName}</p>
            <p className="text-base font-bold opacity-60">
              DAY {entry.day}
              {entry.orderNumber != null && ` · #${entry.orderNumber} 주문`}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 rounded-2xl bg-white/85 p-4 shadow-[0_4px_10px_rgba(60,30,20,0.08)]">
            {SCORE_ROWS.map(({ key, label, emoji }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-28 text-[15px] font-bold whitespace-nowrap">
                  <span className="mr-1">{emoji}</span>
                  {label}
                </span>
                <span className="relative h-3.5 flex-1 overflow-hidden rounded-full bg-black/8">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-[var(--theme-accent)]"
                    style={{ width: `${entry.scores[key]}%` }}
                  />
                </span>
                <span className="w-12 text-right text-[15px] font-extrabold tabular-nums">{entry.scores[key]}%</span>
              </div>
            ))}
            <div className="mt-1 flex items-center justify-between border-t-2 border-dashed border-black/10 pt-3">
              <span className="text-lg font-extrabold tracking-wider">TOTAL</span>
              <span className="flex items-center gap-2">
                <span className="text-2xl tracking-tight">
                  {"★".repeat(starCount)}
                  <span className="opacity-20">{"★".repeat(3 - starCount)}</span>
                </span>
                <span className="text-4xl font-extrabold text-[var(--theme-accent)] tabular-nums">{entry.scores.total}%</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {entry.failReason ? (
              <span className="rotate-[-4deg] rounded-md border-[3px] border-red-500 bg-white px-3 py-0.5 text-sm font-extrabold whitespace-nowrap text-red-500">
                😠 {entry.failReason}
              </span>
            ) : entry.tip > 0 ? (
              <span className="rotate-[-3deg] rounded-full border-2 border-[var(--theme-accent)] bg-white px-3 py-1 text-sm font-extrabold text-[var(--theme-accent)]">
                🎨 데코 칭찬!
              </span>
            ) : (
              <span />
            )}
            <span className="text-sm font-bold opacity-50">{formatDate(entry.servedAt)}</span>
          </div>
        </div>
      </div>
    );
  },
);
