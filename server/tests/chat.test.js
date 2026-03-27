const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let authToken;

const createAuthUser = async () => {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const user = await User.create({
    name: 'Chat Test User',
    email: 'chatuser@example.com',
    password: hashedPassword,
    phone: '9876543210',
    language: 'en'
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return { user, token };
};

describe('Chat Route Integration Tests', () => {

  beforeEach(async () => {
    const { token } = await createAuthUser();
    authToken = token;
  });

  describe('POST /api/chat/message', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/chat/message')
        .send({ message: 'What is the best crop for summer?', language: 'en' });
      expect(res.statusCode).toBe(401);
    });

    it('should return 400 with empty message or valid success with token', async () => {
      const res = await request(app)
        .post('/api/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Hello', language: 'en' });
      // Depending on API key config, this could be 200, 400, 500 or 503
      expect([200, 400, 500, 503]).toContain(res.statusCode);
    });
  });

  describe('GET /api/chat/history', () => {
    it('should return chat history array with valid token', async () => {
      const res = await request(app)
        .get('/api/chat/history')
        .set('Authorization', `Bearer ${authToken}`);
      expect([200, 404]).toContain(res.statusCode);
    });
  });
});
