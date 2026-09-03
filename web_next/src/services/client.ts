import { mockAdapter } from './adapters/mock.adapter';
import { httpAdapter } from './adapters/http.adapter';
import type { ApiAdapter } from './adapters/types';

const MODE = process.env.NEXT_PUBLIC_API_MODE ?? 'mock';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

/** The single place the app decides how it talks to data. */
export const api: ApiAdapter = MODE === 'http' ? httpAdapter(API_URL) : mockAdapter();

export { ApiError } from './adapters/types';
