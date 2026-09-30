import type { ComponentProps } from "react";
import { OWNER_IMAGE_KEY, useCustomImages } from "@/components/game/CustomImages";
import { ImageDropZone } from "@/components/game/ImageDropZone";
import { ShopSign } from "./ShopSign";
import { CakeCounter } from "./CakeCounter";

type PlayerSideProps = {
  counter: ComponentProps<typeof CakeCounter>;
};

// 차양 줄무늬 한 칸 폭(px). 줄무늬와 아래 물결(scallop) 테두리가 같은 주기로 맞물린다.
const STRIPE = 22;
const AWNING_COLOR = "var(--theme-accent)";

// 계산대 쪽 (플레이어 공간). 제작 스테이션과 같은 주방이라 같은 파스텔 타일 벽과 나무 조리대 톤을 쓰고,
// 계산대 위에 코랄·흰색 줄무늬 차양을 달아 "빵집 판매대"처럼 보이게 한다 — 매장 화면에서 가장 눈에 띄는 요소는 이 차양 하나.
// 캐릭터는 나중에 <img> + 파츠 레이어로 교체. 계산대 위 완성 케이크 표시/드래그는 CakeCounter가 담당.
export function PlayerSide({ counter }: PlayerSideProps) {
  return (
    <section aria-label="플레이어 공간" className="relative flex flex-1 basis-2/5 flex-col overflow-hidden">
      {/* 타일 벽 (스테이션 배경과 같은 패턴) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--theme-wall)",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(255,255,255,0.7) 1.5px, transparent 1.5px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* 줄무늬 차양 + 물결 테두리 */}
      <div aria-hidden className="relative z-10 shrink-0">
        <div
          className="h-7 shadow-[0_2px_0_rgba(0,0,0,0.05)] short:h-5"
          style={{
            background: `repeating-linear-gradient(90deg, ${AWNING_COLOR} 0 ${STRIPE}px, #fffaf6 ${STRIPE}px ${STRIPE * 2}px)`,
          }}
        />
        <div
          className="h-3 drop-shadow-[0_3px_2px_rgba(120,60,40,0.18)]"
          style={{
            background: `radial-gradient(circle at ${STRIPE / 2}px 0, ${AWNING_COLOR} ${STRIPE / 2 - 0.5}px, transparent ${STRIPE / 2}px) 0 0 / ${STRIPE * 2}px 12px repeat-x, radial-gradient(circle at ${STRIPE / 2}px 0, #fffaf6 ${STRIPE / 2 - 0.5}px, transparent ${STRIPE / 2}px) ${STRIPE}px 0 / ${STRIPE * 2}px 12px repeat-x`,
          }}
        />
      </div>

      {/* 차양 아래 매달린 가게 간판 (이름은 펜을 눌러 고칠 수 있다) */}
      <div className="relative z-10 -mt-1">
        <ShopSign />
      </div>

      {/* 주인 캐릭터: 왼쪽으로 치우쳐 서 있고, 앞(계산대 위)에 금전등록기가 놓인다. 오른쪽은 케이크 받침대 자리 */}
      <div className="relative flex min-h-0 flex-1 items-end pl-[calc(28%-7rem+var(--safe-l))] short:pl-[calc(28%-4.5rem+var(--safe-l))]">
        <ChefCharacter />
      </div>

      {/* 계산대: 스테이션 조리대와 같은 나무 톤. 넓은 상판(위에서 내려다보는 면) + 세로 널빤지 앞판.
          받침대 아래 체크무늬 천이 상판 안에 다 들어오도록 높이를 넉넉히 잡는다 (예전 1/4 — 천이 앞판으로 삐져나왔다) */}
      <div className="relative h-[30%] min-h-28 w-full shrink-0">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[62%] bg-[#e7c3a0] shadow-[inset_0_3px_0_rgba(255,255,255,0.45),0_-3px_8px_rgba(0,0,0,0.08)]"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[38%] shadow-[inset_0_3px_4px_rgba(0,0,0,0.12)]"
          style={{
            backgroundColor: "#c99466",
            backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,0.07) 0 2px, transparent 2px 26px)",
          }}
        />

        {/* 금전등록기: 주인 캐릭터 바로 앞 (계산대 상판 위) */}
        <div className="absolute bottom-[62%] left-[calc(28%+var(--safe-l))] origin-bottom -translate-x-1/2 short:scale-[0.75]">
          <CashRegister />
        </div>

        {/* 케이크 받침대: 오른쪽에 넉넉히 두고 케이크를 크게 보여준다. 천 중심(상자 바닥에서 22px 위)이 상판 한가운데에 온다 */}
        <div className="absolute bottom-[calc(69%-22px)] left-[68%] origin-bottom -translate-x-1/2">
          <CakeCounter {...counter} />
        </div>
      </div>
    </section>
  );
}

