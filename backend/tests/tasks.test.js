const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

describe('Tasks, History & Dashboard API Endpoints', () => {
  let userAToken;
  let userBToken;
  let userAId;
  let userBId;
  const suffix = Date.now();

  beforeAll(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      username: `userA_${suffix}`,
      password: 'Password123!@#'
    });
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      username: `userB_${suffix}`,
      password: 'Password123!@#'
    });
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id;
  });

  afterAll(async () => {
    try {
      await pool.execute('DELETE FROM users WHERE username IN (?, ?)', [
        `userA_${suffix}`,
        `userB_${suffix}`
      ]);
    } catch (e) {
      // ignore
    }
  });

  describe('Task Creation (POST /api/tasks)', () => {
    it('should reject task creation without title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          description: 'No title provided'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('title is required');
    });

    it('should create a task successfully with title, description, and due date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Complete Packer AMI Configuration',
          description: 'Write HCL file and bootstrap scripts',
          due_date: today
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.id).toBeDefined();
      expect(res.body.data.task.title).toBe('Complete Packer AMI Configuration');
      expect(res.body.data.task.status).toBe('PENDING');
      expect(res.body.data.task.completed_at).toBeNull();
    });
  });

  describe('Task Retrieval and Filtering (GET /api/tasks)', () => {
    let taskId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Special Searchable UniqueTaskXYZ',
          description: 'Testing search functionality'
        });
      taskId = res.body.data.task.id;
    });

    it('should list all tasks for User A', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(2);
    });

    it('should search tasks by title keyword', async () => {
      const res = await request(app)
        .get('/api/tasks?search=UniqueTaskXYZ')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toContain('UniqueTaskXYZ');
    });

    it('should filter tasks by status (PENDING)', async () => {
      const res = await request(app)
        .get('/api/tasks?status=PENDING')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      res.body.data.tasks.forEach(task => {
        expect(task.status).toBe('PENDING');
      });
    });

    it('should retrieve a single task by ID', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.task.id).toBe(taskId);
      expect(res.body.data.task.title).toContain('UniqueTaskXYZ');
    });
  });

  describe('Task Editing and Deletion (PUT / DELETE)', () => {
    let taskId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Original Task Title',
          description: 'Original Description'
        });
      taskId = res.body.data.task.id;
    });

    it('should update task title and description', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Updated Task Title',
          description: 'Updated Description'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Updated Task Title');
      expect(res.body.data.task.description).toBe('Updated Description');
    });

    it('should delete task successfully', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify deletion
      const verifyRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(verifyRes.status).toBe(404);
    });
  });

  describe('Task Completion and Reopening (PATCH)', () => {
    let taskId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Task for Completion Flow',
          description: 'Testing toggle status'
        });
      taskId = res.body.data.task.id;
    });

    it('should mark task as completed (sets status COMPLETED and completed_at timestamp)', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.status).toBe('COMPLETED');
      expect(res.body.data.task.completed_at).not.toBeNull();
    });

    it('should mark completed task as pending again (sets status PENDING and clears completed_at)', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/pending`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.status).toBe('PENDING');
      expect(res.body.data.task.completed_at).toBeNull();
    });
  });

  describe('User Data Isolation (Security & Multi-tenancy)', () => {
    let userATaskId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Private Task for User A',
          description: 'User B must never access this'
        });
      userATaskId = res.body.data.task.id;
    });

    it('should prevent User B from reading User A task (404/Access Denied)', async () => {
      const res = await request(app)
        .get(`/api/tasks/${userATaskId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should prevent User B from updating User A task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${userATaskId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          title: 'Hacked by User B'
        });

      expect(res.status).toBe(404);
    });

    it('should prevent User B from completing User A task', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${userATaskId}/complete`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
    });

    it('should prevent User B from deleting User A task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${userATaskId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
    });

    it('should ensure User B tasks list does not contain User A tasks', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      const found = res.body.data.tasks.some(t => t.id === userATaskId);
      expect(found).toBe(false);
    });
  });

  describe('Historical Reports & Date Filtering', () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonth = now.getUTCMonth() + 1;
    const currentYear = now.getUTCFullYear();

    it('should return tasks for daily history', async () => {
      const res = await request(app)
        .get(`/api/tasks/history/daily?date=${today}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.filter).toBe('daily');
      expect(res.body.data.date).toBe(today);
      expect(res.body.data.total).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
    });

    it('should return tasks grouped by date for monthly history', async () => {
      const res = await request(app)
        .get(`/api/tasks/history/monthly?month=${currentMonth}&year=${currentYear}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.filter).toBe('monthly');
      expect(res.body.data.groupedByDate).toBeDefined();
      expect(res.body.data.total).toBeGreaterThan(0);
    });

    it('should return tasks for date range history', async () => {
      const res = await request(app)
        .get(`/api/tasks/history/range?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.filter).toBe('range');
      expect(res.body.data.total).toBeGreaterThan(0);
    });

    it('should reject range history if startDate > endDate', async () => {
      const res = await request(app)
        .get(`/api/tasks/history/range?startDate=2026-12-31&endDate=2026-01-01`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Dashboard Summary (GET /api/dashboard/summary)', () => {
    it('should return complete dashboard summary stats for authenticated user', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(`userA_${suffix}`);
      expect(res.body.data.summary).toBeDefined();
      expect(typeof res.body.data.summary.totalTasks).toBe('number');
      expect(typeof res.body.data.summary.pendingTasks).toBe('number');
      expect(typeof res.body.data.summary.completedTasks).toBe('number');
      expect(typeof res.body.data.summary.completionPercentage).toBe('number');
      expect(Array.isArray(res.body.data.summary.recentTasks)).toBe(true);
    });
  });
});
