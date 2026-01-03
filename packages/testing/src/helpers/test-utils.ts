export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 10 } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await sleep(interval);
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

let testIdCounter = 0;
export const generateTestId = (prefix = 'test') => `${prefix}-${++testIdCounter}`;
export const resetTestIdCounter = () => { testIdCounter = 0; };

export async function retry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number } = {}
): Promise<T> {
  const { retries = 3, delay = 100 } = options;
  let lastError: Error | undefined;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e as Error;
      if (i < retries - 1) await sleep(delay);
    }
  }
  throw lastError;
}
