"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { ALBUM_NAME_MAX, getAlbum, removeAlbumEntry, renameAlbumEntry, subscribeAlbum, type AlbumEntry } from "@/lib/album";
import { saveCardImage } from "@/lib/cardImage";
import { sounds } from "@/lib/sound";
import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";
import { FitBox } from "@/components/game/FitBox";
import { CakeCard, CARD_HEIGHT, CARD_WIDTH } from "./CakeCard";
import { Polaroid } from "./Polaroid";

const EMPTY: AlbumEntry[] = [];

// 케이크 앨범 창 (상단 바 📔): 담아 둔 케이크를 폴라로이드로 모아 보고, 하나를 고르면 카드로 크게 보여준다.
// 카드는 PNG로 저장(폰은 공유 창)할 수 있고, 이름을 바꾸거나 앨범에서 뺄 수 있다.
export function AlbumView({ onClose }: { onClose: () => void }) {
  const album = useSyncExternalStore(subscribeAlbum, getAlbum, () => EMPTY);
  const materials = useMaterialRegistry();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = album.find((entry) => entry.id === openId) ?? null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-4 short:p-2"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="album-title"
        className={`animate-result-pop flex max-h-full w-[46rem] max-w-full flex-col gap-3 rounded-2xl ${open ? "h-[34rem]" : ""} bg-[#fff8ef] p-5 text-[var(--theme-text)] shadow-[0_10px_30px_rgba(0,0,0,0.25)] short:gap-2 short:p-3`}
      >
        <header className="flex items-center justify-between gap-2">
          {open ? (
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="rounded-full px-2 py-0.5 text-sm font-bold hover:bg-black/5"
            >
              ← 앨범
            </button>
          ) : (
            <h2 id="album-title" className="text-lg font-extrabold short:text-base">
              📔 케이크 앨범 <span className="text-sm font-bold opacity-50">{album.length}장</span>
            </h2>
          )}
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

        {open ? (
          <AlbumDetail key={open.id} entry={open} materials={materials} onRemoved={() => setOpenId(null)} />
        ) : album.length === 0 ? (
          <p className="rounded-xl bg-white/70 px-4 py-8 text-center text-sm font-bold opacity-70">
            아직 비어 있어요.
            <br />
            하루가 끝나면 그날 만든 케이크를 골라 담을 수 있어요.
          </p>
        ) : (
          <ul className="grid min-h-0 grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-2 gap-y-5 overflow-y-auto px-1 pt-4 pb-2">
            {album.map((entry, index) => (
              <li key={entry.id} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sounds.click();
                    setOpenId(entry.id);
                  }}
                  aria-label={`${entry.name || "이름 없는 케이크"}, DAY ${entry.day}, ${entry.scores.total}점`}
                  className="transition-transform hover:-translate-y-1 active:scale-95"
                >
                  <Polaroid cake={entry.cake} materials={materials} name={entry.name} size="sm" tilt={index % 2 ? 2 : -2} />
                </button>
                <span className="text-[11px] font-bold opacity-60">
                  DAY {entry.day} · {entry.scores.total}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AlbumDetail({
  entry,
  materials,
  onRemoved,
}: {
  entry: AlbumEntry;
  materials: ReturnType<typeof useMaterialRegistry>;
  onRemoved: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [draftName, setDraftName] = useState<string | null>(null); // null이 아니면 이름 고치는 중
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const save = async () => {
    if (!cardRef.current || isSaving) return;
    setIsSaving(true);
    setStatus("카드를 만드는 중…");
    try {
      const result = await saveCardImage(cardRef.current, `케이크카드-${entry.name || `DAY${entry.day}`}.png`);
      setStatus(result === "cancelled" ? null : result === "shared" ? "공유했어요!" : "이미지를 저장했어요!");
      if (result !== "cancelled") sounds.sparkle();
    } catch {
      setStatus("이미지를 만들지 못했어요. 다시 해 볼래요?");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 short:flex-row short:gap-3">
      {/* 카드 미리보기: 800x540 카드를 남은 폭에 맞춰 줄여서 */}
      <FitBox maxSize={CARD_WIDTH} heightRatio={CARD_HEIGHT / CARD_WIDTH} minSize={200} align="center">
        {(size) => (
          <div style={{ width: size, height: (size * CARD_HEIGHT) / CARD_WIDTH }}>
            <div style={{ transform: `scale(${size / CARD_WIDTH})`, transformOrigin: "top left" }}>
              <CakeCard ref={cardRef} entry={entry} materials={materials} />
            </div>
          </div>
        )}
      </FitBox>

      <div className="flex shrink-0 flex-col items-stretch gap-2 short:w-44 short:justify-center">
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="rounded-full bg-[var(--theme-accent)] px-5 py-2 text-sm font-extrabold whitespace-nowrap text-white shadow-sm transition-transform active:scale-95 disabled:opacity-60 short:py-1.5"
        >
          🖼️ 이미지로 저장
        </button>
        {status && (
          <p role="status" className="text-center text-xs font-bold opacity-70">
            {status}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          {draftName !== null ? (
            <form
              className="flex w-full gap-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                renameAlbumEntry(entry.id, draftName);
                setDraftName(null);
              }}
            >
              <input
                autoFocus
                value={draftName}
                maxLength={ALBUM_NAME_MAX}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="케이크 이름"
                aria-label="케이크 이름"
                className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-3 py-1 text-sm"
              />
              <button type="submit" className="rounded-full bg-white px-3 py-1 text-sm font-bold shadow-sm active:scale-95">
                ✔
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setDraftName(entry.name)}
              className="rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm active:scale-95"
            >
              ✏️ 이름 {entry.name ? "바꾸기" : "붙이기"}
            </button>
          )}
          {confirmRemove ? (
            <span className="flex items-center gap-1">
              <span className="text-xs font-bold text-red-600">앨범에서 뺄까요?</span>
              <button
                type="button"
                onClick={() => {
                  removeAlbumEntry(entry.id);
                  onRemoved();
                }}
                className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white active:scale-95"
              >
                빼기
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-bold shadow-sm active:scale-95"
              >
                취소
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              className="rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm active:scale-95"
            >
              🗑️ 앨범에서 빼기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
