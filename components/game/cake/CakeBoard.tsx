type CakeBoardProps = {
  size: number; // 가로 폭(px)
};

// 케이크를 올려놓는 빈 받침(케이크 보드). 주문이 없어 케이크가 아직 없는 스테이션에서 케이크 자리에 놓아둔다.
export function CakeBoard({ size }: CakeBoardProps) {
  const height = size * 0.42;
  return (
    <div aria-hidden className="relative shrink-0" style={{ width: size, height: height + size * 0.06 }}>
      <div
        className="absolute inset-x-[2%] rounded-[50%] bg-black/15 blur-[3px]"
        style={{ top: height * 0.35, height: height * 0.8 }}
      />
      {/* 두께 (앞쪽 가장자리) */}
      <div className="absolute inset-x-0 rounded-[50%] bg-[#d9dde2]" style={{ top: size * 0.04, height }} />
      {/* 윗면 */}
      <div
        className="absolute inset-x-0 top-0 rounded-[50%] bg-[linear-gradient(160deg,#ffffff,#eef1f4)] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.08)]"
        style={{ height }}
      />
      <div
        className="absolute inset-x-[12%] rounded-[50%] border border-black/5"
        style={{ top: height * 0.12, height: height * 0.76 }}
      />
    </div>
  );
}
