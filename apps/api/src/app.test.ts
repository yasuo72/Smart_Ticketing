import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';

describe('request logging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('writes request logs for incoming requests in development mode', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const app = createApp();

    await request(app).get('/health');

    expect(writeSpy).toHaveBeenCalled();
  });
});
