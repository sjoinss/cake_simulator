import type { useGameState } from "@/hooks/useGameState";
import type { Station } from "@/lib/gameState";
import { BATTER_TARGET, scoreAmountMatch } from "@/lib/gameLogic";
import { useMaterialRegistry } from "@/hooks/useMaterialRegistry";
import { getCakesAtStage, getOvenQueue, getSelectedCake } from "@/lib/station";
import { BaseSelectStage } from "./stages/BaseSelectStage";
import { OvenStage } from "./stages/OvenStage";
import { CreamStation } from "./stages/CreamStation";
import { DecorateStation } from "./stages/DecorateStation";
import { IdleStation } from "./stages/IdleStation";
import { CakeSnapshot } from "./cake/CakeSnapshot";
import { DiscardButton } from "./DiscardButton";
import { StationBackdrop } from "./StationBackdrop";

type StationScreenProps = {
  gameState: ReturnType<typeof useGameState>;
  station: Exclude<Station, "order">;
};

// 제작 스테이션 화면 (시트 / 오븐 / 필링·크림 / 토핑·데코). 하단 스테이션 탭으로 언제든 오가며 여러 케이크를 동시에 진행한다.
// 각 케이크는 스테이션을 순서대로만 거친다 — 되돌아가는 버튼은 없다 (1장 2번).
// 케이크는 주문과 묶여 있지 않아서 주문 없이도 미리 만들어 둘 수 있다. 어느 주문용인지는 플레이어가 주문서를 보고 판단한다.
export function StationScreen({ gameState, station }: StationScreenProps) {
  const materialRegistry = useMaterialRegistry();
  const { state, selectCake, updateCake, sendCakeTo, putInOven, takeOutOfOven, discardCake, completeCake } = gameState;

  const job = station === "oven" ? null : getSelectedCake(state, station);
  const jobsHere = station === "oven" ? [] : getCakesAtStage(state, station);
  const rank = state.player.rank;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[var(--theme-background)]">
      <StationBackdrop station={station} />
      {/* 왼쪽 아래 구석: 버리기 + (케이크가 여러 개 와 있으면) 작업할 케이크 고르기 */}
      {job && (
        <div className="absolute bottom-2 left-[calc(0.5rem+var(--safe-l))] z-20 flex items-end gap-2">
          <DiscardButton orderLabel="작업 중인" onDiscard={() => discardCake(job.jobId)} />
          {(station === "cream" || station === "decorate") && jobsHere.length > 1 && (
            <div
              role="radiogroup"
              aria-label="작업할 케이크"
              className="flex items-end gap-1.5 rounded-2xl bg-white/60 p-1"
            >
              {jobsHere.map((other, index) => (
                <button
                  key={other.jobId}
                  type="button"
                  role="radio"
                  aria-checked={other.jobId === job.jobId}
                  aria-label={`대기 중인 케이크 ${index + 1}`}
                  onClick={() => selectCake(station, other.jobId)}
                  className={`rounded-xl border-0 bg-transparent p-0.5 transition-transform ${
                    other.jobId === job.jobId ? "-translate-y-1 bg-white shadow" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <CakeSnapshot cake={other.cake} materials={materialRegistry} size={36} label="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col pr-[var(--safe-r)] pl-[var(--safe-l)]">
        {station === "oven" && (
          <OvenStage
            queue={getOvenQueue(state)}
            slots={state.ovenSlots.map((id) => state.cakes.find((cake) => cake.jobId === id) ?? null)}
            materials={materialRegistry}
            onPutIn={putInOven}
            onTakeOut={takeOutOfOven}
            onDiscard={discardCake}
          />
        )}

        {/* 작업할 케이크가 없어도 작업대(선반, 빈 틀/케이크 받침, 도구)는 세팅된 채로 보여준다 */}
        {!job && station !== "oven" && <IdleStation station={station} rank={rank} />}

        {/* 작업할 케이크가 바뀌면 단계 컴포넌트의 로컬 상태(짜는 중인 크림, 데코 히스토리 등)가 섞이지 않도록
            key로 새로 마운트한다 */}
        {job && station === "base" && (
          <BaseSelectStage
            key={job.jobId}
            job={job}
            materials={materialRegistry}
            rank={rank}
            onSelectBase={(materialId) =>
              updateCake(job.jobId, (j) => ({ ...j, cake: { ...j.cake, base: materialId } }))
            }
            onSaveBatter={(amount) =>
              updateCake(job.jobId, (j) => ({
                ...j,
                cake: { ...j.cake, batter: { amount, score: scoreAmountMatch(amount, BATTER_TARGET) } },
              }))
            }
            onNext={() => sendCakeTo(job.jobId, "oven")}
          />
        )}

        {job && station === "cream" && (
          <CreamStation
            key={job.jobId}
            job={job}
            materials={materialRegistry}
            rank={rank}
            onUpdate={(updater) => updateCake(job.jobId, updater)}
          />
        )}

        {job && station === "decorate" && (
          <DecorateStation
            key={job.jobId}
            job={job}
            materials={materialRegistry}
            rank={rank}
            onUpdate={(updater) => updateCake(job.jobId, updater)}
            onComplete={() => completeCake(job.jobId)}
          />
        )}
      </div>
    </div>
  );
}
