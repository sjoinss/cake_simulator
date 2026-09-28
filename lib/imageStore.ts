// 플레이어가 끌어다 놓은 그림(주인 캐릭터, 손님)을 브라우저에 저장한다.
// localStorage는 용량(보통 5MB)이 작아 그림 여러 장을 담기 어려워서 IndexedDB에 Blob 그대로 넣는다.

const DB_NAME = 'cake-tycoon';
const STORE = 'images';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const loadImage = (key: string) => run<Blob | undefined>('readonly', (store) => store.get(key));
export const saveImage = (key: string, blob: Blob) => run('readwrite', (store) => store.put(blob, key));
export const deleteImage = (key: string) => run('readwrite', (store) => store.delete(key));
