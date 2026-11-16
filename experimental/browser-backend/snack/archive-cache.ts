interface CacheOptions {
  name?: string;
  maxEntries?: number;
  maxBytes?: number;
}
interface ArchiveMetadata {
  integrity: string;
  size: number;
  time: number;
}
function metadata(value: unknown): ArchiveMetadata {
  if (typeof value !== 'object' || value === null) throw Error('Invalid archive metadata');
  const entry = value as Record<string, unknown>;
  if (
    typeof entry.integrity !== 'string' ||
    typeof entry.size !== 'number' ||
    !Number.isSafeInteger(entry.size) ||
    entry.size < 0 ||
    typeof entry.time !== 'number' ||
    !Number.isFinite(entry.time)
  )
    throw Error('Invalid archive metadata');
  return { integrity: entry.integrity, size: entry.size, time: entry.time };
}
const errorName = (error: unknown) => (error instanceof Error ? error.name : 'UnknownError');

export class ArchiveCache {
  readonly name: string;
  readonly maxEntries: number;
  readonly maxBytes: number;
  readonly warnings: string[] = [];
  private db: IDBDatabase | null = null;

  constructor({
    name = 'rsc-raw-packages-v3',
    maxEntries = 128,
    maxBytes = 64 * 1024 * 1024,
  }: CacheOptions = {}) {
    this.name = name;
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
  }
  async database(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('archives');
        request.result.createObjectStore('metadata');
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(Error('Archive database upgrade blocked'));
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          this.db = null;
        };
        resolve(db);
      };
    });
    return this.db;
  }
  async get(integrity: string): Promise<Response | undefined> {
    try {
      const db = await this.database();
      const bytes = await new Promise<unknown>((resolve, reject) => {
        const tx = db.transaction('archives', 'readonly');
        const request = tx.objectStore('archives').get(integrity);
        let value: unknown;
        request.onsuccess = () => {
          value = request.result;
        };
        tx.oncomplete = () => resolve(value);
        tx.onabort = tx.onerror = () => reject(tx.error);
      });
      if (bytes === undefined) return undefined;
      if (!(bytes instanceof Uint8Array)) throw Error('Invalid cached archive');
      return new Response(new Uint8Array(bytes));
    } catch (error) {
      this.warnings.push('Persistent cache unavailable: ' + errorName(error));
      return undefined;
    }
  }
  async remove(integrity: string): Promise<void> {
    try {
      const db = await this.database();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['archives', 'metadata'], 'readwrite');
        for (const store of ['archives', 'metadata']) tx.objectStore(store).delete(integrity);
        tx.oncomplete = () => resolve();
        tx.onabort = tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* Cache removal is best effort. */
    }
  }
  async put(integrity: string, bytes: Uint8Array): Promise<void> {
    if (bytes.length > this.maxBytes) return;
    try {
      await navigator.locks.request('rsc-package-cache:' + this.name, async () => {
        const db = await this.database();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(['archives', 'metadata'], 'readwrite', {
            durability: 'strict',
          });
          const data = tx.objectStore('archives'),
            meta = tx.objectStore('metadata');
          const request = meta.getAll();
          request.onsuccess = () => {
            try {
              const entries = (request.result as unknown[])
                .map(metadata)
                .filter((entry) => entry.integrity !== integrity);
              const next = { integrity, size: bytes.length, time: Date.now() };
              entries.push(next);
              entries.sort((a, b) => a.time - b.time);
              let total = entries.reduce((sum, entry) => sum + entry.size, 0);
              data.put(bytes, integrity);
              meta.put(next, integrity);
              while (entries.length > this.maxEntries || total > this.maxBytes) {
                const entry = entries.shift();
                if (!entry) break;
                data.delete(entry.integrity);
                meta.delete(entry.integrity);
                total -= entry.size;
              }
            } catch (error) {
              tx.abort();
              reject(error);
            }
          };
          tx.oncomplete = () => resolve();
          tx.onabort = tx.onerror = () => reject(tx.error || Error('Archive transaction failed'));
        });
      });
    } catch (error) {
      this.warnings.push('Persistent cache write skipped: ' + errorName(error));
    }
  }
}
