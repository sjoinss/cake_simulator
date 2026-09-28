"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createDayProgress,
  createInitialGameState,
  CUSTOMERS_PER_DAY,
  TABLE_COUNT,
  type CakeData,
  type CakeJob,
  type CraftingStage,
  type GameState,
  type Station,
  type WorkStation,
} from "@/lib/gameState";
import { createCustomer } from "@/lib/customer";
import { withBaseCake } from "@/lib/cake";
import { getBakingElapsedRatio, OVEN_DURATION_MS, scoreBaking } from "@/lib/gameLogic";
import { scoreServedCake, type ServeResult } from "@/lib/scoring";
import { initialMaterials } from "@/lib/materials";
import { getOrderSteps } from "@/lib/order";
import { playBellSound } from "@/lib/sound";

// cake-tycoon-prompt.md 3장 "손님 등장 애니메이션 및 주문 흐름" 기준.
// ShopScreen의 로컬 useState만으로는 손님 배정/주문 진행 타이머를 감당하기 어려워 이 훅으로 분리했다.
const ORDER_STEP_DURATION_MS = 900;
const FIRST_CUSTOMER_DELAY_MS = 500;
const NEXT_CUSTOMER_GAP_MS = 1000;
const ENTER_ANIMATION_MS = 600;
// ⑤ 서빙 후: 손님이 테이블 위 케이크를 잠시 "먹는" 연출 → 퇴장 애니메이션 → 테이블 비움 → 다음 손님 등장
const EATING_DURATION_MS = 3000;
const LEAVE_ANIMATION_MS = 450;

// 결과 카드에 보여줄 정보. 손님은 곧 퇴장하고 케이크도 정리되므로 이름/케이크를 여기에 복사해둔다.
export type ServeResultCard = ServeResult & { customerName: string; cake: CakeData };

// 케이크 한 개를 바꾸는 헬퍼
const mapCake = (state: GameState, jobId: string, updater: (job: CakeJob) => CakeJob): GameState => ({
  ...state,
  cakes: state.cakes.map((job) => (job.jobId === jobId ? updater(job) : job)),
});

