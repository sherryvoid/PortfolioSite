const request = require('supertest');
const app = require('../server');

describe('Health Check API', () => {
  it('should return 200 OK and valid JSON containing status OK', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });
});
