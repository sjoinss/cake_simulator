"use client";

import { useState } from "react";
import { sounds } from "@/lib/sound";
import { useMountSound } from "@/hooks/useMountSound";
import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";
import type { DayProgress, ServedCakeRecord } from "@/lib/gameState";
import { ALBUM_NAME_MAX } from "@/lib/album";
import { Polaroid } from "./album/Polaroid";

export type AlbumPick = { record: ServedCakeRecord; name: string };

type DayEndCardProps = {
  day: number;
  today: DayProgress;
  // 다음 날 시작. 고른 케이크는 앨범에 담는다 — 저장에 실패하면 false (넘어가지 않고 알린다)
  onNextDay: (picks: AlbumPick[]) => boolean;
  onOpenShop: () => void; // 다음 날 전에 재료·장비 사기
};

// 하루 마감 결산: 오늘 손님을 다 서빙하고 가게가 비면 뜬다.
// 1) 손님 수·번 돈·평균 점수 → 2) 오늘 만든 케이크 중 앨범에 담을 것 고르기(이름은 붙여도 되고 안 붙여도 됨) → 다음 날
export function DayEndCard({ day, today, onNextDay, onOpenShop }: DayEndCardProps) {
  useMountSound(sounds.dayEnd);
  const [step, setStep] = useState<"summary" | "album">("summary");
  const averageScore = today.served > 0 ? Math.round(today.scoreTotal / today.served) : 0;
  const hasCakes = today.cakes.length > 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-4 short:p-2">
      {step === "summary" ? (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-end-title"
          className="animate-result-pop flex w-80 max-w-full flex-col items-center gap-4 rounded-2xl bg-[#fff8ef] p-6 text-center text-[var(--theme-text)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] short:gap-2 short:p-4"
        >
          <h2 id="day-end-title" className="text-2xl font-extrabold short:text-xl">
            DAY {day} 마감
          </h2>
          <dl className="grid w-full grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5 rounded-xl bg-white/80 py-2">
              <dt className="text-xs text-[var(--theme-text)]/60">손님</dt>
              <dd className="text-xl font-extrabold tabular-nums short:text-lg">{today.served}명</dd>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl bg-white/80 py-2">
              <dt className="text-xs text-[var(--theme-text)]/60">번 돈</dt>
              <dd className="text-xl font-extrabold text-[var(--theme-accent)] tabular-nums short:text-lg">
                ${today.money}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 rounded-xl bg-white/80 py-2">
              <dt className="text-xs text-[var(--theme-text)]/60">평균 점수</dt>
              <dd className="text-xl font-extrabold tabular-nums short:text-lg">{averageScore}%</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onOpenShop}
            className="-mb-2 w-full rounded-full bg-white px-6 py-2 text-sm font-bold shadow-sm transition-transform active:scale-95 short:-mb-1 short:py-1"
          >
            🛒 상점 들르기
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => (hasCakes ? setStep("album") : onNextDay([]))}
            className="w-full rounded-full bg-[var(--theme-accent)] px-6 py-2.5 text-base font-bold text-white shadow-sm transition-transform active:scale-95 short:py-1.5"
          >
            {hasCakes ? "📸 오늘의 케이크 보기 →" : `DAY ${day + 1} 시작`}
          </button>
        </section>
      ) : (
        <AlbumPicker day={day} cakes={today.cakes} onBack={() => setStep("summary")} onDone={onNextDay} />
      )}
    </div>
  );
}

// 오늘 만든 케이크를 폴라로이드로 늘어놓고, 누르면 골라진다. 고른 케이크 아래엔 이름 칸이 생긴다
function AlbumPicker({
  day,
  cakes,
  onBack,
  onDone,
}: {
  day: number;
  cakes: ServedCakeRecord[];
  onBack: () => void;
  onDone: (picks: AlbumPick[]) => boolean;
}) {
  const materials = useMaterialRegistry();
  const [names, setNames] = useState<Record<string, string>>({}); // 고른 케이크 id → 이름 (빈 문자열 = 이름 없음)
  const [error, setError] = useState(false);
  const pickedCount = Object.keys(names).length;

  const toggle = (id: string) => {
    sounds.pop();
    setNames((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = "";
      return next;
    });
  };

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="album-pick-title"
      className="animate-result-pop flex max-h-full w-[44rem] max-w-full flex-col gap-3 rounded-2xl bg-[#fff8ef] p-5 text-[var(--theme-text)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] short:gap-1.5 short:p-3"
    >
      <div className="text-center">
        <h2 id="album-pick-title" className="text-xl font-extrabold short:text-base">
          📸 오늘의 케이크
        </h2>
        <p className="text-xs opacity-70">앨범에 담을 케이크를 눌러 골라요. 이름은 붙여도 되고 안 붙여도 돼요</p>
      </div>

      <ul className="flex min-h-0 gap-4 overflow-x-auto px-2 pt-4 pb-2 [scrollbar-width:thin] short:pt-3">
        {cakes.map((record, index) => {
          const picked = record.id in names;
          return (
            <li key={record.id} className="flex w-32 shrink-0 flex-col items-center gap-1.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={picked}
                aria-label={`${record.orderNumber != null ? `#${record.orderNumber} ` : ""}케이크, ${record.scores.total}점`}
                onClick={() => toggle(record.id)}
                className={`relative transition-transform ${picked ? "-translate-y-1.5 scale-105" : "opacity-80 hover:opacity-100"}`}
              >
                <Polaroid
                  cake={record.cake}
                  materials={materials}
                  name={names[record.id] ?? ""}
                  size="sm"
                  tilt={index % 2 ? 2 : -2}
                />
                <span
                  aria-hidden
                  className={`absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-sm font-extrabold shadow ${
                    picked ? "bg-[var(--theme-accent)] text-white" : "bg-white/90 text-transparent"
                  }`}
                >
                  ✔
                </span>
              </button>
              <span className="text-[11px] font-bold opacity-60">
                {record.orderNumber != null && `#${record.orderNumber} · `}
                {record.scores.total}%
              </span>
              {picked && (
                <input
                  value={names[record.id]}
                  maxLength={ALBUM_NAME_MAX}
                  onChange={(event) => setNames((prev) => ({ ...prev, [record.id]: event.target.value }))}
                  placeholder="이름 (선택)"
                  aria-label="케이크 이름"
                  className="w-full rounded-full border border-black/10 bg-white px-2.5 py-1 text-center text-xs"
                />
              )}
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="text-center text-xs font-bold text-red-600">
          앨범 저장 공간이 부족해요. 앨범에서 몇 장 빼고 다시 해 주세요.
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="rounded-full px-3 py-1.5 text-sm font-bold hover:bg-black/5">
          ← 결산
        </button>
        <button
          type="button"
          onClick={() => {
            const picks = cakes.filter((record) => record.id in names).map((record) => ({ record, name: names[record.id] }));
            setError(!onDone(picks));
          }}
          className="rounded-full bg-[var(--theme-accent)] px-6 py-2 text-sm font-extrabold text-white shadow-sm transition-transform active:scale-95 short:py-1.5"
        >
          {pickedCount > 0 ? `📔 ${pickedCount}장 담고 DAY ${day + 1} 시작` : `담지 않고 DAY ${day + 1} 시작`}
        </button>
      </div>
    </section>
  );
}