// 주인 캐릭터 자리. 그림 파일을 끌어다 놓으면(또는 눌러서 고르면) 바뀌고, 오른쪽 위 X로 기본 그림으로 돌아간다.
// 기본 그림(lib/assets.ts의 DEFAULT_OWNER_IMAGE)도 없으면 크기를 가늠하는 반투명 네모만 보여준다.
// 아래쪽은 계산대에 가려지도록 계산대 뒤로 내려 둔다.
function ChefCharacter() {
  const { ownerImage, hasCustomOwner, setImage, clearImage } = useCustomImages();
  return (
    <ImageDropZone
      imageUrl={ownerImage}
      isCustom={hasCustomOwner}
      label="주인 캐릭터 그림"
      onFile={(file) => setImage(OWNER_IMAGE_KEY, file)}
      onClear={() => clearImage(OWNER_IMAGE_KEY)}
      className="-mb-24 h-96 max-h-[calc(100%+6rem)] w-56 short:-mb-14 short:h-56 short:max-h-[calc(100%+3.5rem)] short:w-36"
      imageClassName="object-bottom"
    >
      <span className="flex h-full w-full items-center justify-center rounded-t-3xl border-2 border-dashed border-[var(--theme-text)]/30 bg-white/35 pb-10 text-center text-[11px] font-bold text-[var(--theme-text)]/45 short:pb-6 short:text-[9px]">
        주인 캐릭터
        <br />
        그림을 끌어다 놓으세요
      </span>
    </ImageDropZone>
  );
}

// 레트로 금전등록기: 뒤쪽에 금액 표시창, 비스듬한 몸체에 버튼들, 아래 돈 서랍
function CashRegister() {
  return (
    <div aria-hidden className="flex flex-col items-center drop-shadow-[0_4px_4px_rgba(90,50,30,0.25)]">
      {/* 금액 표시창 */}
      <div className="flex h-5 w-12 items-center justify-center rounded-t-md bg-[var(--theme-accent)] px-1">
        <div className="flex h-3 w-full items-center justify-end rounded-sm bg-[#e4f4ee] pr-1 text-[8px] leading-none font-bold text-[#4a7a6a]">
          $0.00
        </div>
      </div>
      {/* 몸체 + 버튼 */}
      <div
        className="grid h-9 w-24 grid-cols-4 content-center gap-x-1 gap-y-[3px] bg-[#fff4e6] px-4"
        style={{ clipPath: "polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)" }}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className={`h-2 rounded-[3px] shadow-[0_1px_0_rgba(0,0,0,0.15)] ${
              index === 7 ? "bg-[var(--theme-accent)]" : "bg-[#f1ddc9]"
            }`}
          />
        ))}
      </div>
      {/* 돈 서랍 */}
      <div className="flex h-4 w-24 items-center justify-center rounded-b-md bg-[#f1ddc9] shadow-[inset_0_1.5px_0_rgba(0,0,0,0.08)]">
        <span className="h-1 w-5 rounded-full bg-[#c99466]" />
      </div>
    </div>
  );
}
