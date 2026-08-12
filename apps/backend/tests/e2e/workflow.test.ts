import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

// Mock DB connection for E2E tests
vi.mock('../../src/config/database', () => ({
  connectDB: vi.fn().mockResolvedValue(true),
}));

describe('End-to-End Workflow Validation', () => {
  let app: any;

  beforeAll(async () => {
    app = await createApp();
  });

  it('GET /health returns 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('POST /api/lectures validates payload with Zod', async () => {
    const res = await request(app)
      .post('/api/lectures')
      .send({
        userId: '', // Invalid empty userId
        title: 'Missing File',
      });
    
    // Zod should catch the missing file or empty string
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/search validates query params', async () => {
    const res = await request(app)
      .post('/api/search')
      .send({
        query: '' // Invalid empty query
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
