"use client";

import { useState } from "react";
import { CUSTOMER_LOOK_COUNT } from "@/lib/assets";
import { customerImageKey, OWNER_IMAGE_KEY, useCustomImages, type CustomerLookPose } from "./CustomImages";
import { ImageDropZone } from "./ImageDropZone";
import { MaterialMaker } from "./MaterialMaker";
import { ThemePicker } from "./ThemePicker";
import { CUSTOM_MATERIAL_RANK } from "@/lib/progress";

const POSES: { pose: CustomerLookPose; label: string }[] = [
  { pose: "idle", label: "평소" },
  { pose: "eating", label: "먹는 중" },
];

type DecorTab = "images" | "materials" | "theme";
const TABS: { id: DecorTab; label: string }[] = [
  { id: "images", label: "그림" },
  { id: "materials", label: "재료" },
  { id: "theme", label: "테마" },
];

// "가게 꾸미기" 창.
// - 그림 탭: 주인 캐릭터와 손님 모습(최대 6종류 × 평소/먹는 중). 끌어다 놓거나 눌러서 고르고, 오른쪽 위 X로 비운다.
// - 재료 탭: 나만의 재료 만들기 (MaterialMaker)
// - 테마 탭: 파스텔 테마 7가지 (ThemePicker)
// 넣은 그림·재료·테마는 브라우저에 저장된다 (진행 초기화와 무관).
type DecorSettingsProps = {
  rank: number; // 재료 탭(나만의 재료 만들기)은 CUSTOM_MATERIAL_RANK부터 열린다
  onClose: () => void;
  onResetProgress: () => void; // 게임 진행(돈·DAY·케이크) 초기화
};

export function DecorSettings({ rank, onClose, onResetProgress }: DecorSettingsProps) {
  const { images, ownerImage, hasCustomOwner, setImage, clearImage, getCustomerSlotImage } = useCustomImages();
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [tab, setTab] = useState<DecorTab>("images");

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
        <div role="tablist" aria-label="꾸미기 종류" className="flex gap-1 border-b border-black/10">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`decor-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`decor-panel-${id}`}
              onClick={() => setTab(id)}
              className={`-mb-px rounded-t-lg border border-b-0 px-4 py-1 text-sm font-bold ${
                tab === id
                  ? "border-black/10 bg-white text-[var(--theme-text)]"
                  : "border-transparent text-[var(--theme-text)]/50 hover:text-[var(--theme-text)]/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "theme" ? (
          <div role="tabpanel" id="decor-panel-theme" aria-labelledby="decor-tab-theme">
            <ThemePicker />
          </div>
        ) : tab === "materials" ? (
          <div role="tabpanel" id="decor-panel-materials" aria-labelledby="decor-tab-materials">
            {rank >= CUSTOM_MATERIAL_RANK ? (
              <MaterialMaker />
            ) : (
              <p className="rounded-xl bg-white/70 px-4 py-6 text-center text-sm font-bold text-[var(--theme-text)]/70">
                🔒 랭크 {CUSTOM_MATERIAL_RANK}가 되면 나만의 재료를 만들 수 있어요
                <br />
                <span className="text-xs font-semibold">지금 랭크 {rank}</span>
              </p>
            )}
          </div>
        ) : (
          <div
            role="tabpanel"
            id="decor-panel-images"
            aria-labelledby="decor-tab-images"
            className="flex flex-col gap-3 short:gap-2"
          >
            <p className="text-xs text-[var(--theme-text)]/70">
              칸에 그림 파일을 끌어다 놓거나 눌러서 고르세요. 비워 두거나 X로 지우면 기본 그림이 나와요. 먹는 모습이
              없으면 평소 모습을 그대로 써요.
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
                                imageUrl={getCustomerSlotImage(look, pose)}
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
          </div>
        )}

        {/* 진행 초기화: 돈·DAY·진행 중인 케이크를 지우고 DAY 1부터 (꾸미기 그림과 가게 이름은 그대로) */}
        <div className="flex items-center justify-between gap-2 border-t border-dashed border-black/15 pt-3 short:pt-2">
          <p className="text-xs text-[var(--theme-text)]/60">
            진행은 자동으로 저장돼요. 처음부터 다시 하려면 초기화하세요.
          </p>
          {isConfirmingReset ? (
            <span role="group" aria-label="진행 초기화 확인" className="flex shrink-0 items-center gap-1">
              <span className="text-xs font-bold whitespace-nowrap text-red-600">정말 처음부터?</span>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  onClose();
                }}
                className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold whitespace-nowrap text-white shadow-sm active:scale-95"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingReset(false)}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-bold whitespace-nowrap shadow-sm active:scale-95"
              >
                취소
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingReset(true)}
              className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold whitespace-nowrap shadow-sm active:scale-95"
            >
              진행 초기화
            </button>
          )}
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
