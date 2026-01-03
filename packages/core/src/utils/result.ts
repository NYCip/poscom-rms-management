/**
 * Result type for operations that can fail
 * Provides type-safe error handling without exceptions
 */

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Check if result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Check if result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Unwrap a result, throwing if it's an error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwrap a result with a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Map over a successful result
 */
export function map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * Map over a failed result
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (!result.success) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Chain async operations that return Results
 */
export async function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}

/**
 * Collect multiple results into a single result
 */
export function collect<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const data: T[] = [];
  for (const result of results) {
    if (!result.success) {
      return result;
    }
    data.push(result.data);
  }
  return ok(data);
}

/**
 * Wrap a function that might throw into a Result
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Wrap an async function that might throw into a Result
 */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
