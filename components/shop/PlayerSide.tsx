import { CakeCounter } from "./CakeCounter";

// Phase 1: 정적 배치만 구현. 캐릭터 이미지는 나중에 <img> + 파츠 레이어로 교체.
export function PlayerSide() {
  return (
    <section
      aria-label="플레이어 공간"
      className="relative flex flex-1 basis-1/2 flex-col items-center justify-end gap-3 overflow-hidden bg-[linear-gradient(180deg,var(--theme-secondary)_0%,var(--theme-background)_70%)] pb-4"
    >
      <div className="text-7xl leading-none" aria-hidden>
        🧑‍🍳
      </div>
      <CakeCounter cake={null} />
    </section>
  );
}
