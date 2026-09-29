"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { CakeDecoration, CakeJob, CakeDrawing, CakeText, MaterialRegistry } from "@/lib/gameState";
import { BRUSHES, eraseStrokesAt, STICKER_SCALE, STICKERS, type BrushType, type StampShape } from "@/lib/decoration";
import { sounds } from "@/lib/sound";
import { CakeTopView } from "../cake/CakeRenderer";
import { DrawingCanvas, type DrawingTool } from "../cake/DrawingCanvas";
import { StickerOverlay } from "../cake/StickerOverlay";
import { TextOverlay } from "../cake/TextOverlay";
import { FitBox, Scaled } from "../FitBox";

export type DecorationData = { drawings: CakeDrawing[]; text: CakeText[]; decorations: CakeDecoration[] };

// 모양 도장 (그리기 모드): 누른 자리에 지금 펜 색·굵기·종류로 찍힌다
const STAMPS: { shape: StampShape; label: string; icon: string }[] = [
  { shape: "heart", label: "하트 도장", icon: "♡" },
  { shape: "star", label: "별 도장", icon: "☆" },
  { shape: "circle", label: "동그라미 도장", icon: "○" },
];

type DecorationStageProps = {
  colors: string[]; // 펜·글자 색 (lib/progress.ts getPenColors)
  job: CakeJob;
  materials: MaterialRegistry;
  onChange: (decoration: DecorationData) => void;
  onFinish: () => void;
};

type Mode = "draw" | "sticker" | "text";

const PEN_SIZES = [
  { size: 2, label: "가는 펜" },
  { size: 4, label: "보통 펜" },
  { size: 8, label: "굵은 펜" },
];
const FONTS = [
  { font: "sans-serif", label: "고딕" },
  { font: "serif", label: "명조" },
  { font: "cursive", label: "손글씨" },
];
const ERASER_RADIUS = 4; // 지우개 반경(%)
const TEXT_SCALE_MIN = 0.6;
const TEXT_SCALE_MAX = 2.4;
const TEXT_SCALE_STEP = 0.2;
const TEXT_ROTATION_STEP = 15;

