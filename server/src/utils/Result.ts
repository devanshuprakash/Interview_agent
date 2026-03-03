/**
 * Result<T, E> — explicit success/failure return type.
 * Services return Result instead of throwing across layers;
 * controllers unwrap and map to HTTP status codes.
 *
 * Pattern: Railway-oriented programming / Result monad.
 */

export type Result<T, E = Error> = Ok<T> | Err<E>;

export class Ok<T> {
  readonly ok = true as const;
  constructor(public readonly value: T) {}

  map<U>(fn: (v: T) => U): Ok<U> {
    return new Ok(fn(this.value));
  }

  mapErr<F>(_fn: (e: never) => F): Ok<T> {
    return this;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(_fallback: T): T {
    return this.value;
  }
}

export class Err<E> {
  readonly ok = false as const;
  constructor(public readonly error: E) {}

  map<U>(_fn: (v: never) => U): Err<E> {
    return this;
  }

  mapErr<F>(fn: (e: E) => F): Err<F> {
    return new Err(fn(this.error));
  }

  unwrap(): never {
    throw this.error;
  }

  unwrapOr<T>(fallback: T): T {
    return fallback;
  }
}

export const ok = <T>(value: T): Ok<T> => new Ok(value);
export const err = <E>(error: E): Err<E> => new Err(error);
