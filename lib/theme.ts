import type { ThemeName } from './gameState';

// 테마 선택 (10장). 가게 이름·꾸미기 그림처럼 가게 꾸미기 설정이라 게임 진행 저장과 따로 둔다 —
// 진행을 초기화해도 테마는 남는다. 실제 색은 app/globals.css의 [data-theme] 변수 세트.
export const THEMES: { id: ThemeName; label: string; swatch: [string, string] }[] = [
  { id: 'pink', label: '핑크', swatch: ['#f8d7cf', '#ec8672'] },
  { id: 'red', label: '레드', swatch: ['#f6d3d3', '#dd6f73'] },
  { id: 'orange', label: '오렌지', swatch: ['#fadcc2', '#ea9352'] },
  { id: 'yellow', label: '옐로', swatch: ['#f8e9bf', '#d49f2c'] },
  { id: 'sky', label: '스카이', swatch: ['#d3ecf7', '#4fa5d0'] },
  { id: 'blue', label: '블루', swatch: ['#d6ddf7', '#6d84d6'] },
  { id: 'purple', label: '퍼플', swatch: ['#e6dbf5', '#9878cf'] },
];

const STORAGE_KEY = 'cake-tycoon.theme';
const DEFAULT_THEME: ThemeName = 'pink';
const listeners = new Set<() => void>();

const isThemeName = (value: unknown): value is ThemeName => THEMES.some((theme) => theme.id === value);

function readStoredTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeName(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

let current: ThemeName = DEFAULT_THEME;

// <html data-theme>을 바꾸면 CSS 변수 세트 전체가 바뀐다
function apply(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
}

if (typeof window !== 'undefined') {
  current = readStoredTheme();
  apply(current);
}

export function getTheme(): ThemeName {
  return current;
}

export function getDefaultTheme(): ThemeName {
  return DEFAULT_THEME;
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setTheme(theme: ThemeName) {
  current = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // 저장이 막힌 환경이면 이번 판에서만 쓴다
  }
  apply(theme);
  listeners.forEach((listener) => listener());
}
