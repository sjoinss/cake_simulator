"use client";

import { useRef, useState, type ReactNode } from "react";

type ImageDropZoneProps = {
  imageUrl: string | null; // 지금 보여줄 그림 (없으면 children으로 자리 표시)
  isCustom: boolean; // 플레이어가 넣은 그림인지 — 이때만 오른쪽 위 X(기본으로 되돌리기)를 보여준다
  label: string; // 스크린리더/툴팁용 이름 (예: "주인 캐릭터 이미지")
  onFile: (file: File) => void;
  onClear: () => void;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
};

// 그림 파일을 끌어다 놓거나(PC), 눌러서 고르면(폰) 그 그림으로 바뀌는 칸. 넣을 때마다 새 그림으로 바뀐다.
export function ImageDropZone({
  imageUrl,
  isCustom,
  label,
  onFile,
  onClear,
  className = "",
  imageClassName = "",
  children,
}: ImageDropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const takeFile = (file: File | undefined) => {
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  return (
    <div
      className={`group relative ${className} ${isOver ? "outline-3 outline-offset-2 outline-dashed outline-[var(--theme-accent)]" : ""}`}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        takeFile(event.dataTransfer.files[0]);
      }}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={`${label} 바꾸기 (그림을 끌어다 놓거나 눌러서 고르세요)`}
        title="그림을 끌어다 놓거나 눌러서 고르세요"
        className="flex h-full w-full cursor-pointer items-end justify-center border-0 bg-transparent p-0"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 플레이어가 넣은 blob URL이라 next/image를 쓸 수 없다
          <img src={imageUrl} alt="" draggable={false} className={`h-full w-full object-contain ${imageClassName}`} />
        ) : (
          children
        )}
      </button>
      {isCustom && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`${label} 기본으로 되돌리기`}
          title="기본 그림으로 되돌리기"
          className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[var(--theme-text)] shadow-[0_1px_4px_rgba(0,0,0,0.25)] active:scale-90"
        >
          ✕
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          takeFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
