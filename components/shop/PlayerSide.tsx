import type { ComponentProps } from "react";
import { CakeCounter } from "./CakeCounter";

type PlayerSideProps = {
  counter: ComponentProps<typeof CakeCounter>;
};

// 캐릭터 이미지는 나중에 <img> + 파츠 레이어로 교체. 계산대 위 완성 케이크 표시/드래그는 CakeCounter가 담당.
export function PlayerSide({ counter }: PlayerSideProps) {
  return (
    <section
      aria-label="플레이어 공간"
      className="relative flex flex-1 basis-2/5 flex-col overflow-hidden bg-[linear-gradient(180deg,var(--theme-secondary)_0%,var(--theme-background)_70%)]"
    >
      <div className="flex flex-1 items-end justify-center pb-3">
        <div className="flex flex-col items-center">
          <div className="text-7xl leading-none" aria-hidden>
            🧑‍🍳
          </div>
          {/* 발밑 그림자: 캐릭터가 바닥에 붙어 있다는 느낌을 준다 */}
          <div className="mt-1 h-2.5 w-14 rounded-full bg-black/10 blur-[1.5px]" aria-hidden />
        </div>
      </div>

      {/* 계산대: 플레이어 공간 가로를 꽉 채우고, 세로로는 최소 1/4을 차지하는 나무 책상.
          Good Pizza, Great Pizza처럼 넓은 상판(70%, 위에서 내려다보는 면) + 얇은 옆면(30%)으로 입체감을 준다.
          흰색으로 바꾼 건 책상이 아니라 그 위에 놓이는 캐시 레지스터(기계) 쪽이다. */}
      <div className="relative h-1/4 min-h-24 w-full shrink-0">
        {/* 테이블 상판 (위에서 내려다보이는 넓은 면) */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[70%] bg-[#c99164] shadow-[inset_0_2px_0_rgba(255,255,255,0.35)]"
        />
        {/* 테이블 옆면 (상판 앞쪽 얇은 단면) */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[30%] bg-[#8a5c3c] shadow-[inset_0_2px_0_rgba(255,255,255,0.1),0_-2px_6px_rgba(0,0,0,0.15)]"
        />

        {/* 케이크 진열대: 상판 위, 레지스터와 겹치지 않게 왼쪽 절반 쪽에 배치 */}
        <div className="absolute bottom-[30%] left-[30%] -translate-x-1/2 translate-y-2">
          <CakeCounter {...counter} />
        </div>

        {/* 캐시 레지스터: 최근 캐주얼 타이쿤 게임(Good Pizza, Great Pizza 등)처럼 크림색 몸체 +
            파스텔 화면의 작고 귀여운 기계로. 카운터 폭이 넉넉하므로 잘리지 않게 오른쪽 여백을 두고 배치 */}
        <div aria-hidden className="absolute right-4 bottom-[30%] flex translate-y-2 flex-col items-center">
          <div className="flex h-11 w-16 flex-col items-center gap-1 rounded-xl border border-black/5 bg-[#fdfbf7] p-1.5 shadow-[0_3px_8px_rgba(0,0,0,0.18)]">
            <div className="h-6 w-full rounded-md bg-gradient-to-b from-sky-200 to-pink-200" />
            <div className="flex gap-1">
              <div className="h-1 w-1 rounded-full bg-[var(--theme-accent)]" />
              <div className="h-1 w-1 rounded-full bg-neutral-300" />
              <div className="h-1 w-1 rounded-full bg-neutral-300" />
            </div>
          </div>
          <div className="h-1.5 w-8 rounded-b-sm bg-[#e8ded2]" />
        </div>
      </div>
    </section>
  );
}
