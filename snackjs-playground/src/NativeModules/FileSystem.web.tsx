const cacheDirectory = '';

const DB_NAME = 'snack-packages';
const DB_VERSION = 1;

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

const getItemAsync = (store: IDBObjectStore, key: string) =>
  new Promise<Item | null | undefined>((resolve, reject) => {
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

const addItemAsync = (store: IDBObjectStore, value: Item) =>
  new Promise((resolve, reject) => {
    const request = store.add(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

const putItemAsync = (store: IDBObjectStore, value: Item) =>
  new Promise((resolve, reject) => {
    const request = store.put(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

const setItemAsync = async (store: IDBObjectStore, value: Item) => {
  const existing = await getItemAsync(store, value.key);

  if (existing != null) {
    await putItemAsync(store, value);
  } else {
    await addItemAsync(store, value);
  }
};

const getInfoAsync = async (key: string) => {
  try {
    const tx = (await db).transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const value = await getItemAsync(store, key);

    return { exists: value != null };
  } catch (e) {
    console.warn(e);

    const exists = memoryStore.has(key);

    return { exists };
  }
};

const readAsStringAsync = async (key: string) => {
  try {
    const tx = (await db).transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const result = await getItemAsync(store, key);

    if (result != null) {
      await putItemAsync(store, {
        ...result,
        readAt: new Date().toISOString(),
      });

      return result.value;
    }

    return undefined;
  } catch (e) {
    console.warn(e);

    const item = memoryStore.get(key);
    return item ? item.value : undefined;
  }
};

const writeAsStringAsync = async (key: string, value: string) => {
  const createdAt = new Date().toISOString();
  const item = {
    key,
    value,
    createdAt,
    readAt: createdAt,
  };

  try {
    const tx = (await db).transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await setItemAsync(store, item);
  } catch (e) {
    console.warn(e);

    memoryStore.set(key, item);
  }
};

export default {
  cacheDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
};
