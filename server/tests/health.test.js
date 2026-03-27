const request = require('supertest');
const app = require('../app');

describe('Health Check Integration Test', () => {
  it('GET /api/health - should return 200 with status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.message).toBeDefined();
  });
});

describe('404 Handler Integration Test', () => {
  it('GET /api/nonexistent - should return 404', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
