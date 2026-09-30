import type { GameState, Station } from './gameState';
import { getBakingElapsedRatio, OVEN_IDEAL_START_RATIO } from './gameLogic';
import { STATIONS } from './station';

// 첫 플레이 튜토리얼: 첫 손님 한 명의 케이크를 처음부터 서빙까지 한 번 안내한다.
// 대본을 순서대로 넘기는 대신 지금 게임 상태에서 "다음에 할 일"을 계산한다 — 플레이어가 순서를 벗어나거나
// 여러 케이크를 동시에 만들어도 가장 앞서 있는 케이크를 기준으로 안내가 따라간다.
// 한 번에 한 가지 행동만, 짧게 말한다 (사용자 피드백: 설명이 길면 안 읽는다). 보충 설명은 hint에 한 줄로.
// GameState.tutorialDone이 false일 때만 보인다 (건너뛰기 또는 마지막 카드 확인으로 끝).

// 말풍선 위에 "STEP n/6 · 제목"으로 보여주는 큰 단계
export const TUTORIAL_PHASES = ['주문 받기', '반죽 붓기', '굽기', '필링·크림', '토핑·데코', '서빙'] as const;

export type TutorialStep = {
  id: string;
  phase: number; // TUTORIAL_PHASES 인덱스. 마지막 축하 카드는 TUTORIAL_PHASES.length
  text: string; // 할 일 한 줄
  hint?: string; // 작은 글씨 보충 한 줄
  station?: Station; // 이 스테이션에서 할 일. 다른 화면에 있으면 그 탭으로 가라고 안내한다
  // 밝게 남길 화면 요소들 (CSS 선택자). 나머지는 어둡게 깔린다. 첫 번째 요소에 손가락이 붙는다
  // (끌어다 놓는 단계는 출발점 + 도착점을 함께 밝힌다)
  targets?: string[];
  drag?: boolean; // 첫 대상에서 두 번째 대상으로 끌어다 놓는 단계 (손가락이 끄는 시늉을 한다)
  finish?: boolean; // 마지막 축하 카드
};

const stationTab = (station: Station) => `[data-station-tab="${station}"]`;
const shelf = (label: string) => `[role="radiogroup"][aria-label="${label}"]`;

export function getTutorialStep(state: GameState, now: number): TutorialStep | null {
  if (state.tutorialDone) return null;

  const step = pickStep(state, now);
  // 할 일이 다른 스테이션에 있으면 먼저 그 탭으로 보낸다
  if (step.station && step.station !== state.station) {
    const tab = STATIONS.find((item) => item.station === step.station);
    return {
      id: `go-${step.id}`,
      phase: step.phase,
      text: `${tab?.emoji ?? ''} ${tab?.label ?? ''} 탭으로 가요`,
      station: step.station,
      targets: [stationTab(step.station)],
    };
  }
  return step;
}

