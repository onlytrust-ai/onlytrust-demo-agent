import type { IncomingHttpHeaders } from 'http';

export interface VercelRequest {
  method?: string;
  headers: IncomingHttpHeaders;
  body: unknown;
}

export interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
  end(): VercelResponse;
  setHeader(name: string, value: string | string[]): void;
}
