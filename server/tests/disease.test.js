const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const createAuthUser = async () => {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const user = await User.create({
    name: 'Disease Test User',
    email: 'diseasetest@example.com',
    password: hashedPassword,
    phone: '9876543210',
    language: 'en'
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return { user, token };
};

describe('Disease Detection Route Integration Tests', () => {

  let authToken;
  beforeEach(async () => {
    const { token } = await createAuthUser();
    authToken = token;
  });

  describe('POST /api/disease/detect', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/disease/detect');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/disease/history', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/disease/history');
      expect(res.statusCode).toBe(401);
    });

    it('should return disease history with valid token', async () => {
      const res = await request(app)
        .get('/api/disease/history')
        .set('Authorization', `Bearer ${authToken}`);
      expect([200, 404]).toContain(res.statusCode);
    });
  });
});
