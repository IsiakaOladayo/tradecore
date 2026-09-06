const request = require('supertest');
const app = require('../app');

describe('GET /health', () => {
  it('should return a healthy response', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.version).toBeDefined();
    expect(response.body.region).toBeDefined();
    expect(response.body.ts).toBeDefined();
  });
});
