/**
 * Specification<T> — composes query filter predicates.
 * Keeps complex query logic out of services; specs are composable via
 * .and() / .or() / .not().
 *
 * Pattern: Specification.
 */
export abstract class Specification<T> {
  abstract toQuery(): Record<string, unknown>;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>,
  ) {
    super();
  }

  toQuery(): Record<string, unknown> {
    return { $and: [this.left.toQuery(), this.right.toQuery()] };
  }
}

class OrSpecification<T> extends Specification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>,
  ) {
    super();
  }

  toQuery(): Record<string, unknown> {
    return { $or: [this.left.toQuery(), this.right.toQuery()] };
  }
}

class NotSpecification<T> extends Specification<T> {
  constructor(private readonly inner: Specification<T>) {
    super();
  }

  toQuery(): Record<string, unknown> {
    return { $nor: [this.inner.toQuery()] };
  }
}
