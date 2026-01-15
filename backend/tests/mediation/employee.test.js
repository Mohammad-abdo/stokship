/**
 * Employee Controller Tests
 * 
 * Run with: npm test -- employee.test.js
 */

const request = require('supertest');
const app = require('../../src/server');
const prisma = require('../../src/config/database');
const bcrypt = require('bcryptjs');

describe('Employee API', () => {
  let adminToken;
  let employeeId;
  let adminId;

  beforeAll(async () => {
    // Create admin for testing
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.admin.create({
      data: {
        email: 'test-admin@test.com',
        password: hashedPassword,
        name: 'Test Admin',
        isActive: true,
        isSuperAdmin: true
      }
    });
    adminId = admin.id;

    // Login as admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test-admin@test.com',
        password: 'admin123'
      });

    adminToken = loginRes.body.data.token;
  });

  afterAll(async () => {
    // Cleanup
    if (employeeId) {
      await prisma.employee.delete({ where: { id: employeeId } });
    }
    await prisma.admin.delete({ where: { id: adminId } });
    await prisma.$disconnect();
  });

  describe('POST /api/admin/employees', () => {
    it('should create a new employee', async () => {
      const res = await request(app)
        .post('/api/admin/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'employee@test.com',
          password: 'password123',
          name: 'Test Employee',
          phone: '+1234567890',
          commissionRate: 1.5
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('employeeCode');
      expect(res.body.data.email).toBe('employee@test.com');
      
      employeeId = res.body.data.id;
    });

    it('should return 400 if email already exists', async () => {
      const res = await request(app)
        .post('/api/admin/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'employee@test.com',
          password: 'password123',
          name: 'Test Employee 2'
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/admin/employees')
        .send({
          email: 'employee2@test.com',
          password: 'password123',
          name: 'Test Employee'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/admin/employees', () => {
    it('should get all employees', async () => {
      const res = await request(app)
        .get('/api/admin/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/employees/:id/dashboard', () => {
    it('should get employee dashboard', async () => {
      const res = await request(app)
        .get(`/api/employees/${employeeId}/dashboard`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data.stats).toHaveProperty('traderCount');
      expect(res.body.data.stats).toHaveProperty('activeDealsCount');
    });
  });
});



