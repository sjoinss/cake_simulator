"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { deleteImage, loadImage, saveImage } from "@/lib/imageStore";
import { CUSTOMER_LOOK_COUNT, DEFAULT_OWNER_IMAGE, withBasePath } from "@/lib/assets";

// 손님 모습은 최대 CUSTOMER_LOOK_COUNT(6)종류. 종류마다 평소 모습 + 케이크를 먹는 모습 두 장
export type CustomerLookPose = "idle" | "eating";

export const OWNER_IMAGE_KEY = "owner";
export const customerImageKey = (look: number, pose: CustomerLookPose) => `customer-${look}-${pose}`;

const ALL_KEYS = [
  OWNER_IMAGE_KEY,
  ...Array.from({ length: CUSTOMER_LOOK_COUNT }, (_, look) => [
    customerImageKey(look, "idle"),
    customerImageKey(look, "eating"),
  ]).flat(),
];

type CustomImagesValue = {
  images: Readonly<Record<string, string>>; // 저장소 키 → 화면에 쓸 object URL (플레이어가 넣은 것만)
  ownerImage: string | null; // 플레이어가 넣은 주인 그림, 없으면 기본 그림(없으면 null)
  hasCustomOwner: boolean;
  setImage: (key: string, file: File) => void;
  clearImage: (key: string) => void;
  // 이 손님(look 번호)에게 보여줄 그림. 채워진 손님 칸들 중에서 고르고, 먹는 모습이 없으면 평소 모습을 쓴다
  getCustomerImage: (look: number, pose: CustomerLookPose) => string | null;
};

const CustomImagesContext = createContext<CustomImagesValue | null>(null);

// 플레이어가 끌어다 놓은 그림들을 IndexedDB에서 불러와 화면 전체에 나눠준다.
export function CustomImagesProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<Record<string, string>>({});
  // 언마운트 때 object URL을 정리하려고 최신 목록을 들고 있는다
  const urlsRef = useRef(images);
  useEffect(() => {
    urlsRef.current = images;
  }, [images]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(ALL_KEYS.map(async (key) => [key, await loadImage(key).catch(() => undefined)] as const)).then(
      (entries) => {
        if (cancelled) return;
        const loaded: Record<string, string> = {};
        for (const [key, blob] of entries) if (blob) loaded[key] = URL.createObjectURL(blob);
        setImages(loaded);
      },
    );
    return () => {
      cancelled = true;
      Object.values(urlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const replace = useCallback((key: string, url: string | null) => {
    setImages((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]);
      const next = { ...prev };
      if (url) next[key] = url;
      else delete next[key];
      return next;
    });
  }, []);

  const setImage = useCallback(
    (key: string, file: File) => {
      if (!file.type.startsWith("image/")) return;
      replace(key, URL.createObjectURL(file));
      // 저장에 실패해도(사생활 보호 모드 등) 이번 판에서는 그대로 보인다
      saveImage(key, file).catch(() => {});
    },
    [replace],
  );

  const clearImage = useCallback(
    (key: string) => {
      replace(key, null);
      deleteImage(key).catch(() => {});
    },
    [replace],
  );

  const getCustomerImage = useCallback(
    (look: number, pose: CustomerLookPose) => {
      const filled = Array.from({ length: CUSTOMER_LOOK_COUNT }, (_, index) => index).filter(
        (index) => images[customerImageKey(index, "idle")],
      );
      if (filled.length === 0) return null;
      const chosen = filled[look % filled.length];
      return (
        (pose === "eating" && images[customerImageKey(chosen, "eating")]) || images[customerImageKey(chosen, "idle")]
      );
    },
    [images],
  );

  const value: CustomImagesValue = {
    images,
    ownerImage: images[OWNER_IMAGE_KEY] ?? (DEFAULT_OWNER_IMAGE ? withBasePath(DEFAULT_OWNER_IMAGE) : null),
    hasCustomOwner: !!images[OWNER_IMAGE_KEY],
    setImage,
    clearImage,
    getCustomerImage,
  };

  return <CustomImagesContext.Provider value={value}>{children}</CustomImagesContext.Provider>;
}

export function useCustomImages(): CustomImagesValue {
  const value = useContext(CustomImagesContext);
  if (!value) throw new Error("CustomImagesProvider가 필요합니다");
  return value;
}
