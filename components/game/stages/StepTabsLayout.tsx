import type { ReactNode } from "react";

export type StepTab<T extends string> = {
  id: T;
  emoji: string;
  label: string;
  done: boolean;
  locked: boolean; // 앞 단계를 마치기 전엔 열리지 않는다
  lockedNote?: string;
};

type StepTabsLayoutProps<T extends string> = {
  tabs: StepTab<T>[];
  active: T;
  onChange: (id: T) => void;
  children: ReactNode;
};

// 한 스테이션 안에 두 단계가 있을 때(필링→크림, 토핑→데코) 왼쪽 세로 탭으로 나눈다.
// 앞 단계를 마쳐야 뒤 탭이 열리고, 끝낸 단계는 다시 열어봐도 결과만 보여준다 (1장 2번 "순서대로").
export function StepTabsLayout<T extends string>({ tabs, active, onChange, children }: StepTabsLayoutProps<T>) {
  return (
    <div className="flex min-h-0 flex-1">
      <nav
        aria-label="단계"
        className="relative z-10 flex w-24 shrink-0 flex-col gap-2 p-2 short:w-16 short:gap-1.5 short:p-1.5"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              disabled={tab.locked}
              aria-pressed={isActive}
              className={`flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-sm font-bold shadow-sm short:px-1 short:py-1 short:text-xs transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
                isActive ? "bg-[var(--theme-accent)] text-white" : "bg-white/70 text-[var(--theme-text)]"
              }`}
            >
              <span className="text-2xl leading-none short:text-lg" aria-hidden>
                {tab.emoji}
              </span>
              {tab.label}
              {tab.done && <span className="text-[10px] font-medium">✅ 완료</span>}
              {tab.locked && tab.lockedNote && <span className="text-[10px] font-medium">🔒 {tab.lockedNote}</span>}
            </button>
          );
        })}
      </nav>
      {children}
    </div>
  );
}

type StepDoneProps = {
  title: string;
  detail: string;
  nextLabel: string;
  onNext: () => void;
};

// 이미 끝낸 단계 탭을 다시 열었을 때 보여주는 결과 요약
export function StepDone({ title, detail, nextLabel, onNext }: StepDoneProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-2 text-[var(--theme-text)]">
      <p className="text-base font-bold">{title}</p>
      <p className="text-sm">{detail}</p>
      <button
        type="button"
        onClick={onNext}
        className="mt-2 rounded-full bg-[var(--theme-accent)] px-5 py-1.5 text-base font-bold text-white shadow-sm transition-transform active:scale-95"
      >
        {nextLabel}
      </button>
    </div>
  );
}
