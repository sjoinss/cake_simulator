"use client";

import { useState, type ReactNode } from "react";
import type { GameState } from "@/lib/gameState";
import { getTutorialStep, TUTORIAL_PHASES } from "@/lib/tutorial";
import { useNow } from "@/hooks/useNow";
import { TutorialSpotlight } from "./TutorialSpotlight";

type TutorialCoachProps = {
  state: GameState;
  paused: boolean; // 결과 카드·상점 같은 창이 떠 있으면 잠깐 숨긴다
  onFinish: () => void; // 건너뛰기 / 마지막 카드 확인
};

// 첫 플레이 안내 (lib/tutorial.ts가 다음 할 일을 계산한다).
// - 처음: 환영 카드
// - 진행 중: 왼쪽 위에 파티셰 캐릭터 + 큰 말풍선("STEP n/6 · 단계", 할 일 한 줄, 보충 한 줄),
//   할 곳만 밝게 남기고 주변을 어둡게 깐다 (TutorialSpotlight)
// - 첫 서빙 후: 축하 카드
export function TutorialCoach({ state, paused, onFinish }: TutorialCoachProps) {
  // 오븐에 케이크가 있으면 "꺼낼 때"를 알아채도록 시간을 흘린다
  const now = useNow(!state.tutorialDone && state.ovenSlots.some(Boolean), 500);
  const [introSeen, setIntroSeen] = useState(false);
  const step = getTutorialStep(state, now);
  if (!step || paused) return null;

  if (step.id === "take-order" && !introSeen) {
    return (
      <TutorialCard
        title="케이크 가게에 오신 걸 환영해요!"
        lines={["손님이 주문한 케이크를 만들어 파는 가게예요.", "첫 케이크를 같이 만들어 볼까요?"]}
        action="시작!"
        onAction={() => setIntroSeen(true)}
        secondary="혼자 해볼래요"
        onSecondary={onFinish}
      />
    );
  }

  if (step.finish) {
    return (
      <TutorialCard
        title="🎉 첫 케이크 완성!"
        lines={["💰 잘 만들수록 돈을 많이 받아요", "😠 덜 익거나 엉망인 케이크는 재료비만 날려요", "⭐ 랭크가 오르면 새 재료와 테이블이 열려요", "📅 손님 10명을 받으면 하루가 끝나요"]}
        action="영업 시작!"
        onAction={onFinish}
      />
    );
  }

  const total = TUTORIAL_PHASES.length;
  const hasStepTabs = state.station === "cream" || state.station === "decorate";
  return (
    <>
      {step.targets && <TutorialSpotlight targets={step.targets} drag={step.drag} />}
      {/* 필링·크림, 토핑·데코는 왼쪽에 단계 탭(w-24, 폰 w-16)이 있어서 그 오른쪽에 띄운다 */}
      <div
        className={`pointer-events-none absolute top-14 z-[45] flex items-start gap-1.5 short:top-10 ${
          hasStepTabs
            ? "left-[calc(6.5rem+var(--safe-l))] short:left-[calc(4.5rem+var(--safe-l))]"
            : "left-[calc(0.5rem+var(--safe-l))]"
        }`}
      >
        <Mascot />
        <section
          key={step.id}
          role="status"
          aria-live="polite"
          aria-label="안내"
          className="animate-result-pop pointer-events-auto relative mt-2 flex max-w-[20rem] flex-col gap-1 rounded-2xl border-[3px] border-[var(--theme-accent)] bg-white px-4 py-2.5 text-[var(--theme-text)] shadow-[0_8px_20px_rgba(0,0,0,0.25)] short:mt-1 short:max-w-[15rem] short:gap-0.5 short:px-3 short:py-1.5"
        >
          {/* 말꼬리 */}
          <span
            aria-hidden
            className="absolute top-4 -left-[11px] h-4 w-3 bg-[var(--theme-accent)] short:top-3"
            style={{ clipPath: "polygon(100% 0, 0 50%, 100% 100%)" }}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-extrabold tracking-wide text-[var(--theme-accent)] short:text-[10px]">
              STEP {step.phase + 1}/{total} · {TUTORIAL_PHASES[step.phase]}
            </span>
            <span className="flex gap-1" aria-hidden>
              {TUTORIAL_PHASES.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full ${index <= step.phase ? "bg-[var(--theme-accent)]" : "bg-black/10"}`}
                />
              ))}
            </span>
          </div>
          <p className="text-lg leading-snug font-extrabold short:text-sm">{step.text}</p>
          {step.hint && <p className="text-xs text-[var(--theme-text)]/70 short:text-[11px]">{step.hint}</p>}
          <button
            type="button"
            onClick={onFinish}
            className="self-end text-[11px] font-semibold text-[var(--theme-text)]/45 hover:underline short:text-[10px]"
          >
            안내 건너뛰기
          </button>
        </section>
      </div>
    </>
  );
}

// 안내해 주는 파티셰 (이모지 캐릭터, 동동 떠 있다)
function Mascot({ large = false }: { large?: boolean }) {
  return (
    <span
      aria-hidden
      className={`animate-tutorial-bob flex shrink-0 items-center justify-center rounded-full border-4 border-[var(--theme-accent)] bg-[#fff8ef] shadow-[0_4px_10px_rgba(0,0,0,0.25)] ${
        large ? "h-24 w-24 text-6xl short:h-16 short:w-16 short:text-4xl" : "h-16 w-16 text-4xl short:h-12 short:w-12 short:text-3xl"
      }`}
    >
      🧁
    </span>
  );
}

type TutorialCardProps = {
  title: string;
  lines: ReactNode[];
  action: string;
  onAction: () => void;
  secondary?: string;
  onSecondary?: () => void;
};

// 화면 가운데 큰 카드 (환영, 축하)
function TutorialCard({ title, lines, action, onAction, secondary, onSecondary }: TutorialCardProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 p-4 short:p-2">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-card-title"
        className="animate-result-pop flex w-96 max-w-full flex-col items-center gap-3 rounded-3xl border-4 border-[var(--theme-accent)] bg-[#fff8ef] px-6 pt-5 pb-5 text-center text-[var(--theme-text)] shadow-[0_12px_30px_rgba(0,0,0,0.3)] short:flex-row short:gap-4 short:px-4 short:py-3 short:text-left"
      >
        <Mascot large />
        <div className="flex flex-col items-center gap-2 short:items-start short:gap-1.5">
          <h2 id="tutorial-card-title" className="text-xl font-extrabold short:text-lg">
            {title}
          </h2>
          <ul className="flex flex-col gap-1 text-sm font-semibold short:text-xs">
            {lines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
          <button
            type="button"
            autoFocus
            onClick={onAction}
            className="mt-1 rounded-full bg-[var(--theme-accent)] px-8 py-2 text-base font-extrabold text-white shadow-[0_4px_0_color-mix(in_srgb,var(--theme-accent)_70%,black)] transition-transform active:translate-y-0.5 active:scale-95 short:py-1.5 short:text-sm"
          >
            {action}
          </button>
          {secondary && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="text-xs font-semibold text-[var(--theme-text)]/50 hover:underline"
            >
              {secondary}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
