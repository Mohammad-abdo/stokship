/**
 * Offer Controller Tests
 */

const request = require('supertest');
const app = require('../../src/server');
const prisma = require('../../src/config/database');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

describe('Offer API', () => {
  let traderToken;
  let employeeToken;
  let traderId;
  let employeeId;
  let adminId;
  let offerId;

  beforeAll(async () => {
    // Create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.admin.create({
      data: {
        email: 'test-admin-offer@test.com',
        password: hashedPassword,
        name: 'Test Admin',
        isActive: true
      }
    });
    adminId = admin.id;

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        email: 'employee-offer@test.com',
        password: hashedPassword,
        name: 'Test Employee',
        employeeCode: 'EMP-TEST-001',
        commissionRate: 1.0,
        createdBy: adminId,
        isActive: true
      }
    });
    employeeId = employee.id;

    // Create trader
    const trader = await prisma.trader.create({
      data: {
        email: 'trader-offer@test.com',
        password: hashedPassword,
        name: 'Test Trader',
        companyName: 'Test Company',
        traderCode: 'TRD-TEST-001',
        barcode: '123456789',
        qrCodeUrl: 'data:image/png;base64,test',
        employeeId: employeeId,
        isActive: true
      }
    });
    traderId = trader.id;

    // Login as trader
    const traderLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'trader-offer@test.com',
        password: 'admin123'
      });
    traderToken = traderLogin.body.data.token;

    // Login as employee
    const employeeLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'employee-offer@test.com',
        password: 'admin123'
      });
    employeeToken = employeeLogin.body.data.token;
  });

  afterAll(async () => {
    // Cleanup
    if (offerId) {
      await prisma.offerItem.deleteMany({ where: { offerId } });
      await prisma.offer.delete({ where: { id: offerId } });
    }
    await prisma.trader.delete({ where: { id: traderId } });
    await prisma.employee.delete({ where: { id: employeeId } });
    await prisma.admin.delete({ where: { id: adminId } });
    await prisma.$disconnect();
  });

  describe('POST /api/traders/offers', () => {
    it('should create a new offer', async () => {
      const res = await request(app)
        .post('/api/traders/offers')
        .set('Authorization', `Bearer ${traderToken}`)
        .send({
          title: 'Test Offer',
          description: 'Test offer description'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Offer');
      expect(res.body.data.status).toBe('DRAFT');
      
      offerId = res.body.data.id;
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/traders/offers')
        .send({
          title: 'Test Offer'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/offers', () => {
    it('should get active offers (public)', async () => {
      // First, validate the offer to make it active
      await prisma.offer.update({
        where: { id: offerId },
        data: {
          status: 'ACTIVE',
          validatedBy: employeeId,
          validatedAt: new Date()
        }
      });

      const res = await request(app)
        .get('/api/offers');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/employees/offers/:id/validate', () => {
    it('should validate an offer', async () => {
      // Create another offer for validation
      const newOffer = await prisma.offer.create({
        data: {
          traderId: traderId,
          title: 'Offer to Validate',
          status: 'PENDING_VALIDATION'
        }
      });

      const res = await request(app)
        .put(`/api/employees/offers/${newOffer.id}/validate`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          approved: true,
          validationNotes: 'All data verified'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');

      // Cleanup
      await prisma.offer.delete({ where: { id: newOffer.id } });
    });
  });
});



