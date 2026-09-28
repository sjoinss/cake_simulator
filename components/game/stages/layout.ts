// 제작 스테이션 공통 배치. 위쪽 벽에 재료 선반, 아래 줄에 [작업 대상 | 게이지 | 버튼] (폰 가로 화면 기준, 11장).
// 작업 대상(틀/케이크)은 줄 아래쪽에 붙여서 StationBackdrop의 조리대 위에 놓인 것처럼 보이게 한다.
// 세로가 짧은 화면(short)에서는 간격과 버튼을 줄이고 안내 문구는 숨긴다.
export const STAGE_ROOT =
  "flex min-h-0 flex-1 flex-col items-center gap-2 px-4 pt-2 pb-3 short:gap-1 short:pt-2.5 short:pb-1.5";
export const WORK_ROW = "flex min-h-0 w-full flex-1 items-center justify-center gap-5 pb-[4%] short:gap-2.5";
export const SIDE_COLUMN =
  "flex w-40 shrink-0 flex-col gap-2 text-sm text-[var(--theme-text)]/80 short:w-28 short:gap-1.5 short:text-xs";
export const HINT = "rounded-xl bg-white/60 px-2.5 py-1.5 short:hidden";
export const BUTTON_SECONDARY =
  "rounded-full bg-white/85 px-3 py-1.5 text-sm font-bold text-[var(--theme-text)] shadow-sm transition-transform active:scale-95 disabled:opacity-40 short:py-1 short:text-xs";
export const BUTTON_PRIMARY =
  "rounded-full bg-[var(--theme-accent)] px-3 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-40 short:py-1 short:text-sm";
