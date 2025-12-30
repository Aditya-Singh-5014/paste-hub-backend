import type { Request } from 'express';

export function getNowMs(req?: Request): number {
  if (process.env.TEST_MODE === '1') {
    const headerValue = req?.header('x-test-now-ms');
    if (headerValue) {
      const parsed = Number(headerValue);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return Date.now();
}