function pickStep(state: GameState, now: number): TutorialStep {
  if (state.today.served > 0 || state.player.exp > 0) {
    return { id: 'done', phase: TUTORIAL_PHASES.length, text: '', finish: true };
  }

  const tables = state.tables;
  const orderedCustomer = tables.find((customer) => customer?.status === 'order_confirmed');
  const stages = (stage: string) => state.cakes.filter((job) => job.stage === stage);

  // 6. 서빙
  if (stages('ready').length > 0 && orderedCustomer) {
    return {
      id: 'serve',
      phase: 5,
      text: '케이크를 손님에게 끌어다 줘요',
      station: 'order',
      drag: true,
      targets: ['[aria-label^="완성된 케이크"]', `[data-table-index="${orderedCustomer.tableIndex}"]`],
    };
  }

  // 5. 토핑·데코
  const decorating = stages('decorate')[0];
  if (decorating) {
    const { toppings, toppingsDone } = decorating.cake;
    if (toppingsDone) {
      return {
        id: 'decorate',
        phase: 4,
        text: '마음껏 꾸미고 완성!',
        hint: '그림·글자는 자유예요 (안 해도 돼요)',
        station: 'decorate',
        targets: ['[data-tutorial="step-next"]', '[data-tutorial="complete"]'],
      };
    }
    return toppings.length === 0
      ? {
          id: 'topping',
          phase: 4,
          text: '토핑을 골라 케이크를 톡톡',
          hint: '주문서에 적힌 토핑이에요',
          station: 'decorate',
          targets: [shelf('토핑 재료')],
        }
      : {
          id: 'topping-done',
          phase: 4,
          text: '다 올렸으면 "토핑 완료"',
          hint: `지금 ${toppings.length}개 올렸어요`,
          station: 'decorate',
          targets: ['[data-tutorial="topping-done"]'],
        };
  }

  // 4. 필링·크림
  const creaming = stages('cream')[0];
  if (creaming) {
    const { filling, frosting } = creaming.cake;
    const layer = filling.done ? frosting : filling;
    const noun = filling.done ? '크림' : '필링';
    const spread = layer.cells.some((value) => value > 0);
    if (!layer.materialId) {
      return {
        id: `pick-${noun}`,
        phase: 3,
        text: `${noun}을 골라요`,
        station: 'cream',
        // 필링을 끝낸 직후엔 "크림 바르기 →"를 먼저 눌러야 크림 선반이 나온다
        targets: filling.done ? ['[data-tutorial="step-next"]', shelf('크림 재료')] : [shelf('필링 재료')],
      };
    }
    if (!spread) {
      return {
        id: `spread-${noun}`,
        phase: 3,
        text: '케이크를 누른 채 문질러요',
        hint: filling.done ? '옆면은 누르고 있으면 돌아가요' : '단면을 빈 곳 없이 덮어요',
        station: 'cream',
        targets: ['[data-tutorial="spread-area"]', '[data-tutorial="gauge"]'],
      };
    }
    return {
      id: `spread-done-${noun}`,
      phase: 3,
      text: `초록 칸까지 바르고 "${noun} 완료"`,
      hint: filling.done ? '크림 양은 주문서(조금/보통/듬뿍)대로' : undefined,
      station: 'cream',
      targets: ['[data-tutorial="spread-done"]', '[data-tutorial="gauge"]'],
    };
  }

  // 3. 굽기
  const inOven = stages('oven').filter((job) => job.cake.baking.startTime !== null);
  if (inOven.length > 0) {
    const ready = inOven.some(
      (job) =>
        getBakingElapsedRatio(job.cake.baking.startTime ?? now, job.cake.baking.duration, now) >= OVEN_IDEAL_START_RATIO,
    );
    return ready
      ? {
          id: 'take-out',
          phase: 2,
          text: '지금 꺼내요!',
          hint: '늦으면 타요',
          station: 'oven',
          targets: ['[data-take-out]:not(:disabled)'],
        }
      : {
          id: 'baking',
          phase: 2,
          text: '굽는 중… 조금만 기다려요',
          hint: '초록 칸에 오면 꺼내요',
          station: 'oven',
        };
  }
  if (stages('oven').length > 0) {
    return {
      id: 'put-in',
      phase: 2,
      text: '틀을 오븐에 끌어다 넣어요',
      station: 'oven',
      drag: true,
      targets: ['[aria-label^="반죽 틀."]', '[data-oven-slot]'],
    };
  }

  // 2. 반죽 붓기
  if (orderedCustomer) {
    const tin = stages('base')[0];
    if (!tin?.cake.base) {
      return {
        id: 'pick-base',
        phase: 1,
        text: '주문한 시트를 골라요',
        hint: '오른쪽 위 주문서를 누르면 주문이 보여요',
        station: 'base',
        targets: [shelf('시트 반죽'), '[aria-label$=" 주문서"]'],
      };
    }
    if (tin.cake.batter.amount === 0) {
      return {
        id: 'pour',
        phase: 1,
        text: '틀을 꾹 누르고 있어요',
        hint: '게이지 초록 칸에서 손을 떼요',
        station: 'base',
        targets: ['[aria-label="누르고 있으면 반죽이 부어져요"]', '[data-tutorial="gauge"]'],
      };
    }
    return {
      id: 'to-oven',
      phase: 1,
      text: '"오븐으로" 보내요',
      hint: '다시 붓고 싶으면 🧽',
      station: 'base',
      targets: ['[data-tutorial="to-oven"]'],
    };
  }

  // 1. 주문 받기
  if (tables.some((customer) => customer?.status === 'ordering')) {
    return { id: 'listening', phase: 0, text: '주문을 잘 들어 봐요', station: 'order' };
  }
  return {
    id: 'take-order',
    phase: 0,
    text: '손님을 눌러 주문을 받아요',
    station: 'order',
    targets: ['[aria-label="손님 주문 확인"]'],
  };
}
