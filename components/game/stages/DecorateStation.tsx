"use client";

import { useState } from "react";
import type { CakeJob, MaterialRegistry } from "@/lib/gameState";
import { DecorationStage } from "./DecorationStage";
import { StepDone, StepTabsLayout } from "./StepTabsLayout";
import { ToppingStage } from "./ToppingStage";

type DecorateStationProps = {
  job: CakeJob;
  materials: MaterialRegistry;
  owned: readonly string[]; // 가진 재료 (player.unlockedItems)
  onUpdate: (updater: (job: CakeJob) => CakeJob) => void;
  onComplete: () => void;
};

type Step = "topping" | "decoration";

// 토핑·데코 스테이션. 토핑을 올리고(토핑 탭) "토핑 완료"를 눌러야 데코 탭이 열린다.
// 데코 탭에 들어갈 때마다 카메라가 위로 올라가는 Top View 전환 연출이 재생된다 (4장).
export function DecorateStation({ job, materials, owned, onUpdate, onComplete }: DecorateStationProps) {
  const { toppingsDone } = job.cake;
  const [step, setStep] = useState<Step>(toppingsDone ? "decoration" : "topping");

  const handleToggleTopping = (itemId: string, x: number, y: number) =>
    onUpdate((o) => {
      const existingIndex = o.cake.toppings.findIndex((t) => Math.abs(t.x - x) < 1 && Math.abs(t.y - y) < 1);
      const toppings =
        existingIndex >= 0
          ? o.cake.toppings.filter((_, index) => index !== existingIndex)
          : [...o.cake.toppings, { itemId, x, y }];
      return { ...o, cake: { ...o.cake, toppings } };
    });

  return (
    <StepTabsLayout
      active={step}
      onChange={setStep}
      tabs={[
        { id: "topping", emoji: "🍓", label: "토핑", done: toppingsDone, locked: false },
        { id: "decoration", emoji: "✏️", label: "데코", done: false, locked: !toppingsDone, lockedNote: "토핑 먼저" },
      ]}
    >
      {step === "topping" &&
        (toppingsDone ? (
          <StepDone
            title="토핑 완료!"
            detail={`토핑 ${job.cake.toppings.length}개`}
            nextLabel="데코하기 →"
            onNext={() => setStep("decoration")}
          />
        ) : (
          <ToppingStage
            job={job}
            materials={materials}
            owned={owned}
            onToggleTopping={handleToggleTopping}
            onNext={() => {
              onUpdate((o) => ({ ...o, cake: { ...o.cake, toppingsDone: true } }));
              setStep("decoration");
            }}
          />
        ))}

      {step === "decoration" && toppingsDone && (
        <DecorationStage
          job={job}
          materials={materials}
          onChange={(decoration) => onUpdate((o) => ({ ...o, cake: { ...o.cake, ...decoration } }))}
          onFinish={onComplete}
        />
      )}
    </StepTabsLayout>
  );
}
