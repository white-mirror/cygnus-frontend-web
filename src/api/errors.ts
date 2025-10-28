export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Sesión expirada o credenciales inválidas.") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;

export const isUnauthorizedError = (
  error: unknown,
): error is UnauthorizedError =>
  error instanceof UnauthorizedError ||
  (error instanceof ApiError && error.status === 401);
