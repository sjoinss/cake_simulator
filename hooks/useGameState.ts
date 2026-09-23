"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createInitialGameState,
  TABLE_COUNT,
  type ActiveOrder,
  type CraftingStage,
  type GameState,
} from "@/lib/gameState";
import { createCustomer } from "@/lib/customer";
import { scoreServedCake, type ServeResult } from "@/lib/gameLogic";
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
  const handleCustomerTap = useCallback(
    (tableIndex: number) => {
      if (orderingCustomerId) return; // 다른 손님 주문이 진행 중이면 겹치지 않게 무시

      setState((prev) => {
        const customer = prev.tables[tableIndex];
        if (!customer) return prev;
        if (customer.status !== "waiting" && customer.status !== "order_confirmed") return prev;

        const steps = getOrderSteps(customer.order, initialMaterials);
        if (steps.length === 0) return prev;

        const isInitial = customer.status === "waiting";

        setOrderingCustomerId(customer.id);
        setOrderingStepIndex(0);

        steps.forEach((_, index) => {
          if (index === 0) return;
          const timer = setTimeout(() => setOrderingStepIndex(index), index * ORDER_STEP_DURATION_MS);
          timers.current.push(timer);
        });

        const finishTimer = setTimeout(() => {
          setOrderingCustomerId(null);
          if (isInitial) {
            setState((current) => {
              const tables = [...current.tables];
              const target = tables[tableIndex];
              if (!target) return current;
              tables[tableIndex] = { ...target, status: "order_confirmed" };
              return { ...current, tables };
            });
          }
        }, steps.length * ORDER_STEP_DURATION_MS);
        timers.current.push(finishTimer);

        if (!isInitial) return prev; // 재생(replay)은 상태를 바꾸지 않는다

        const tables = [...prev.tables];
        tables[tableIndex] = { ...customer, status: "ordering" };
        return { ...prev, tables };
      });
    },
    [orderingCustomerId]
  );

  // 손님 주문이 확정된 뒤 "만들기"/"이어 만들기"를 누르면 제작 화면으로 진입한다.
  // 이미 진행 중인 주문(activeOrders)이 있으면 이어서, 없으면 새로 시작한다 (cake-tycoon-prompt.md 17장 5번).
  const startOrResumeOrder = useCallback((customerId: string) => {
    setState((prev) => {
      const existing = prev.activeOrders.find((order) => order.customerId === customerId);
      if (existing) {
        return { ...prev, screen: "crafting", craftingOrderId: existing.orderId };
      }

      const newOrder: ActiveOrder = {
        orderId: `order_${Date.now()}_${customerId}`,
        customerId,
        stage: "base",
        createdAt: Date.now(),
        completedAt: null,
        cake: {
          base: null,
          baking: { startTime: null, duration: 0, doneness: 0 },
          filling: null,
          frosting: { coverage: 0, evenness: 0 },
          toppings: [],
          decorations: [],
          text: [],
          drawings: [],
        },
      };

      return {
        ...prev,
        screen: "crafting",
        craftingOrderId: newOrder.orderId,
        activeOrders: [...prev.activeOrders, newOrder],
      };
    });
  }, []);

  // 제작 화면에서 나가기: 현재 주문의 진행 상태(stage/cake)는 activeOrders에 그대로 남아
  // 나중에 "이어 만들기"로 복귀할 수 있다.
  const exitCrafting = useCallback(() => {
    setState((prev) => ({ ...prev, screen: "shop", craftingOrderId: null }));
  }, []);

  // 제작 단계(④)에서 케이크 데이터를 갱신할 때 쓰는 범용 업데이터. 시트 선택/오븐/크림/토핑/
  // 데코레이션 각 단계가 필요한 필드만 골라 바꾸도록 updater 함수를 넘겨받는다.
  const updateOrder = useCallback((orderId: string, updater: (order: ActiveOrder) => ActiveOrder) => {
    setState((prev) => ({
      ...prev,
      activeOrders: prev.activeOrders.map((order) => (order.orderId === orderId ? updater(order) : order)),
    }));
  }, []);

  // 제작 화면 하단 단계 탭(Papa's 스타일)에서 단계를 전환할 때 사용.
  // Phase 1 뼈대 단계라 이동 자유도 제한(순서대로만 진행 등)은 아직 걸지 않는다 — 실제 판정/잠금은 ⑤에서 다듬는다.
  const setOrderStage = useCallback(
    (orderId: string, stage: CraftingStage) => {
      updateOrder(orderId, (order) => ({ ...order, stage }));
    },
    [updateOrder]
  );

  // 데코레이션 "완성": 주문을 ready로 바꾸고 매장으로 복귀한다. 케이크는 계산대 위에 표시된다.
  const completeOrder = useCallback((orderId: string) => {
    setState((prev) => ({
      ...prev,
      screen: "shop",
      craftingOrderId: null,
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
    startOrResumeOrder,
    exitCrafting,
    setOrderStage,
    updateOrder,
    completeOrder,
    serveOrder,
    dismissServeResult,
  };
}
