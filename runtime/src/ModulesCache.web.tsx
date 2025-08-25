const DB_NAME = 'snack-packages';
const DB_VERSION = 2;

const STORE_NAME = 'cache';

type Item = {
  key: string;
  value: string;
  createdAt: string;
  readAt: string;
};

const memoryStore = new Map<string, Item>();

const db = new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = () => reject(request.error);
  request.onsuccess = () => resolve(request.result);
  request.onupgradeneeded = () => {
    const db = request.result;

    if (db.objectStoreNames.contains(STORE_NAME)) {
      return;
    }

    const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });

    store.createIndex('value', 'value', { unique: false });
    store.createIndex('createdAt', 'createdAt', { unique: false });
    store.createIndex('readAt', 'readAt', { unique: false });
  };
});

function getStoreItem(store: IDBObjectStore, key: string) {
  return new Promise<Item | null | undefined>((resolve, reject) => {
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function addStoreItem(store: IDBObjectStore, value: Item) {
  return new Promise((resolve, reject) => {
    const request = store.add(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function putStoreItem(store: IDBObjectStore, value: Item) {
  return new Promise((resolve, reject) => {
    const request = store.put(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function setStoreItem(store: IDBObjectStore, value: Item) {
  const existing = await getStoreItem(store, value.key);

  if (existing != null) {
    await putStoreItem(store, value);
  } else {
    await addStoreItem(store, value);
  }
}

export async function getCacheFile(name: string) {
  try {
    const tx = (await db).transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const result = await getStoreItem(store, name);

    if (result != null) {
      await putStoreItem(store, {
        ...result,
        readAt: new Date().toISOString(),
      });

      return result.value;
    }

    return undefined;
  } catch (e) {
    console.warn(e);

    const item = memoryStore.get(name);
    return item ? item.value : undefined;
  }
}

export async function setCacheFile(name: string, content: string) {
  const createdAt = new Date().toISOString();
  const item: Item = {
    key: name,
    value: content,
    createdAt,
    readAt: createdAt,
  };

  try {
    const tx = (await db).transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await setStoreItem(store, item);
  } catch (e) {
    console.warn(e);

    memoryStore.set(name, item);
  }
}
