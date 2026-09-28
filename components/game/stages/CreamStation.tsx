"use client";

import { useState } from "react";
import type { CakeJob, CreamAmount, MaterialRegistry, SpreadLayer } from "@/lib/gameState";
import { CREAM_AMOUNT_LABEL, CREAM_TARGET_THICKNESS, FILLING_TARGET_THICKNESS, scoreSpread } from "@/lib/frosting";
import { getUnlockedMaterials } from "@/lib/materials";
import { SpreadStage, type SpreadData } from "./SpreadStage";
import { StepDone, StepTabsLayout } from "./StepTabsLayout";

type CreamStationProps = {
  job: CakeJob;
  materials: MaterialRegistry;
  rank: number;
  onUpdate: (updater: (job: CakeJob) => CakeJob) => void;
};

type Step = "filling" | "frosting";

// 크림 게이지 눈금: 케이크가 주문과 묶여 있지 않아서 조금/보통/듬뿍을 다 보여주고, 주문서를 보고 맞춘다
const CREAM_TARGETS = (["light", "normal", "heavy"] as CreamAmount[]).map((amount) => ({
  label: CREAM_AMOUNT_LABEL[amount],
  thickness: CREAM_TARGET_THICKNESS[amount],
}));

const withLayer = (job: CakeJob, layer: Step, patch: Partial<SpreadLayer>): CakeJob => ({
  ...job,
  cake: { ...job.cake, [layer]: { ...job.cake[layer], ...patch } },
});

// 필링·크림 스테이션. 구운 시트를 가로로 갈라 안에 필링(잼 등)을 바르고(필링 탭) → 덮은 뒤 겉에 크림을 바른다(크림 탭).
// 필링을 마쳐야 크림 탭이 열리고, 크림을 마치면 케이크가 토핑·데코 스테이션으로 넘어간다.
// 점수는 여기서 매기지 않는다 — 서빙할 때 받은 손님 주문 기준으로 계산한다 (lib/scoring.ts).
export function CreamStation({ job, materials, rank, onUpdate }: CreamStationProps) {
  const { filling } = job.cake;
  const [step, setStep] = useState<Step>(filling.done ? "frosting" : "filling");
  const fillingScore = scoreSpread(filling.cells, FILLING_TARGET_THICKNESS);

  const finishFilling = ({ cells }: SpreadData) => onUpdate((o) => withLayer(o, "filling", { cells, done: true }));

  // 크림까지 끝나면 케이크는 토핑·데코 스테이션으로 넘어간다
  const finishFrosting = ({ cells, side }: SpreadData) =>
    onUpdate((o) => ({ ...withLayer(o, "frosting", { cells, side, done: true }), stage: "decorate" }));

  return (
    <StepTabsLayout
      active={step}
      onChange={setStep}
      tabs={[
        { id: "filling", emoji: "🍓", label: "필링", done: filling.done, locked: false },
        { id: "frosting", emoji: "🍦", label: "크림", done: false, locked: !filling.done, lockedNote: "필링 먼저" },
      ]}
    >
      {step === "filling" &&
        (filling.done ? (
          <StepDone
            title="필링 완료! 시트를 덮었어요"
            detail={`범위 ${fillingScore.coverage}점 · 균일도 ${fillingScore.evenness}점 · 양 ${fillingScore.amount}점`}
            nextLabel="크림 바르기 →"
            onNext={() => setStep("frosting")}
          />
        ) : (
          <SpreadStage
            key="filling"
            job={job}
            materials={materials}
            layer="filling"
            options={getUnlockedMaterials(materials, "filling", rank)}
            targets={[{ label: "적정량", thickness: FILLING_TARGET_THICKNESS }]}
            onSelectMaterial={(materialId) => onUpdate((o) => withLayer(o, "filling", { materialId }))}
            onSave={({ cells }) => onUpdate((o) => withLayer(o, "filling", { cells }))}
            onFinish={(data) => {
              finishFilling(data);
              setStep("frosting");
            }}
          />
        ))}

      {step === "frosting" && filling.done && (
        <SpreadStage
          key="frosting"
          job={job}
          materials={materials}
          layer="frosting"
          options={getUnlockedMaterials(materials, "cream", rank)}
          targets={CREAM_TARGETS}
          onSelectMaterial={(materialId) => onUpdate((o) => withLayer(o, "frosting", { materialId }))}
          onSave={(data) => onUpdate((o) => withLayer(o, "frosting", data))}
          onFinish={finishFrosting}
        />
      )}
    </StepTabsLayout>
  );
}
