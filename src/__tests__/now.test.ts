import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { getNowMs } from '../utils/now';

const makeReq = (headerValue?: string) =>
  ({
    header: (name: string) => (name === 'x-test-now-ms' ? headerValue : undefined)
  } as unknown as Request);

const originalTestMode = process.env.TEST_MODE;

afterEach(() => {
  process.env.TEST_MODE = originalTestMode;
  vi.restoreAllMocks();
});

describe('getNowMs', () => {
  it('uses the header value when TEST_MODE is enabled', () => {
    process.env.TEST_MODE = '1';
    expect(getNowMs(makeReq('123456'))).toBe(123456);
  });

  it('falls back to Date.now when the header is missing or invalid', () => {
    process.env.TEST_MODE = '1';
    vi.spyOn(Date, 'now').mockReturnValue(777);

    expect(getNowMs(makeReq())).toBe(777);
    expect(getNowMs(makeReq('nope'))).toBe(777);
  });

  it('ignores the header when TEST_MODE is disabled', () => {
    process.env.TEST_MODE = '0';
    vi.spyOn(Date, 'now').mockReturnValue(42);

    expect(getNowMs(makeReq('999'))).toBe(42);
  });
});
