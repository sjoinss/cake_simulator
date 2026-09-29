import { withBasePath } from "@/lib/assets";

// 스티커 한 장의 모습: 그림 스티커면 그림, 아니면 이모지 (편집 화면·완성 케이크·팔레트 공용)
export function StickerGlyph({ sticker, size = 28 }: { sticker: { image?: string; emoji?: string }; size?: number }) {
  if (sticker.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 작은 정적 그림이라 next/image 최적화가 필요 없다
      <img
        src={withBasePath(sticker.image)}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none block object-contain select-none"
        style={{ width: size * 1.3, height: size * 1.3 }}
      />
    );
  }
  return (
    <span aria-hidden className="block leading-none" style={{ fontSize: size }}>
      {sticker.emoji}
    </span>
  );
}
