// 단계를 마칠 때 화면 위쪽에 잠깐 뜨는 피드백 쪽지 (기획서 1장 7번 "즉각적인 단계별 피드백").
// 어느 화면에서 불러도 GameRoot의 <Toaster />가 보여준다. 새 쪽지가 오면 이전 쪽지를 바로 바꾼다.

export type Toast = {
  id: number;
  emoji: string;
  title: string; // 예: "필링"
  stars?: number; // 1~3
  message: string;
};

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();
const TOAST_MS = 2600;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const notify = () => listeners.forEach((listener) => listener());

export function showToast(toast: Omit<Toast, 'id'>) {
  current = { ...toast, id: nextId++ };
  notify();
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    current = null;
    notify();
  }, TOAST_MS);
}

export const getToast = () => current;
export function subscribeToast(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const starsText = (stars: number) => '★'.repeat(stars) + '☆'.repeat(3 - stars);
