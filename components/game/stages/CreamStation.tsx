"use client";

import { useState } from "react";
import type { ActiveOrder, Customer, MaterialRegistry, SpreadLayer } from "@/lib/gameState";
import {
  CREAM_AMOUNT_LABEL,
  CREAM_TARGET_THICKNESS,
  FILLING_TARGET_THICKNESS,
  scoreFrostingLayer,
  scoreSpread,
} from "@/lib/frosting";
import { getUnlockedMaterials } from "@/lib/materials";
import { SpreadStage, type SpreadData } from "./SpreadStage";
import { StepDone, StepTabsLayout } from "./StepTabsLayout";

type CreamStationProps = {
  order: ActiveOrder;
  orderSpec: Customer["order"];
  materials: MaterialRegistry;
  rank: number;
  onUpdate: (updater: (order: ActiveOrder) => ActiveOrder) => void;
};

type Step = "filling" | "frosting";

const withLayer = (order: ActiveOrder, layer: Step, patch: Partial<SpreadLayer>): ActiveOrder => ({
  ...order,
  cake: { ...order.cake, [layer]: { ...order.cake[layer], ...patch } },
});

// 필링·크림 스테이션. 구운 시트를 가로로 갈라 안에 필링(잼 등)을 바르고(필링 탭) → 덮은 뒤 겉에 크림을 바른다(크림 탭).
// 필링을 마쳐야 크림 탭이 열리고, 크림을 마치면 케이크가 토핑·데코 스테이션으로 넘어간다.
export function CreamStation({ order, orderSpec, materials, rank, onUpdate }: CreamStationProps) {
  const { filling } = order.cake;
  const [step, setStep] = useState<Step>(filling.done ? "frosting" : "filling");

  const creamThickness = CREAM_TARGET_THICKNESS[orderSpec.creamAmount];

  const finishFilling = ({ cells }: SpreadData) =>
    onUpdate((o) => withLayer(o, "filling", { cells, done: true, ...scoreSpread(cells, FILLING_TARGET_THICKNESS) }));

  // 크림까지 끝나면 케이크는 토핑·데코 스테이션으로 넘어간다
  const finishFrosting = ({ cells, side }: SpreadData) =>
    onUpdate((o) => ({
      ...withLayer(o, "frosting", { cells, side, done: true, ...scoreFrostingLayer(cells, side, creamThickness) }),
      stage: "decorate",
    }));

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
            detail={`범위 ${filling.coverage}점 · 균일도 ${filling.evenness}점 · 양 ${filling.amount}점`}
            nextLabel="크림 바르기 →"
            onNext={() => setStep("frosting")}
          />
        ) : (
          <SpreadStage
            key="filling"
            order={order}
            materials={materials}
            layer="filling"
            options={getUnlockedMaterials(materials, "filling", rank)}
            targetThickness={FILLING_TARGET_THICKNESS}
            targetLabel="적정량"
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
          order={order}
          materials={materials}
          layer="frosting"
          options={getUnlockedMaterials(materials, "cream", rank)}
          targetThickness={creamThickness}
          targetLabel={CREAM_AMOUNT_LABEL[orderSpec.creamAmount]}
          onSelectMaterial={(materialId) => onUpdate((o) => withLayer(o, "frosting", { materialId }))}
          onSave={(data) => onUpdate((o) => withLayer(o, "frosting", data))}
          onFinish={finishFrosting}
        />
      )}
    </StepTabsLayout>
  );
}
