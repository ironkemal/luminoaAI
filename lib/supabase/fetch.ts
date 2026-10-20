/**
 * Fail-fast fetch for Supabase.
 *
 * postgrest-js retries network errors 3 times with 1s/2s/4s backoff, so a single
 * query against an unreachable project blocks the page for ~7 seconds (and pages
 * run several queries in a row). This wrapper:
 *  - aborts requests that hang longer than REQUEST_TIMEOUT_MS,
 *  - rethrows network failures as AbortError, which postgrest-js does not retry,
 *  - remembers an outage for OFFLINE_COOLDOWN_MS and fails further calls instantly.
 */

const REQUEST_TIMEOUT_MS = 10_000;
const OFFLINE_COOLDOWN_MS = 30_000;

let offlineUntil = 0;

function unreachableError(cause?: unknown): Error {
  const err = new Error(
    "Veritabanına ulaşılamıyor (Supabase). İnternet bağlantını veya Supabase projesinin durumunu kontrol et."
  );
  err.name = "AbortError";
  (err as Error & { cause?: unknown }).cause = cause;
  return err;
}

export function isSupabaseOffline(): boolean {
  return Date.now() < offlineUntil;
}

export const supabaseFetch: typeof fetch = async (input, init) => {
  if (isSupabaseOffline()) throw unreachableError();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const callerSignal = init?.signal;
  callerSignal?.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (callerSignal?.aborted) throw err;
    offlineUntil = Date.now() + OFFLINE_COOLDOWN_MS;
    throw unreachableError(err);
  } finally {
    clearTimeout(timer);
  }
};
