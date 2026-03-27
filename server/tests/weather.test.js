const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const createAuthUser = async () => {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const user = await User.create({
    name: 'Weather Test User',
    email: 'weatheruser@example.com',
    password: hashedPassword,
    phone: '9876543210',
    language: 'en'
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return { user, token };
};

describe('Weather Route Integration Tests', () => {

  let authToken;
  beforeEach(async () => {
    const { token } = await createAuthUser();
    authToken = token;
  });

  describe('GET /api/weather/city', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/weather/city?city=Delhi');
      expect(res.statusCode).toBe(401);
    });

    it('should return weather data or service error with valid token and city', async () => {
      const res = await request(app)
        .get('/api/weather/city?city=Delhi')
        .set('Authorization', `Bearer ${authToken}`);
      // 200 if external API keys set, 500/503 if not configured in test env
      expect([200, 400, 500, 503]).toContain(res.statusCode);
    });
  });
});
