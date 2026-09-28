"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createInitialGameState,
  TABLE_COUNT,
  type ActiveOrder,
  type CraftingStage,
  type GameState,
  type Station,
  type WorkStation,
} from "@/lib/gameState";
import { createCustomer } from "@/lib/customer";
import { createEmptySpreadLayer } from "@/lib/frosting";
import {
  getBakingElapsedRatio,
  OVEN_DURATION_MS,
  scoreBaking,
  scoreServedCake,
  type ServeResult,
} from "@/lib/gameLogic";
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

// 결과 카드에 보여줄 정보. 손님은 곧 퇴장하고 주문도 정리되므로 이름/케이크를 여기에 복사해둔다.
export type ServeResultCard = ServeResult & { customerName: string; cake: ActiveOrder["cake"] };

// 주문이 확정되는 순간 만들어지는 빈 케이크. createdAt(속도 점수 기준)도 이때부터 잰다 — Papa's처럼 손님이 기다린 시간.
function createOrder(customerId: string, orderNumber: number): ActiveOrder {
  return {
    orderId: `order_${Date.now()}_${customerId}`,
    customerId,
    stage: "base",
    orderNumber,
    attempt: 0,
    createdAt: Date.now(),
    completedAt: null,
    cake: createEmptyCake(),
  };
}

function createEmptyCake(): ActiveOrder["cake"] {
  return {
    base: null,
    batter: { amount: 0, score: 0 },
    baking: { startTime: null, endTime: null, duration: OVEN_DURATION_MS, doneness: 0 },
    filling: createEmptySpreadLayer(),
    frosting: createEmptySpreadLayer(true),
    toppingsDone: false,
    toppings: [],
    decorations: [],
    text: [],
    drawings: [],
  };
}

