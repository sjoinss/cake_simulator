"use client";

import { CUSTOMER_LOOK_COUNT } from "@/lib/assets";
import { customerImageKey, OWNER_IMAGE_KEY, useCustomImages, type CustomerLookPose } from "./CustomImages";
import { ImageDropZone } from "./ImageDropZone";

const POSES: { pose: CustomerLookPose; label: string }[] = [
  { pose: "idle", label: "평소" },
  { pose: "eating", label: "먹는 중" },
];

// "가게 꾸미기" 창: 주인 캐릭터와 손님 모습(최대 6종류 × 평소/먹는 중) 그림을 한곳에서 바꾼다.
// 각 칸은 그림을 끌어다 놓거나 눌러서 고르고, 오른쪽 위 X로 비운다. 넣은 그림은 브라우저에 저장된다.
// 나중에 배경·재료 그림 등도 이 창에 모을 수 있다.
export function DecorSettings({ onClose }: { onClose: () => void }) {
  const { images, ownerImage, hasCustomOwner, setImage, clearImage } = useCustomImages();

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 p-4 short:p-2"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="decor-title"
        className="animate-result-pop flex max-h-full w-[36rem] max-w-full flex-col gap-3 overflow-y-auto rounded-2xl bg-[#fff8ef] p-5 text-[var(--theme-text)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] short:gap-2 short:p-3"
      >
        <header className="flex items-center justify-between">
          <h2 id="decor-title" className="text-lg font-extrabold short:text-base">
            가게 꾸미기
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            autoFocus
            className="rounded-full px-2 text-lg leading-none text-[var(--theme-text)]/60 hover:bg-black/5"
          >
            ✕
          </button>
        </header>
        <p className="text-xs text-[var(--theme-text)]/70">
          칸에 그림 파일을 끌어다 놓거나 눌러서 고르세요. 평소 모습을 넣은 손님만 가게에 오고, 먹는 모습이 없으면 평소
          모습을 그대로 써요.
        </p>

        <div className="flex gap-4 short:gap-3">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <h3 className="text-sm font-bold">주인</h3>
            <ImageDropZone
              imageUrl={ownerImage}
              isCustom={hasCustomOwner}
              label="주인 캐릭터 그림"
              onFile={(file) => setImage(OWNER_IMAGE_KEY, file)}
              onClear={() => clearImage(OWNER_IMAGE_KEY)}
              className="h-32 w-20 rounded-xl bg-white shadow-inner short:h-24 short:w-16"
            >
              <EmptySlot />
            </ImageDropZone>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="text-sm font-bold">손님 (최대 {CUSTOMER_LOOK_COUNT}종류)</h3>
            <ul className="grid grid-cols-3 gap-2">
              {Array.from({ length: CUSTOMER_LOOK_COUNT }, (_, look) => (
                <li key={look} className="flex flex-col items-center gap-1 rounded-xl bg-white/70 p-1.5">
                  <span className="text-[11px] font-bold text-[var(--theme-text)]/70">손님 {look + 1}</span>
                  <div className="flex gap-1.5">
                    {POSES.map(({ pose, label }) => {
                      const key = customerImageKey(look, pose);
                      return (
                        <div key={pose} className="flex flex-col items-center gap-0.5">
                          <ImageDropZone
                            imageUrl={images[key] ?? null}
                            isCustom={!!images[key]}
                            label={`손님 ${look + 1} ${label} 그림`}
                            onFile={(file) => setImage(key, file)}
                            onClear={() => clearImage(key)}
                            className="h-14 w-14 rounded-lg bg-white shadow-inner short:h-11 short:w-11"
                          >
                            <EmptySlot />
                          </ImageDropZone>
                          <span className="text-[10px] text-[var(--theme-text)]/60">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptySlot() {
  return (
    <span className="flex h-full w-full items-center justify-center rounded-[inherit] border-2 border-dashed border-[var(--theme-text)]/20 text-lg text-[var(--theme-text)]/30">
      +
    </span>
  );
}