// 데코레이션 단계. 진입 시 카메라가 위로 이동해 케이크를 완전히 내려다보는 Top View로 전환되는
// 연출이 핵심 차별화 요소라 반드시 구현한다 (cake-tycoon-prompt.md 4장 — 생략 대상 아님).
// 도구: 자유 그림(펜 색상/크기/종류, 모양 도장, 지우개, 전체 지우기, 실행 취소/다시 실행 — 5장) +
// 스티커(이모지 붙이기·옮기기·크기·회전 — 4장 "스티커 배치") +
// 텍스트(추가, 드래그 이동, 크기/회전/색상/폰트 버튼 — 6장 "Phase 1은 버튼 방식").
export function DecorationStage({ job, materials, colors: COLORS, onChange, onFinish }: DecorationStageProps) {
  const [isTopView, setIsTopView] = useState(false);
  const [mode, setMode] = useState<Mode>("draw");
  const [color, setColor] = useState(COLORS[0]);
  const [penSize, setPenSize] = useState(PEN_SIZES[1].size);
  const [brush, setBrush] = useState<BrushType>("basic");
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [placingSticker, setPlacingSticker] = useState<string | null>(STICKERS[0]);
  const [selectedStickerIndex, setSelectedStickerIndex] = useState<number | null>(null);
  const [selectedTextIndex, setSelectedTextIndex] = useState<number | null>(null);
  const [textDraft, setTextDraft] = useState("");
  // 실행 취소/다시 실행 히스토리. 제작 화면을 나갔다 오면 초기화된다 (케이크 데이터 자체는 유지).
  const [undoStack, setUndoStack] = useState<DecorationData[]>([]);
  const [redoStack, setRedoStack] = useState<DecorationData[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsTopView(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const current: DecorationData = {
    drawings: job.cake.drawings,
    text: job.cake.text,
    decorations: job.cake.decorations ?? [],
  };
  const selectedText = selectedTextIndex !== null ? job.cake.text[selectedTextIndex] : undefined;
  const selectedSticker = selectedStickerIndex !== null ? current.decorations[selectedStickerIndex] : undefined;

  const updateSelectedSticker = (updater: (sticker: CakeDecoration) => CakeDecoration) => {
    if (selectedStickerIndex === null) return;
    commit({
      ...current,
      decorations: current.decorations.map((sticker, index) => (index === selectedStickerIndex ? updater(sticker) : sticker)),
    });
  };

  // 지금 상태를 실행 취소 지점으로 저장한다. 드래그/지우개처럼 연속으로 바뀌는 조작은 시작할 때 한 번만 호출한다.
  const pushHistory = () => {
    setUndoStack((stack) => [...stack, current]);
    setRedoStack([]);
  };

  const commit = (next: DecorationData) => {
    pushHistory();
    onChange(next);
  };

  const undo = () => {
    const previous = undoStack.at(-1);
    if (!previous) return;
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, current]);
    onChange(previous);
    setSelectedTextIndex(null);
    setSelectedStickerIndex(null);
  };

  const redo = () => {
    const next = redoStack.at(-1);
    if (!next) return;
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, current]);
    onChange(next);
    setSelectedTextIndex(null);
    setSelectedStickerIndex(null);
  };

  const updateSelectedText = (updater: (text: CakeText) => CakeText) => {
    if (selectedTextIndex === null) return;
    commit({
      ...current,
      text: current.text.map((text, index) => (index === selectedTextIndex ? updater(text) : text)),
    });
  };

  const handleAddText = (event: React.FormEvent) => {
    event.preventDefault();
    const content = textDraft.trim();
    if (!content) return;
    commit({
      ...current,
      text: [...current.text, { content, x: 50, y: 50, rotation: 0, scale: 1, color: COLORS[4], font: FONTS[0].font }],
    });
    setSelectedTextIndex(current.text.length);
    setTextDraft("");
  };

  const handleColor = (swatch: string) => {
    if (mode === "text") {
      if (selectedText) updateSelectedText((text) => ({ ...text, color: swatch }));
      return;
    }
    setColor(swatch);
    // 지우개였으면 펜으로 돌아간다 (모양 도장은 그대로 — 색만 바꿔 찍을 수 있게)
    if (tool === "eraser") setTool("pen");
  };

  const activeColor = mode === "text" ? selectedText?.color : tool !== "eraser" ? color : undefined;

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center gap-6 overflow-hidden px-6 py-3 short:gap-3 short:px-3 short:py-1.5">
      {/* 데코는 224px 평면 좌표계로 그리고, 남은 공간에 맞춰 통째로 줄인다 (그림/글자 좌표는 %라 그대로 맞는다) */}
      <FitBox maxSize={260} heightRatio={1} className="max-w-[280px]">
        {(size) => (
          <Scaled width={size} baseWidth={224} baseHeight={224}>
            <div style={{ perspective: "600px" }}>
              <div
                className="relative h-56 w-56 max-w-full transition-transform duration-700 ease-out"
                style={{ transform: isTopView ? "rotateX(0deg) scale(1.05)" : "rotateX(55deg) scale(0.9)" }}
              >
                <CakeTopView cake={job.cake} materials={materials} />
                <DrawingCanvas
                  drawings={job.cake.drawings}
                  color={color}
                  size={penSize}
                  brush={brush}
                  tool={tool}
                  enabled={mode === "draw"}
                  onStrokeComplete={(stroke) => commit({ ...current, drawings: [...current.drawings, stroke] })}
                  onEraseStart={pushHistory}
                  onEraseAt={(point) => {
                    const remaining = eraseStrokesAt(job.cake.drawings, point, ERASER_RADIUS);
                    if (remaining.length !== job.cake.drawings.length) onChange({ ...current, drawings: remaining });
                  }}
                />
                <StickerOverlay
                  stickers={current.decorations}
                  enabled={mode === "sticker"}
                  placing={placingSticker}
                  selectedIndex={selectedStickerIndex}
                  onSelect={setSelectedStickerIndex}
                  onPlace={(x, y) => {
                    if (!placingSticker) return;
                    sounds.pop();
                    commit({
                      ...current,
                      decorations: [...current.decorations, { type: "sticker", emoji: placingSticker, x, y, scale: 1, rotation: 0 }],
                    });
                    setSelectedStickerIndex(current.decorations.length);
                  }}
                  onMoveStart={pushHistory}
                  onMove={(index, x, y) =>
                    onChange({
                      ...current,
                      decorations: current.decorations.map((sticker, i) => (i === index ? { ...sticker, x, y } : sticker)),
                    })
                  }
                />
                <TextOverlay
                  texts={job.cake.text}
                  enabled={mode === "text"}
                  selectedIndex={selectedTextIndex}
                  onSelect={setSelectedTextIndex}
                  onMoveStart={pushHistory}
                  onMove={(index, x, y) =>
                    onChange({
                      ...current,
                      text: current.text.map((text, i) => (i === index ? { ...text, x, y } : text)),
                    })
                  }
                />
              </div>
            </div>
          </Scaled>
        )}
      </FitBox>

      <div className="relative flex max-h-full w-64 shrink-0 flex-col gap-2.5 overflow-y-auto rounded-2xl bg-white/50 p-2 short:w-56 short:gap-1.5 short:p-1.5">
        <div role="group" aria-label="데코 도구" className="flex gap-1 rounded-full bg-white/60 p-1">
          <ToolButton pressed={mode === "draw"} onClick={() => setMode("draw")} wide>
            ✏️ 그리기
          </ToolButton>
          <ToolButton pressed={mode === "sticker"} onClick={() => setMode("sticker")} wide>
            🌟 스티커
          </ToolButton>
          <ToolButton pressed={mode === "text"} onClick={() => setMode("text")} wide>
            🔤 글자
          </ToolButton>
        </div>

        {mode === "sticker" && (
          <>
            <div role="radiogroup" aria-label="붙일 스티커" className="grid grid-cols-8 gap-1 short:gap-0.5">
              {STICKERS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="radio"
                  aria-checked={placingSticker === emoji}
                  aria-label={`스티커 ${emoji}`}
                  onClick={() => setPlacingSticker(emoji)}
                  className={`flex aspect-square items-center justify-center rounded-lg text-lg leading-none transition-transform active:scale-90 short:text-base ${
                    placingSticker === emoji ? "bg-[var(--theme-accent)] shadow-sm" : "bg-white/80"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {selectedSticker ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <ToolButton
                  label="스티커 작게"
                  disabled={selectedSticker.scale <= STICKER_SCALE.min}
                  onClick={() =>
                    updateSelectedSticker((sticker) => ({
                      ...sticker,
                      scale: Math.max(STICKER_SCALE.min, sticker.scale - STICKER_SCALE.step),
                    }))
                  }
                >
                  −
                </ToolButton>
                <ToolButton
                  label="스티커 크게"
                  disabled={selectedSticker.scale >= STICKER_SCALE.max}
                  onClick={() =>
                    updateSelectedSticker((sticker) => ({
                      ...sticker,
                      scale: Math.min(STICKER_SCALE.max, sticker.scale + STICKER_SCALE.step),
                    }))
                  }
                >
                  +
                </ToolButton>
                <ToolButton
                  label="스티커 왼쪽으로 회전"
                  onClick={() => updateSelectedSticker((sticker) => ({ ...sticker, rotation: sticker.rotation - 15 }))}
                >
                  ⟲
                </ToolButton>
                <ToolButton
                  label="스티커 오른쪽으로 회전"
                  onClick={() => updateSelectedSticker((sticker) => ({ ...sticker, rotation: sticker.rotation + 15 }))}
                >
                  ⟳
                </ToolButton>
                <ToolButton
                  label="선택한 스티커 떼기"
                  onClick={() => {
                    commit({
                      ...current,
                      decorations: current.decorations.filter((_, index) => index !== selectedStickerIndex),
                    });
                    setSelectedStickerIndex(null);
                  }}
                >
                  🗑️
                </ToolButton>
              </div>
            ) : (
              <p className="text-xs text-[var(--theme-text)]/70">스티커를 고르고 케이크를 톡 누르면 붙어요</p>
            )}
          </>
        )}

        {mode === "text" && (
          <form onSubmit={handleAddText} className="flex gap-1.5">
            <input
              value={textDraft}
              onChange={(event) => setTextDraft(event.target.value)}
              maxLength={20}
              placeholder="Happy Birthday"
              aria-label="케이크에 쓸 문구"
              className="min-w-0 flex-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-[var(--theme-text)]"
            />
            <button
              type="submit"
              disabled={!textDraft.trim()}
              className="rounded-full bg-[var(--theme-accent)] px-3 py-1.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-40"
            >
              추가
            </button>
          </form>
        )}

        {(mode === "draw" || selectedText) && (
          <div role="group" aria-label={mode === "draw" ? "펜 색상" : "글자 색상"} className="flex flex-wrap items-center gap-2">
            {COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`색상 ${swatch}`}
                aria-pressed={activeColor === swatch}
                onClick={() => handleColor(swatch)}
                className={`h-7 w-7 rounded-full border-2 transition-transform active:scale-90 short:h-6 short:w-6 ${
                  activeColor === swatch ? "border-[var(--theme-text)]" : "border-white"
                }`}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
        )}

        {mode === "draw" && (
          <div className="flex items-center gap-1.5">
            {PEN_SIZES.map((pen) => (
              <ToolButton
                key={pen.size}
                label={pen.label}
                pressed={tool === "pen" && penSize === pen.size}
                onClick={() => {
                  setPenSize(pen.size);
                  setTool("pen");
                }}
              >
                <span
                  aria-hidden
                  className="inline-block rounded-full bg-[var(--theme-text)]"
                  style={{ width: pen.size + 3, height: pen.size + 3 }}
                />
              </ToolButton>
            ))}
            <ToolButton pressed={tool === "eraser"} onClick={() => setTool("eraser")}>
              🧽 지우개
            </ToolButton>
          </div>
        )}

        {mode === "draw" && (
          <>
            {/* 모양 도장: 누른 자리에 찍힌다 */}
            <div role="group" aria-label="모양 도장" className="flex items-center gap-1.5">
              {STAMPS.map((stamp) => (
                <ToolButton
                  key={stamp.shape}
                  label={stamp.label}
                  pressed={tool === stamp.shape}
                  onClick={() => setTool(stamp.shape)}
                >
                  <span className="text-base leading-none">{stamp.icon}</span>
                </ToolButton>
              ))}
              <span className="text-[11px] text-[var(--theme-text)]/60">톡 누르면 찍혀요</span>
            </div>
            {/* 펜 종류 */}
            <div role="radiogroup" aria-label="펜 종류" className="flex items-center gap-1.5">
              {BRUSHES.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  role="radio"
                  aria-checked={brush === option.type}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => setBrush(option.type)}
                  className={`flex min-h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-bold shadow-sm transition-transform active:scale-95 ${
                    brush === option.type ? "bg-[var(--theme-accent)] text-white" : "bg-white/80 text-[var(--theme-text)]"
                  }`}
                >
                  {option.emoji}
                </button>
              ))}
            </div>
          </>
        )}

        {mode === "text" && selectedText && (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <ToolButton
                label="글자 작게"
                disabled={selectedText.scale <= TEXT_SCALE_MIN}
                onClick={() =>
                  updateSelectedText((text) => ({
                    ...text,
                    scale: Math.max(TEXT_SCALE_MIN, text.scale - TEXT_SCALE_STEP),
                  }))
                }
              >
                A−
              </ToolButton>
              <ToolButton
                label="글자 크게"
                disabled={selectedText.scale >= TEXT_SCALE_MAX}
                onClick={() =>
                  updateSelectedText((text) => ({
                    ...text,
                    scale: Math.min(TEXT_SCALE_MAX, text.scale + TEXT_SCALE_STEP),
                  }))
                }
              >
                A+
              </ToolButton>
              <ToolButton
                label="왼쪽으로 회전"
                onClick={() =>
                  updateSelectedText((text) => ({ ...text, rotation: text.rotation - TEXT_ROTATION_STEP }))
                }
              >
                ⟲
              </ToolButton>
              <ToolButton
                label="오른쪽으로 회전"
                onClick={() =>
                  updateSelectedText((text) => ({ ...text, rotation: text.rotation + TEXT_ROTATION_STEP }))
                }
              >
                ⟳
              </ToolButton>
              <ToolButton
                label="선택한 글자 삭제"
                onClick={() => {
                  commit({ ...current, text: current.text.filter((_, index) => index !== selectedTextIndex) });
                  setSelectedTextIndex(null);
                }}
              >
                🗑️
              </ToolButton>
            </div>
            <div role="group" aria-label="글꼴" className="flex gap-1.5">
              {FONTS.map((option) => (
                <ToolButton
                  key={option.font}
                  pressed={selectedText.font === option.font}
                  onClick={() => updateSelectedText((text) => ({ ...text, font: option.font }))}
                >
                  <span style={{ fontFamily: option.font }}>{option.label}</span>
                </ToolButton>
              ))}
            </div>
          </>
        )}

        {mode === "text" && !selectedText && job.cake.text.length > 0 && (
          <p className="text-xs text-[var(--theme-text)]/70">
            케이크 위 글자를 눌러 선택하면 크기·회전·색·글꼴을 바꿀 수 있어요
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <ToolButton label="실행 취소" disabled={undoStack.length === 0} onClick={undo}>
            ↶
          </ToolButton>
          <ToolButton label="다시 실행" disabled={redoStack.length === 0} onClick={redo}>
            ↷
          </ToolButton>
          <ToolButton disabled={job.cake.drawings.length === 0} onClick={() => commit({ ...current, drawings: [] })}>
            그림 전체 지우기
          </ToolButton>
        </div>

        <button
          type="button"
          data-tutorial="complete"
          onClick={onFinish}
          className="rounded-full bg-[var(--theme-accent)] px-6 py-2 text-base font-bold text-white shadow-sm transition-transform active:scale-95 short:py-1 short:text-sm"
        >
          완성 🎉
        </button>
      </div>
    </div>
  );
}

type ToolButtonProps = {
  children: ReactNode;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  label?: string; // 아이콘/기호만 있는 버튼의 접근 가능한 이름 (18장)
  wide?: boolean;
};

function ToolButton({ children, onClick, pressed, disabled, label, wide }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className={`flex min-h-8 min-w-8 items-center justify-center rounded-full px-2.5 py-1 text-sm font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-40 disabled:active:scale-100 ${
        wide ? "flex-1" : ""
      } ${pressed ? "bg-[var(--theme-accent)] text-white" : "bg-white/80 text-[var(--theme-text)]"}`}
    >
      {children}
    </button>
  );
}
