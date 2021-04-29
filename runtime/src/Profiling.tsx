const enable = false;

const now: () => number =
  // @ts-ignore
  global.nativePerformanceNow;

let lastCheckPoint: number;
if (enable) {
  lastCheckPoint = now();
}

export const checkpoint = enable
  ? (name: string) => {
      const t = now();
      const d = t - lastCheckPoint;
      lastCheckPoint = t;
      console.log(`[profiling] [${name}] ${t.toFixed(2)}ms at, ${d.toFixed(2)}ms since`);
    }
  : () => {};

export const section: <T>(name: string, foo: () => Promise<T>) => Promise<T> = enable
  ? async (name, foo) => {
      const before = now();
      const r = await foo();
      const after = now();
      console.log(`[profiling] [${name}] ${(after - before).toFixed(2)}ms taken`);
      return r;
    }
  : (_, foo) => foo();

export const sectionSync: <T>(name: string, foo: () => T) => T = enable
  ? (name, foo) => {
      const before = now();
      const r = foo();
      const after = now();
      console.log(`[profiling] [${name}] ${(after - before).toFixed(2)}ms taken`);
      return r;
    }
  : (_, foo) => foo();
