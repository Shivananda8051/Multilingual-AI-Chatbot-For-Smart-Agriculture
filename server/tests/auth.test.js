const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth Integration Tests', () => {

  describe('GET /api/auth/me', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toBe(401);
    });
    
    it('should return the user profile with a valid token', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const user = await User.create({
        name: 'Profile Fetch User',
        email: 'profile@example.com',
        password: hashedPassword,
        phone: '9876543210',
        language: 'en'
      });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
    });
  });
});
