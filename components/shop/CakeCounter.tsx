import type { PointerEventHandler } from "react";
import { useIsShort } from "@/hooks/useIsShort";
import type { CakeJob } from "@/lib/gameState";
import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";
import { CakeSnapshot } from "@/components/game/cake/CakeSnapshot";
import { DiscardButton } from "@/components/game/DiscardButton";

// 계산대 위 완성 케이크를 손님 테이블로 끌어다 놓기 위한 포인터 핸들러 묶음. 실제 드래그 상태는 ShopScreen이 가진다.
export type CakeDragHandlers = {
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
};

type CakeCounterProps = {
  cake: CakeJob | null; // 완성된 케이크가 올라오면 표시. 받침대에는 1개만 (먼저 완성된 것부터)
  queuedCount: number; // 받침대에 못 올라가고 대기 중인 완성 케이크 수
  isDragging: boolean; // 드래그 중엔 받침대 위 원본을 숨기고 손가락을 따라다니는 케이크만 보여준다
  dragHandlers: CakeDragHandlers;
  onKeyboardServe: () => void; // 키보드(Enter/Space) 사용자용 대체 서빙 (18장 접근성 원칙)
  onDiscard: () => void; // 줄 손님이 없는 케이크는 버린다
};

// 체크무늬 천 패턴 (클래식 베이커리 느낌)
const checkeredClothStyle = {
  backgroundImage:
    "linear-gradient(45deg, var(--theme-cloth) 25%, transparent 25%, transparent 75%, var(--theme-cloth) 75%), " +
    "linear-gradient(45deg, var(--theme-cloth) 25%, transparent 25%, transparent 75%, var(--theme-cloth) 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 10px 10px",
  backgroundColor: "#fffaf6",
};

// 천(정사각형) 한 변. 받침대·케이크를 키우면서(2026-09-30 사용자 요청) 같이 키웠다 (예전 112)
const CLOTH_PX = 160;
const CLOTH_PX_SHORT = 120;
// 계산대 상판을 비스듬히 내려다보는 각도에 맞춘 세로 눌림 비율 (케이크 윗면 타원 비율과 비슷하게)
const COUNTER_TILT = 0.36;

// 계산대 위 케이크 받침대. 체크무늬 천을 정사각형 그대로 45° 돌린 뒤 세로로 눌러서, 계산대 상판과 같은
// 원근으로 바닥에 깔린 것처럼 보이게 한다(체크 무늬까지 같이 눕는다). 받침대 발은 천 한가운데에 놓인다.
// 카운터 자체(책상)와 금전등록기는 PlayerSide에서 그린다.
export function CakeCounter({
  cake,
  queuedCount,
  isDragging,
  dragHandlers,
  onKeyboardServe,
  onDiscard,
}: CakeCounterProps) {
  const materialRegistry = useMaterialRegistry();
  const isShort = useIsShort();
  const cakeSize = isShort ? 92 : 128; // 예전 68 / 92
  const clothPx = isShort ? CLOTH_PX_SHORT : CLOTH_PX;

  return (
    <div className="relative h-60 w-56 short:h-44 short:w-36">
      {/* 줄 손님이 없는 케이크는 버리기 (받침대 오른쪽 아래) */}
      {cake && !isDragging && (
        <div className="absolute right-[-1.5rem] bottom-0 z-10 short:right-[-0.5rem]">
          <DiscardButton orderLabel="계산대" onDiscard={onDiscard} compact />
        </div>
      )}

      {/* 계산대 상판에 눕혀 깐 체크무늬 천 (중심이 아래에서 22px) */}
      <div aria-hidden className="absolute bottom-[22px] left-1/2 h-0 w-0 drop-shadow-[0_2px_2px_rgba(90,50,30,0.25)]">
        <div
          className="absolute rounded-[3px]"
          style={{
            ...checkeredClothStyle,
            width: clothPx,
            height: clothPx,
            left: -clothPx / 2,
            top: -clothPx / 2,
            transform: `scaleY(${COUNTER_TILT}) rotate(45deg)`,
          }}
        />
      </div>

      {/* 케이크 받침대: 발이 천 한가운데 → 나팔 모양 기둥 → 넓은 접시 (아래에서 위로 쌓는다) */}
      <div className="absolute bottom-[16px] left-1/2 flex -translate-x-1/2 flex-col items-center">
        {cake && (
          <div className={`relative z-10 -mb-4 flex flex-col items-center short:-mb-3 ${isDragging ? "opacity-0" : ""}`}>
            {/* 받침대에 못 올라간 완성 케이크 수 (케이크 위쪽) */}
            {queuedCount > 0 && (
              <span className="mb-0.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-[var(--theme-text)] shadow-sm">
                +{queuedCount}
              </span>
            )}
            <button
              type="button"
              aria-label="완성된 케이크. 주문한 손님 테이블로 끌어다 놓아 서빙하세요"
              {...dragHandlers}
              onClick={(event) => {
                // detail === 0 이면 마우스/터치가 아니라 키보드(Enter/Space)로 누른 것
                if (event.detail === 0) onKeyboardServe();
              }}
              className="animate-cake-wiggle cursor-grab touch-none border-0 bg-transparent p-0 leading-none select-none active:cursor-grabbing"
            >
              {/* 아이콘 대신 실제로 만든 입체 케이크를 받침대 위에 올린다 */}
              <CakeSnapshot cake={cake.cake} materials={materialRegistry} size={cakeSize} label="완성된 케이크" />
            </button>
          </div>
        )}
        {/* 접시 */}
        <div
          aria-hidden
          className="h-7 w-40 rounded-[50%] bg-[linear-gradient(180deg,#ffffff,#eee6e1)] shadow-[0_3px_0_#dcd0c8,0_5px_8px_rgba(90,50,30,0.2)] short:h-5 short:w-28"
        />
        {/* 기둥 */}
        <div
          aria-hidden
          className="h-10 w-14 bg-[linear-gradient(90deg,#e9e1dc,#ffffff_45%,#e3dad4)] short:h-7 short:w-10"
          style={{ clipPath: "polygon(38% 0%, 62% 0%, 88% 100%, 12% 100%)" }}
        />
        {/* 발 */}
        <div
          aria-hidden
          className="-mt-0.5 h-3.5 w-16 rounded-[50%] bg-[#eee6e1] shadow-[0_1px_2px_rgba(0,0,0,0.2)] short:h-2.5 short:w-12"
        />
      </div>
    </div>
  );
}
