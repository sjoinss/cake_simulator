"use client";

import { useSyncExternalStore } from "react";
import { getMaterialRegistry, subscribeMaterials } from "@/lib/materials";

// 기본 + 커스텀 재료 목록. 가게 꾸미기 창에서 재료를 만들거나 지우면 이 값을 쓰는 화면이 다시 그려진다.
export function useMaterialRegistry() {
  return useSyncExternalStore(subscribeMaterials, getMaterialRegistry, getMaterialRegistry);
}