export function useGameState() {
  const [state, setState] = useState<GameState>(createInitialGameState);
  const [orderingCustomerId, setOrderingCustomerId] = useState<string | null>(null);
  const [orderingStepIndex, setOrderingStepIndex] = useState(0);
  // 방금 배정되어 슬라이드업 애니메이션을 재생해야 하는 손님 id들. 매장 화면이 (제작 화면 왕복 등으로)
  // 다시 마운트돼도 이미 있던 손님까지 매번 애니메이션이 재생되지 않도록, DOM 마운트가 아니라 이 상태로 판단한다.
  const [justArrivedIds, setJustArrivedIds] = useState<ReadonlySet<string>>(() => new Set());
  // 서빙 완료 후 먹는 중인 손님의 케이크(테이블 위에 표시). 주문은 activeOrders에서 정리되므로 따로 보관한다.
  const [servedCakes, setServedCakes] = useState<Readonly<Record<string, ActiveOrder["cake"]>>>({});
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

  // 빈 테이블에 새 손님을 배정한다. 배정 순간 종소리 + 슬라이드업 등장 애니메이션이 트리거된다.
  const assignCustomer = useCallback(
    (tableIndex: number) => {
      playBellSound();
      const newCustomer = createCustomer(tableIndex);
      setState((prev) => {
        if (prev.tables[tableIndex]) return prev; // 이미 배정된 테이블이면 무시
        const tables = [...prev.tables];
        tables[tableIndex] = newCustomer;
        return { ...prev, tables };
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
    [schedule]
  );

  // 마운트 시 (모두 빈 상태인) 테이블에 순서대로 손님을 배정한다.
  useEffect(() => {
    Array.from({ length: TABLE_COUNT }, (_, tableIndex) => tableIndex).forEach((tableIndex, order) => {
      schedule(() => assignCustomer(tableIndex), FIRST_CUSTOMER_DELAY_MS + order * NEXT_CUSTOMER_GAP_MS);
    });
    // 최초 마운트 시 한 번만 실행 (빈 테이블 목록은 마운트 시점 기준 고정)
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
        // 주문이 확정되면 주문서가 바로 시트 스테이션에 올라간다 (Papa's의 티켓 레일).
        setState((current) => {
          const target = current.tables[tableIndex];
          if (target?.id !== customer.id || target.status !== "ordering") return current;
          const tables = [...current.tables];
          tables[tableIndex] = { ...target, status: "order_confirmed", orderNumber: current.nextOrderNumber };
          return {
            ...current,
            tables,
            activeOrders: [...current.activeOrders, createOrder(target.id, current.nextOrderNumber)],
            nextOrderNumber: current.nextOrderNumber + 1,
          };
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
    [orderingCustomerId, state.tables, schedule]
  );

  // 하단 스테이션 탭: 어느 스테이션이든 언제든 이동할 수 있다. 케이크 진행 상태는 주문(activeOrders)에 남아 있다.
  const setStation = useCallback((station: Station) => {
    setState((prev) => (prev.station === station ? prev : { ...prev, station }));
  }, []);

  // 스테이션 상단 티켓 레일에서 작업할 주문을 고른다.
  const selectOrder = useCallback((station: WorkStation, orderId: string) => {
    setState((prev) => ({ ...prev, selectedOrderIds: { ...prev.selectedOrderIds, [station]: orderId } }));
  }, []);

  // 각 스테이션에서 케이크 데이터를 갱신할 때 쓰는 범용 업데이터. 필요한 필드만 골라 바꾸도록 updater 함수를 넘겨받는다.
  const updateOrder = useCallback((orderId: string, updater: (order: ActiveOrder) => ActiveOrder) => {
    setState((prev) => ({
      ...prev,
      activeOrders: prev.activeOrders.map((order) => (order.orderId === orderId ? updater(order) : order)),
    }));
  }, []);

  // 케이크를 다음 스테이션 대기열로 보낸다. 되돌아가는 이동은 없다 (1장 2번).
  const sendOrderTo = useCallback(
    (orderId: string, stage: CraftingStage) => {
      updateOrder(orderId, (order) => ({ ...order, stage }));
    },
    [updateOrder]
  );

  // 오븐 대기 중인 케이크를 빈 오븐 칸에 넣는다. 타이머는 절대 시각이라 다른 스테이션에 가 있어도 계속 흐른다.
  const putInOven = useCallback((orderId: string) => {
    setState((prev) => {
      const slotIndex = prev.ovenSlots.indexOf(null);
      const order = prev.activeOrders.find((o) => o.orderId === orderId);
      if (slotIndex < 0 || !order || order.stage !== "oven" || order.cake.baking.startTime !== null) return prev;
      const ovenSlots = [...prev.ovenSlots];
      ovenSlots[slotIndex] = orderId;
      return {
        ...prev,
        ovenSlots,
        activeOrders: prev.activeOrders.map((o) =>
          o.orderId === orderId
            ? {
                ...o,
                cake: {
                  ...o.cake,
                  baking: { startTime: Date.now(), endTime: null, duration: OVEN_DURATION_MS, doneness: 0 },
                },
              }
            : o
        ),
      };
    });
  }, []);

  // 오븐에서 꺼내면 그 순간의 경과 비율로 굽기 점수를 매기고, 필링·크림 스테이션 대기열로 넘긴다.
  const takeOutOfOven = useCallback((slotIndex: number) => {
    setState((prev) => {
      const orderId = prev.ovenSlots[slotIndex];
      if (!orderId) return prev;
      const ovenSlots = [...prev.ovenSlots];
      ovenSlots[slotIndex] = null;
      const now = Date.now();
      return {
        ...prev,
        ovenSlots,
        activeOrders: prev.activeOrders.map((o) => {
          if (o.orderId !== orderId || o.cake.baking.startTime === null) return o;
          const ratio = getBakingElapsedRatio(o.cake.baking.startTime, o.cake.baking.duration, now);
          return {
            ...o,
            stage: "cream",
            cake: { ...o.cake, baking: { ...o.cake.baking, endTime: now, doneness: scoreBaking(ratio) } },
          };
        }),
      };
    });
  }, []);

  // 타거나 실수한 케이크를 버리고 처음(시트)부터 다시 만든다. 주문 번호와 주문 시각(속도 점수)은 그대로다.
  const discardOrder = useCallback((orderId: string) => {
    setState((prev) => ({
      ...prev,
      ovenSlots: prev.ovenSlots.map((id) => (id === orderId ? null : id)),
      activeOrders: prev.activeOrders.map((order) =>
        order.orderId === orderId
          ? { ...order, stage: "base", attempt: order.attempt + 1, completedAt: null, cake: createEmptyCake() }
          : order
      ),
    }));
  }, []);

  // 데코레이션 "완성": 주문을 ready로 바꾸고 매장으로 이동한다. 케이크는 계산대 위에 표시된다.
  const completeOrder = useCallback((orderId: string) => {
    setState((prev) => ({
      ...prev,
      station: "order",
      activeOrders: prev.activeOrders.map((order) =>
        order.orderId === orderId ? { ...order, stage: "ready", completedAt: Date.now() } : order
      ),
    }));
  }, []);

  // 계산대의 완성 케이크를 주문한 손님 테이블에 드롭했을 때 호출. 드롭 대상이 맞는지는 호출하는 쪽(ShopScreen)이
  // 판단하지만, 여기서도 한 번 더 확인해서 엉뚱한 서빙은 무시한다 (cake-tycoon-prompt.md 3장 "서빙").
  // 채점 → 돈 지급 → 결과 카드 → 먹는 연출 → 퇴장 → 테이블 비움 → 다음 손님 순서로 진행한다.
  const serveOrder = useCallback(
    (orderId: string) => {
      const order = state.activeOrders.find((activeOrder) => activeOrder.orderId === orderId);
      if (!order || order.stage !== "ready") return;
      const tableIndex = state.tables.findIndex((table) => table?.id === order.customerId);
      const customer = state.tables[tableIndex];
      if (!customer || customer.status !== "order_confirmed") return;

      const result = scoreServedCake(order.cake, customer.order, order.createdAt, order.completedAt);

      setState((prev) => {
        const tables = [...prev.tables];
        const target = tables[tableIndex];
        if (target?.id === customer.id) tables[tableIndex] = { ...target, status: "served" };
        return {
          ...prev,
          tables,
          activeOrders: prev.activeOrders.filter((activeOrder) => activeOrder.orderId !== orderId),
          player: {
            ...prev.player,
            money: prev.player.money + result.money,
            tipTotal: prev.player.tipTotal + result.tip,
          },
        };
      });
      setServedCakes((prev) => ({ ...prev, [customer.id]: order.cake }));
      setServeResult({ ...result, customerName: customer.name, cake: order.cake });

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
    [state.activeOrders, state.tables, schedule, assignCustomer]
  );

  const dismissServeResult = useCallback(() => setServeResult(null), []);

  return {
    state,
    orderingCustomerId,
    orderingStepIndex,
    justArrivedIds,
    servedCakes,
    leavingIds,
    serveResult,
    handleCustomerTap,
    setStation,
    selectOrder,
    updateOrder,
    sendOrderTo,
    putInOven,
    takeOutOfOven,
    discardOrder,
    completeOrder,
    serveOrder,
    dismissServeResult,
  };
}
