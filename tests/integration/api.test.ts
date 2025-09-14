import request from 'supertest';
import app from '../../src/app-final';

describe('API Integration Tests', () => {
  describe('Health Endpoints', () => {
    it('GET /health should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('GET /alive should return alive status', async () => {
      const response = await request(app)
        .get('/alive')
        .expect(200);

      expect(response.body.status).toBe('alive');
    });

    it('GET /metrics should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('process_cpu_user_seconds_total');
    });
  });

  describe('Auth Endpoints', () => {
    it('GET /api/auth/test should return auth info', async () => {
      const response = await request(app)
        .get('/api/auth/test')
        .expect(200);

      expect(response.body.message).toContain('Auth routes working');
      expect(response.body.service).toBe('auth');
    });

    it('GET /api/auth/connect should redirect to Slack', async () => {
      const response = await request(app)
        .get('/api/auth/connect')
        .expect(302);

      expect(response.headers.location).toContain('slack.com/oauth');
    });
  });

  describe('Slack Endpoints', () => {
    it('GET /api/slack/test should return slack info', async () => {
      const response = await request(app)
        .get('/api/slack/test')
        .expect(200);

      expect(response.body.message).toContain('Slack routes working');
      expect(response.body.service).toBe('slack');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API endpoints', async () => {
      // Make multiple requests to test rate limiting
      const requests = Array(6).fill(null).map(() => 
        request(app).get('/api/auth/test')
      );

      const responses = await Promise.all(requests);
      
      // Check if some requests are rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });
});
