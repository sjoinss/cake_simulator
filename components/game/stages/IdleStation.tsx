import type { WorkStation } from "@/lib/gameState";
import { createPlaceholderJob } from "@/lib/cake";
import { FILLING_TARGET_THICKNESS } from "@/lib/frosting";
import { getUnlockedMaterials, initialMaterials } from "@/lib/materials";
import { BaseSelectStage } from "./BaseSelectStage";
import { SpreadStage } from "./SpreadStage";
import { StepTabsLayout } from "./StepTabsLayout";
import { ToppingStage } from "./ToppingStage";

const noop = () => {};

// 작업할 케이크가 없는 스테이션. 빈 안내 문구 대신 선반·빈 틀/케이크 받침·도구가 세팅된 작업대를 그대로 보여주고,
// 조작만 막아둔다 (케이크만 없는 상태). 각 단계 컴포넌트의 idle 모드를 그대로 쓴다.
export function IdleStation({ station, rank }: { station: WorkStation; rank: number }) {
  const job = createPlaceholderJob();

  if (station === "base") {
    return (
      <BaseSelectStage
        job={job}
        materials={initialMaterials}
        rank={rank}
        onSelectBase={noop}
        onSaveBatter={noop}
        onNext={noop}
        idle
      />
    );
  }

  if (station === "cream") {
    return (
      <StepTabsLayout
        active="filling"
        onChange={noop}
        tabs={[
          { id: "filling", emoji: "🍓", label: "필링", done: false, locked: false },
          { id: "frosting", emoji: "🍦", label: "크림", done: false, locked: true, lockedNote: "필링 먼저" },
        ]}
      >
        <SpreadStage
          job={job}
          materials={initialMaterials}
          layer="filling"
          options={getUnlockedMaterials(initialMaterials, "filling", rank)}
          targets={[{ label: "적정량", thickness: FILLING_TARGET_THICKNESS }]}
          onSelectMaterial={noop}
          onSave={noop}
          onFinish={noop}
          idle
        />
      </StepTabsLayout>
    );
  }

  return (
    <StepTabsLayout
      active="topping"
      onChange={noop}
      tabs={[
        { id: "topping", emoji: "🍓", label: "토핑", done: false, locked: false },
        { id: "decoration", emoji: "✏️", label: "데코", done: false, locked: true, lockedNote: "토핑 먼저" },
      ]}
    >
      <ToppingStage job={job} materials={initialMaterials} rank={rank} onToggleTopping={noop} onNext={noop} idle />
    </StepTabsLayout>
  );
}
