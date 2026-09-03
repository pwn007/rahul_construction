/**
 * Transport contract.
 *
 * Every service in the app talks to this interface and nothing else, so moving
 * between `mockAdapter` (local seed data + an in-memory overlay) and
 * `httpAdapter` (the Laravel API) is one env var — no service, hook or
 * component changes.
 */
export interface ApiAdapter {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public path: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
