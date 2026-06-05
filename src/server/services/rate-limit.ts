type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 6;

export function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (existing.count >= MAX_REQUESTS) {
    throw new Error("Too many analysis requests. Try again in a minute.");
  }

  existing.count += 1;
}
