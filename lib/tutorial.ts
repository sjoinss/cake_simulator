import type { GameState, Station } from './gameState';
import { getBakingElapsedRatio, OVEN_IDEAL_START_RATIO } from './gameLogic';
import { STATIONS } from './station';

// 첫 플레이 튜토리얼: 첫 손님 한 명의 케이크를 처음부터 서빙까지 한 번 안내한다.
// 대본을 순서대로 넘기는 대신 지금 게임 상태에서 "다음에 할 일"을 계산한다 — 플레이어가 순서를 벗어나거나
// 여러 케이크를 동시에 만들어도 가장 앞서 있는 케이크를 기준으로 안내가 따라간다.
// GameState.tutorialDone이 false일 때만 보인다 (건너뛰기 또는 마지막 안내 확인으로 끝).

export type TutorialStep = {
  id: string;
  text: string;
  station?: Station; // 이 스테이션에서 할 일. 다른 화면에 있으면 그 탭으로 가라고 안내하고 탭을 깜빡인다
  finish?: boolean; // 마지막 안내 (확인 버튼으로 끝냄)
};

const stationLabel = (station: Station) => STATIONS.find((item) => item.station === station)?.label ?? '';

export function getTutorialStep(state: GameState, now: number): TutorialStep | null {
  if (state.tutorialDone) return null;

  const step = pickStep(state, now);
  // 할 일이 다른 스테이션에 있으면 먼저 그 탭으로 보낸다
  if (step.station && step.station !== state.station) {
    const emoji = STATIONS.find((item) => item.station === step.station)?.emoji ?? '';
    return { id: `go-${step.id}`, text: `아래 ${emoji} ${stationLabel(step.station)} 탭으로 가요`, station: step.station };
  }
  return step;
}

function pickStep(state: GameState, now: number): TutorialStep {
  if (state.today.served > 0 || state.player.exp > 0) {
    return {
      id: 'done',
      text: '첫 케이크 완성! 점수만큼 돈과 경험치를 받아요. 랭크가 오르면 🛒 상점에 새 재료가 들어와요. 손님 10명을 받으면 하루가 끝나요.',
      finish: true,
    };
  }

  const tables = state.tables;
  const hasOrder = tables.some((customer) => customer?.status === 'order_confirmed');
  const stages = (stage: string) => state.cakes.filter((job) => job.stage === stage);

  if (stages('ready').length > 0 && hasOrder) {
    return { id: 'serve', text: '계산대의 케이크를 주문한 손님 테이블로 끌어다 줘요', station: 'order' };
  }
  if (stages('decorate').length > 0) {
    return {
      id: 'decorate',
      text: '토핑을 골라 케이크 윗면을 톡톡 눌러 올리고 "토핑 완료". 데코는 자유롭게 그리고 "완성 🎉"',
      station: 'decorate',
    };
  }
  if (stages('cream').length > 0) {
    return {
      id: 'cream',
      text: '필링을 골라 단면을 문질러 바르고, 크림은 윗면과 옆면을 발라요. 주문서의 크림 양(조금/보통/듬뿍) 눈금에 맞춰요',
      station: 'cream',
    };
  }

  const inOven = stages('oven').filter((job) => job.cake.baking.startTime !== null);
  if (inOven.length > 0) {
    const ready = inOven.some(
      (job) =>
        getBakingElapsedRatio(job.cake.baking.startTime ?? now, job.cake.baking.duration, now) >= OVEN_IDEAL_START_RATIO,
    );
    return ready
      ? { id: 'take-out', text: '다 구워졌어요! "꺼내기"를 눌러요 (늦으면 타요)', station: 'oven' }
      : {
          id: 'baking',
          text: '굽는 중이에요. 막대가 초록 칸에 오면 꺼내요. 다른 화면에 가도 오븐 탭이 초록으로 깜빡여 알려줘요',
          station: 'oven',
        };
  }
  if (stages('oven').length > 0) {
    return { id: 'put-in', text: '반죽 틀을 위쪽 빈 오븐 칸으로 끌어다 넣어요', station: 'oven' };
  }

  if (hasOrder) {
    return {
      id: 'batter',
      text: '오른쪽 위 주문서(#1)를 눌러 주문을 보고, 같은 시트를 골라요. 틀을 꾹 누르면 반죽이 차요. 초록 칸에서 떼고 "오븐으로"',
      station: 'base',
    };
  }
  if (tables.some((customer) => customer?.status === 'ordering')) {
    return { id: 'listening', text: '손님이 주문하고 있어요. 잘 들어봐요!', station: 'order' };
  }
  return { id: 'take-order', text: '케이크 가게에 오신 걸 환영해요! 손님을 눌러 주문을 받아요', station: 'order' };
}