// 케이크는 주문과 묶여 있지 않다: 시트 스테이션에는 항상 빈 틀이 놓여 있어 주문 없이도 미리 만들 수 있고,
// 완성된 케이크는 어느 손님에게든 서빙할 수 있다 (받은 손님 주문 기준으로 채점). 줄 사람이 없으면 버려야 한다.
export function useGameState() {
  const [state, setState] = useState<GameState>(() => withBaseCake(createInitialGameState()));
  const [orderingCustomerId, setOrderingCustomerId] = useState<string | null>(null);
  const [orderingStepIndex, setOrderingStepIndex] = useState(0);
  // 방금 배정되어 슬라이드업 애니메이션을 재생해야 하는 손님 id들. 매장 화면이 (제작 화면 왕복 등으로)
  // 다시 마운트돼도 이미 있던 손님까지 매번 애니메이션이 재생되지 않도록, DOM 마운트가 아니라 이 상태로 판단한다.
  const [justArrivedIds, setJustArrivedIds] = useState<ReadonlySet<string>>(() => new Set());
  // 서빙 완료 후 먹는 중인 손님의 케이크(테이블 위에 표시). 케이크는 주방 목록에서 빠지므로 따로 보관한다.
  const [servedCakes, setServedCakes] = useState<Readonly<Record<string, CakeData>>>({});
  const [leavingIds, setLeavingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [serveResult, setServeResult] = useState<ServeResultCard | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = useCallback((callback: () => void, delay: number) => {
    timers.current.push(setTimeout(callback, delay));
  }, []);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
    };
  }, []);

  // 예약된 타이머(손님 배정 등)에서 최신 상태를 읽기 위한 거울
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 빈 테이블에 새 손님을 배정한다. 배정 순간 종소리 + 슬라이드업 등장 애니메이션이 트리거된다.
  // 오늘 손님(CUSTOMERS_PER_DAY명)을 다 받았으면 더 오지 않는다.
  const assignCustomer = useCallback(
    (tableIndex: number) => {
      const current = stateRef.current;
      if (current.tables[tableIndex] || current.today.customers >= CUSTOMERS_PER_DAY) return;
      playBellSound();
      const newCustomer = createCustomer(tableIndex);
      setState((prev) => {
        if (prev.tables[tableIndex] || prev.today.customers >= CUSTOMERS_PER_DAY) return prev;
        const tables = [...prev.tables];
        tables[tableIndex] = newCustomer;
        return { ...prev, tables, today: { ...prev.today, customers: prev.today.customers + 1 } };
      });
      setJustArrivedIds((prev) => new Set(prev).add(newCustomer.id));
      schedule(() => {
        setJustArrivedIds((prev) => {
          if (!prev.has(newCustomer.id)) return prev;
          const next = new Set(prev);
          next.delete(newCustomer.id);
          return next;
        });
      }, ENTER_ANIMATION_MS);
    },
    [schedule],
  );

  // 가게 문을 열 때(첫 마운트, 다음 날 시작) 빈 테이블에 순서대로 손님을 배정한다.
  const seatOpeningCustomers = useCallback(() => {
    Array.from({ length: TABLE_COUNT }, (_, tableIndex) => tableIndex).forEach((tableIndex, order) => {
      schedule(() => assignCustomer(tableIndex), FIRST_CUSTOMER_DELAY_MS + order * NEXT_CUSTOMER_GAP_MS);
    });
  }, [schedule, assignCustomer]);

  useEffect(() => {
    seatOpeningCustomers();
    // 최초 마운트 시 한 번만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 손님을 탭했을 때: waiting → 순차 주문 진행 → order_confirmed.
  // 이미 확정된 손님을 다시 탭하면 주문 내용을 다시 순차 재생해서 보여준다(상태는 그대로 유지).
  // ⚠️ 타이머 등록 같은 부수 효과는 setState 업데이터 밖에서 한다. 업데이터 안에서 하면 개발 모드(StrictMode)가
  // 업데이터를 두 번 실행하면서 확정 타이머도 두 번 걸려, 같은 손님 주문이 두 개씩 생기는 버그가 있었다.
  const handleCustomerTap = useCallback(
    (tableIndex: number) => {
      if (orderingCustomerId) return; // 다른 손님 주문이 진행 중이면 겹치지 않게 무시

      const customer = state.tables[tableIndex];
      if (!customer || (customer.status !== "waiting" && customer.status !== "order_confirmed")) return;
      const steps = getOrderSteps(customer.order, initialMaterials);
      if (steps.length === 0) return;
      const isInitial = customer.status === "waiting";

      setOrderingCustomerId(customer.id);
      setOrderingStepIndex(0);
      steps.forEach((_, index) => {
        if (index > 0) schedule(() => setOrderingStepIndex(index), index * ORDER_STEP_DURATION_MS);
      });

      schedule(() => {
        setOrderingCustomerId(null);
        if (!isInitial) return; // 재생(replay)은 상태를 바꾸지 않는다
        // 주문이 확정되면 번호를 붙이고 주문서가 레일에 걸린다. 속도 점수는 이때부터 잰다 (손님이 기다린 시간).
        setState((current) => {
          const target = current.tables[tableIndex];
          if (target?.id !== customer.id || target.status !== "ordering") return current;
          const tables = [...current.tables];
          tables[tableIndex] = {
            ...target,
            status: "order_confirmed",
            orderNumber: current.nextOrderNumber,
            orderedAt: Date.now(),
          };
          return { ...current, tables, nextOrderNumber: current.nextOrderNumber + 1 };
        });
      }, steps.length * ORDER_STEP_DURATION_MS);

      if (!isInitial) return;
      setState((prev) => {
        const target = prev.tables[tableIndex];
        if (target?.id !== customer.id || target.status !== "waiting") return prev;
        const tables = [...prev.tables];
        tables[tableIndex] = { ...target, status: "ordering" };
        return { ...prev, tables };
      });
    },
    [orderingCustomerId, state.tables, schedule],
  );

  // 하단 스테이션 탭: 어느 스테이션이든 언제든 이동할 수 있다. 케이크 진행 상태는 cakes에 남아 있다.
  const setStation = useCallback((station: Station) => {
    setState((prev) => (prev.station === station ? prev : { ...prev, station }));
  }, []);

  // 한 스테이션에 케이크가 여러 개 와 있을 때 작업할 케이크를 고른다.
  const selectCake = useCallback((station: WorkStation, jobId: string) => {
    setState((prev) => ({ ...prev, selectedCakeIds: { ...prev.selectedCakeIds, [station]: jobId } }));
  }, []);

  // 각 스테이션에서 케이크 데이터를 갱신할 때 쓰는 범용 업데이터. 필요한 필드만 골라 바꾸도록 updater 함수를 넘겨받는다.
  const updateCake = useCallback((jobId: string, updater: (job: CakeJob) => CakeJob) => {
    setState((prev) => mapCake(prev, jobId, updater));
  }, []);

  // 케이크를 다음 스테이션 대기열로 보낸다. 되돌아가는 이동은 없다 (1장 2번).
  // 시트 스테이션에서 떠나면 그 자리에 새 빈 틀이 놓인다 (주방 케이크 수 상한까지).
  const sendCakeTo = useCallback((jobId: string, stage: CraftingStage) => {
    setState((prev) => withBaseCake(mapCake(prev, jobId, (job) => ({ ...job, stage }))));
  }, []);

  // 오븐 대기 중인 케이크를 빈 오븐 칸에 넣는다. 타이머는 절대 시각이라 다른 스테이션에 가 있어도 계속 흐른다.
  // slot을 주면(끌어다 놓은 칸) 그 칸이 비어 있을 때만 넣고, 안 주면(키보드 조작) 첫 빈 칸에 넣는다.
  const putInOven = useCallback((jobId: string, slot?: number) => {
    setState((prev) => {
      const slotIndex = slot === undefined ? prev.ovenSlots.indexOf(null) : prev.ovenSlots[slot] === null ? slot : -1;
      const job = prev.cakes.find((cake) => cake.jobId === jobId);
      if (slotIndex < 0 || !job || job.stage !== "oven" || job.cake.baking.startTime !== null) return prev;
      const ovenSlots = [...prev.ovenSlots];
      ovenSlots[slotIndex] = jobId;
      return mapCake({ ...prev, ovenSlots }, jobId, (j) => ({
        ...j,
        cake: { ...j.cake, baking: { startTime: Date.now(), endTime: null, duration: OVEN_DURATION_MS, doneness: 0 } },
      }));
    });
  }, []);

  // 오븐에서 꺼내면 그 순간의 경과 비율로 굽기 점수를 매기고, 필링·크림 스테이션 대기열로 넘긴다.
  const takeOutOfOven = useCallback((slotIndex: number) => {
    setState((prev) => {
      const jobId = prev.ovenSlots[slotIndex];
      if (!jobId) return prev;
      const ovenSlots = [...prev.ovenSlots];
      ovenSlots[slotIndex] = null;
      const now = Date.now();
      return mapCake({ ...prev, ovenSlots }, jobId, (job) => {
        if (job.cake.baking.startTime === null) return job;
        const ratio = getBakingElapsedRatio(job.cake.baking.startTime, job.cake.baking.duration, now);
        return {
          ...job,
          stage: "cream",
          cake: { ...job.cake, baking: { ...job.cake.baking, endTime: now, doneness: scoreBaking(ratio) } },
        };
      });
    });
  }, []);

  // 타거나 실수했거나, 줄 손님이 없는 케이크를 버린다. 시트 스테이션에서 버리면 새 빈 틀이 다시 놓인다.
  const discardCake = useCallback((jobId: string) => {
    setState((prev) =>
      withBaseCake({
        ...prev,
        ovenSlots: prev.ovenSlots.map((id) => (id === jobId ? null : id)),
        cakes: prev.cakes.filter((job) => job.jobId !== jobId),
      }),
    );
  }, []);

  // 데코레이션 "완성": 케이크를 ready로 바꾸고 매장으로 이동한다. 케이크는 계산대 위에 표시된다.
  const completeCake = useCallback((jobId: string) => {
    setState((prev) => ({
      ...mapCake(prev, jobId, (job) => ({ ...job, stage: "ready", completedAt: Date.now() })),
      station: "order",
    }));
  }, []);

  // 계산대의 완성 케이크를 손님 테이블에 드롭했을 때 호출. 주문을 받은 손님이면 누구에게든 줄 수 있고,
  // 그 손님의 주문 기준으로 채점한다 (cake-tycoon-prompt.md 3장 "서빙", 12장).
  // 채점 → 돈 지급 → 결과 카드 → 먹는 연출 → 퇴장 → 테이블 비움 → 다음 손님 순서로 진행한다.
  const serveCake = useCallback(
    (jobId: string, tableIndex: number) => {
      const job = state.cakes.find((cake) => cake.jobId === jobId);
      if (!job || job.stage !== "ready") return;
      const customer = state.tables[tableIndex];
      if (!customer || customer.status !== "order_confirmed") return;

      const servedAt = Date.now();
      const result = scoreServedCake(job.cake, customer.order, customer.orderedAt ?? servedAt, servedAt);

      setState((prev) => {
        const tables = [...prev.tables];
        const target = tables[tableIndex];
        if (target?.id === customer.id) tables[tableIndex] = { ...target, status: "served" };
        return {
          ...prev,
          tables,
          cakes: prev.cakes.filter((cake) => cake.jobId !== jobId),
          player: {
            ...prev.player,
            money: prev.player.money + result.money,
            tipTotal: prev.player.tipTotal + result.tip,
          },
          today: {
            ...prev.today,
            served: prev.today.served + 1,
            money: prev.today.money + result.money,
            scoreTotal: prev.today.scoreTotal + result.total,
          },
        };
      });
      setServedCakes((prev) => ({ ...prev, [customer.id]: job.cake }));
      setServeResult({ ...result, customerName: customer.name, cake: job.cake });

      schedule(() => {
        setLeavingIds((prev) => new Set(prev).add(customer.id));
        schedule(() => {
          setState((prev) => {
            if (prev.tables[tableIndex]?.id !== customer.id) return prev;
            const tables = [...prev.tables];
            tables[tableIndex] = null;
            return { ...prev, tables };
          });
          setLeavingIds((prev) => {
            const next = new Set(prev);
            next.delete(customer.id);
            return next;
          });
          setServedCakes((prev) => {
            const next = { ...prev };
            delete next[customer.id];
            return next;
          });
          schedule(() => assignCustomer(tableIndex), NEXT_CUSTOMER_GAP_MS);
        }, LEAVE_ANIMATION_MS);
      }, EATING_DURATION_MS);
    },
    [state.cakes, state.tables, schedule, assignCustomer],
  );

  const dismissServeResult = useCallback(() => setServeResult(null), []);

  // 오늘 손님을 다 서빙했고 마지막 손님까지 나가서 테이블이 모두 비었으면 하루가 끝난 것 (결산 카드)
  const isDayOver = state.today.served >= CUSTOMERS_PER_DAY && state.tables.every((table) => table === null);

  // 다음 날 시작: 날짜 +1, 오늘 기록·주문 번호 초기화. 가게 문을 닫으면서 주방에 남은 케이크는 정리하고,
  // 시트 스테이션에 새 틀을 놓은 뒤 손님을 다시 받는다.
  const startNextDay = useCallback(() => {
    setState((prev) =>
      withBaseCake({
        ...prev,
        player: { ...prev.player, day: prev.player.day + 1 },
        today: createDayProgress(),
        nextOrderNumber: 1,
        cakes: [],
        ovenSlots: prev.ovenSlots.map(() => null),
        selectedCakeIds: { base: null, cream: null, decorate: null },
        station: "order",
      })
    );
    setServeResult(null);
    // 손님 배정은 0.5초 뒤부터라 그 사이 stateRef가 새 날 상태로 바뀐다
    seatOpeningCustomers();
  }, [seatOpeningCustomers]);

  return {
    state,
    isDayOver,
    startNextDay,
    orderingCustomerId,
    orderingStepIndex,
    justArrivedIds,
    servedCakes,
    leavingIds,
    serveResult,
    handleCustomerTap,
    setStation,
    selectCake,
    updateCake,
    sendCakeTo,
    putInOven,
    takeOutOfOven,
    discardCake,
    completeCake,
    serveCake,
    dismissServeResult,
  };
}
