const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('Authentication API Endpoints', () => {
  const uniqueSuffix = Date.now();
  const testUser = {
    username: `testuser_${uniqueSuffix}`,
    password: 'StrongPassword123!'
  };

  afterAll(async () => {
    // Clean up created test user
    try {
      await pool.execute('DELETE FROM users WHERE username LIKE ?', [`testuser_%`]);
    } catch (e) {
      // ignore
    }
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration if username is too short (< 4 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'abc',
          password: 'StrongPassword123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('between 4 and 30 characters');
    });

    it('should reject registration if username contains invalid characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'bad user name!',
          password: 'StrongPassword123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration if password is weak (less than 12 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: `user_${uniqueSuffix}`,
          password: 'Short1!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('at least 12 characters');
    });

    it('should reject registration if password lacks special character or numbers', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: `user_${uniqueSuffix}`,
          password: 'PasswordWithoutNumbers'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully register a valid user and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.username).toBe(testUser.username);
    });

    it('should prevent duplicate username registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already taken');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should fail login with wrong password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid username or password.');
    });

    it('should fail login with non-existent user (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent_user_9999',
          password: 'StrongPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid username or password.');
    });

    it('should successfully log in with valid credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(testUser);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.username).toBe(testUser.username);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user info when authenticated via Bearer token', async () => {
      const loginRes = await request(app).post('/api/auth/login').send(testUser);
      const token = loginRes.body.data.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(testUser.username);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should successfully respond to logout', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
