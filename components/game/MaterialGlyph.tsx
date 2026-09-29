import type { Material } from "@/lib/gameState";
import { withBasePath } from "@/lib/assets";

// 재료를 작게 보여줄 때: 그림(icon)이 있으면 그림, 없으면 이모지. size는 대략 이모지 글자 크기(px)
export function MaterialGlyph({ material, size, className = "" }: { material: Pick<Material, "emoji" | "icon">; size: number; className?: string }) {
  if (material.icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 작은 정적 그림이라 next/image 최적화가 필요 없다
      <img
        src={withBasePath(material.icon)}
        alt=""
        aria-hidden
        draggable={false}
        className={`inline-block object-contain select-none ${className}`}
        style={{ width: size * 1.15, height: size * 1.15 }}
      />
    );
  }
  return (
    <span aria-hidden className={`leading-none ${className}`} style={{ fontSize: size }}>
      {material.emoji}
    </span>
  );
}
