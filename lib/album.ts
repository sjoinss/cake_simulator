import type { ServedCakeRecord } from './gameState';

// 케이크 앨범: 하루가 끝날 때 그날 서빙한 케이크 중 골라서 담아 두는 기념 앨범.
// 가게 이름·꾸미기 그림처럼 **진행 초기화와 무관**하게 브라우저(localStorage)에 따로 저장한다.
// 케이크는 그림이 아니라 데이터(CakeData)로 저장하고, 볼 때마다 같은 렌더러로 다시 그린다 (16장).

export type AlbumEntry = ServedCakeRecord & {
  name: string; // 붙인 이름 (없으면 빈 문자열 → 카드에 빈칸)
  shopName: string; // 담을 때의 가게 이름
  savedAt: number;
};

export const ALBUM_NAME_MAX = 16;
const ALBUM_KEY = 'cake-tycoon.album';

let entries: AlbumEntry[] = [];
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ALBUM_KEY) ?? '[]');
    if (Array.isArray(parsed)) entries = parsed.filter((entry) => entry && typeof entry.id === 'string' && entry.cake);
  } catch {
    entries = [];
  }
}

// 저장에 실패하면(용량 초과 등) false — 화면에서 알려준다
function commit(next: AlbumEntry[]): boolean {
  try {
    localStorage.setItem(ALBUM_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  entries = next;
  listeners.forEach((listener) => listener());
  return true;
}

// 최근에 담은 날이 앞, 같은 날 안에서는 서빙한 순서
export const getAlbum = () => entries;
export function subscribeAlbum(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addToAlbum(picks: { record: ServedCakeRecord; name: string }[], shopName: string): boolean {
  if (picks.length === 0) return true;
  const now = Date.now();
  const added: AlbumEntry[] = picks.map(({ record, name }, index) => ({
    ...record,
    name: name.trim().slice(0, ALBUM_NAME_MAX),
    shopName,
    savedAt: now + index,
  }));
  // 같은 케이크를 두 번 담지 않게
  const existing = new Set(entries.map((entry) => entry.id));
  return commit([...added.filter((entry) => !existing.has(entry.id)), ...entries]);
}

export function renameAlbumEntry(id: string, name: string): boolean {
  return commit(entries.map((entry) => (entry.id === id ? { ...entry, name: name.trim().slice(0, ALBUM_NAME_MAX) } : entry)));
}

export function removeAlbumEntry(id: string): boolean {
  return commit(entries.filter((entry) => entry.id !== id));
}
