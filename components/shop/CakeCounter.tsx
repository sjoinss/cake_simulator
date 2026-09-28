import type { PointerEventHandler } from "react";
import type { ActiveOrder } from "@/lib/gameState";
import { initialMaterials } from "@/lib/materials";
import { CakeSnapshot } from "@/components/game/cake/CakeSnapshot";

// 계산대 위 완성 케이크를 손님 테이블로 끌어다 놓기 위한 포인터 핸들러 묶음. 실제 드래그 상태는 ShopScreen이 가진다.
export type CakeDragHandlers = {
  onPointerDown: PointerEventHandler<HTMLButtonElement>;
  onPointerMove: PointerEventHandler<HTMLButtonElement>;
  onPointerUp: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel: PointerEventHandler<HTMLButtonElement>;
};

type CakeCounterProps = {
  cake: ActiveOrder | null; // 완성된 케이크가 올라오면 표시. Phase 1은 최대 1개
  orderLabel: string | null; // 어느 주문 케이크인지 표시 ("#1", cake-tycoon-prompt.md 3장)
  queuedCount: number; // 계산대에 못 올라가고 대기 중인 완성 케이크 수
  isDragging: boolean; // 드래그 중엔 받침대 위 원본을 숨기고 손가락을 따라다니는 케이크만 보여준다
  dragHandlers: CakeDragHandlers;
  onKeyboardServe: () => void; // 키보드(Enter/Space) 사용자용 대체 서빙 (18장 접근성 원칙)
};

// 체크무늬 손수건 패턴 (대각선 체크, 클래식 베이커리 느낌)
const checkeredClothStyle = {
  backgroundImage:
    "linear-gradient(45deg, #dd6b63 25%, transparent 25%, transparent 75%, #dd6b63 75%), " +
    "linear-gradient(45deg, #dd6b63 25%, transparent 25%, transparent 75%, #dd6b63 75%)",
  backgroundSize: "10px 10px",
  backgroundPosition: "0 0, 5px 5px",
  backgroundColor: "white",
};

// 계산대(카운터) 위에 놓이는 체크무늬 손수건 + 케이크 받침대. 카운터 자체(책상)는 PlayerSide에서 그린다.
// 손수건은 회전시킨 사각형 대신 clip-path로 다이아몬드를 직접 그려서(바닥 기준점 계산이 쉬움),
// 받침대를 손수건의 가장 넓은 지점(중간 높이) 위에 겹쳐서 자연스럽게 놓인 것처럼 보이게 한다.
export function CakeCounter({ cake, orderLabel, queuedCount, isDragging, dragHandlers, onKeyboardServe }: CakeCounterProps) {
  return (
    <div role="img" aria-label={cake ? "받침대 위에 놓인 완성된 케이크" : "빈 케이크 받침대"} className="relative h-28 w-28">
      {/* 체크무늬 손수건: 피크닉 바구니 아래 깔린 마름모 모양. 받침대보다 확실히 크게 깐다. */}
      <div
        className="absolute bottom-0 left-1/2 h-24 w-24 -translate-x-1/2 drop-shadow-[0_3px_4px_rgba(0,0,0,0.2)]"
        style={{ ...checkeredClothStyle, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
        aria-hidden
      />

      {/* 케이크 받침대: 손수건의 가장 넓은 중간 높이에 겹쳐서 배치. 상판(넓다) → 아래로 갈수록 넓어지는
          나팔 모양 기둥 실루엣 (box-shadow는 clip-path 모양을 따라가지 않아 drop-shadow로 대체) */}
      <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center">
        {cake && (
          <div className={`absolute bottom-full -mb-1 flex flex-col-reverse items-center ${isDragging ? "opacity-0" : ""}`}>
            <button
              type="button"
              aria-label={`${orderLabel ?? ""} 완성된 케이크. 손님 테이블로 끌어다 놓아 서빙하세요`}
              {...dragHandlers}
              onClick={(event) => {
                // detail === 0 이면 마우스/터치가 아니라 키보드(Enter/Space)로 누른 것
                if (event.detail === 0) onKeyboardServe();
              }}
              className="animate-cake-wiggle cursor-grab touch-none select-none border-0 bg-transparent p-0 leading-none drop-shadow-[0_3px_3px_rgba(0,0,0,0.25)] active:cursor-grabbing"
            >
              {/* 아이콘 대신 실제로 만든 입체 케이크를 받침대 위에 올린다 */}
              <CakeSnapshot cake={cake.cake} materials={initialMaterials} size={60} label="완성된 케이크" />
            </button>
            {/* 어느 주문 케이크인지 번호표 (케이크 위쪽) */}
            {orderLabel && (
              <span className="mb-0.5 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[var(--theme-text)] shadow-sm">
                {orderLabel}
                {queuedCount > 0 && ` +${queuedCount}`}
              </span>
            )}
          </div>
        )}
        {/* 받침대 상판: 흰 체크무늬 손수건 위에서도 구분되도록 얇은 테두리 + 그림자로 윤곽을 준다 */}
        <div className="h-3 w-16 rounded-[50%] bg-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.15),0_3px_4px_rgba(0,0,0,0.3)]" />
        {/* 받침대 기둥: 위는 좁고 아래는 넓게 퍼지는 나팔 모양 */}
        <div
          className="h-8 w-11 bg-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)]"
          style={{ clipPath: "polygon(40% 0%, 60% 0%, 85% 100%, 15% 100%)" }}
        />
      </div>
    </div>
  );
}
