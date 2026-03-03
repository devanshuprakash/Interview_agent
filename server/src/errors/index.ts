/**
 * AppError — base class for all domain/application errors.
 * Services throw these; ErrorHandlerMiddleware translates them to HTTP.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly code = "APP_ERROR",
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "AUTH_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(required: number) {
    super(
      `Not enough credits. Minimum ${required} required.`,
      400,
      "INSUFFICIENT_CREDITS",
    );
  }
}

export class PaymentError extends AppError {
  constructor(message = "Payment error") {
    super(message, 400, "PAYMENT_ERROR");
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = "External service error") {
    super(message, 502, "EXTERNAL_SERVICE_ERROR");
  }
}
