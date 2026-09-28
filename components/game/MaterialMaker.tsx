"use client";

import { useState } from "react";
import {
  addCustomMaterial,
  getActiveCustomMaterials,
  removeCustomMaterial,
  type CustomMaterialCategory,
} from "@/lib/materials";
import type { Material } from "@/lib/gameState";
import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";
import { MaterialPicker, type MaterialContainer } from "./MaterialPicker";

const CATEGORIES: { id: CustomMaterialCategory; label: string; container: MaterialContainer; color: string }[] = [
  { id: "base", label: "시트", container: "bowl", color: "#e9c99a" },
  { id: "filling", label: "필링", container: "jar", color: "#c86bd6" },
  { id: "cream", label: "크림", container: "bag", color: "#bfe3f0" },
  { id: "topping", label: "토핑", container: "bowl", color: "#ff9f43" },
];

// 윈도우 10에서도 보이는 이모지만 추천한다
const EMOJI_SUGGESTIONS = [
  "🍑",
  "🍊",
  "🍌",
  "🍇",
  "🍍",
  "🥭",
  "🍈",
  "🍏",
  "🥥",
  "🌰",
  "🍯",
  "☕",
  "🍬",
  "🍭",
  "🌸",
  "⭐",
];
const NAME_MAX = 10;

// 입력한 글자에서 첫 이모지(글자 하나)만 쓴다. 결합 이모지도 한 글자로 센다.
function firstGrapheme(text: string) {
  const segment = new Intl.Segmenter("ko", { granularity: "grapheme" }).segment(text.trim())[Symbol.iterator]().next();
  return segment.done ? "" : segment.value.segment;
}

// "가게 꾸미기" 창의 재료 탭: 나만의 재료를 만들면 선반에 올라가고 손님 주문에도 나온다 (8장 커스텀 재료).
export function MaterialMaker() {
  // 재료 목록이 바뀌면 다시 그려지도록 구독한다
  useMaterialRegistry();
  const customMaterials = getActiveCustomMaterials();
  const [category, setCategory] = useState<CustomMaterialCategory>("filling");
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORIES[1].color);
  const [emoji, setEmoji] = useState(EMOJI_SUGGESTIONS[0]);

  const current = CATEGORIES.find((item) => item.id === category) ?? CATEGORIES[0];
  const trimmedName = name.trim();
  const preview: Material = {
    id: "preview",
    category,
    name: trimmedName || "새 재료",
    color,
    emoji: emoji || "❔",
    isCustom: true,
    unlockRank: 0,
  };

  const handleCreate = () => {
    if (!trimmedName || !emoji) return;
    addCustomMaterial({ category, name: trimmedName, color, emoji });
    setName("");
  };

  return (
    <div className="flex flex-col gap-3 short:gap-2">
      <div className="flex gap-4 short:gap-3">
        <form
          className="flex min-w-0 flex-1 flex-col gap-2 short:gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            handleCreate();
          }}
        >
          <div role="radiogroup" aria-label="재료 종류" className="flex gap-1">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={item.id === category}
                onClick={() => setCategory(item.id)}
                className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm active:scale-95 ${
                  item.id === category ? "bg-[var(--theme-accent)] text-white" : "bg-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-xs font-bold">
              이름
              <input
                value={name}
                maxLength={NAME_MAX}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: 복숭아"
                className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm font-normal"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs font-bold">
              색
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-7 w-9 cursor-pointer rounded border border-black/10 bg-white p-0.5"
              />
            </label>
          </div>

          <div className="flex items-start gap-2">
            <label className="flex shrink-0 items-center gap-2 text-xs font-bold">
              모양
              <input
                value={emoji}
                onChange={(event) => setEmoji(firstGrapheme(event.target.value))}
                aria-label="재료 이모지"
                className="w-10 rounded-lg border border-black/10 bg-white py-1 text-center text-base"
              />
            </label>
            <div className="flex flex-wrap gap-0.5" aria-label="추천 이모지">
              {EMOJI_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setEmoji(suggestion)}
                  aria-label={`${suggestion} 고르기`}
                  aria-pressed={suggestion === emoji}
                  className={`h-7 w-7 rounded-md text-base leading-none active:scale-90 ${
                    suggestion === emoji ? "bg-white shadow-sm ring-2 ring-[var(--theme-accent)]" : "hover:bg-white/70"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!trimmedName || !emoji}
            className="self-start rounded-full bg-[var(--theme-accent)] px-4 py-1.5 text-sm font-bold text-white shadow-sm active:scale-95 disabled:opacity-40"
          >
            {current.label} 재료 만들기
          </button>
        </form>

        {/* 선반에 올라갈 모습 미리보기 */}
        <div className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-white/70 py-2 short:w-24">
          <MaterialPicker
            materials={[preview]}
            selectedId={null}
            label="미리보기"
            container={current.container}
            inactive
            onSelect={() => {}}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold">내가 만든 재료</h3>
        {customMaterials.length === 0 ? (
          <p className="text-xs text-[var(--theme-text)]/60">
            아직 없어요. 만든 재료는 선반에 올라가고 손님도 주문하기 시작해요.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {customMaterials.map((material) => (
              <li
                key={material.id}
                className="flex items-center gap-1.5 rounded-full bg-white py-0.5 pr-1 pl-2 text-xs shadow-sm"
              >
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ backgroundColor: material.color }}
                />
                <span>{material.emoji}</span>
                <span className="font-bold">{material.name}</span>
                <span className="text-[var(--theme-text)]/50">
                  {CATEGORIES.find((item) => item.id === material.category)?.label}
                </span>
                <button
                  type="button"
                  onClick={() => removeCustomMaterial(material.id)}
                  aria-label={`${material.name} 지우기`}
                  className="rounded-full px-1.5 leading-5 text-[var(--theme-text)]/50 hover:bg-black/5"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
