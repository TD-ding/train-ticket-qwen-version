/**
 * API 集成测试
 * 使用 Jest + supertest 测试所有后端 API
 */
const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
  let adminToken = '';
  let userToken = '';
  let testUserId = 0;
  let testOrderId = 0;
  let testUsername = '';

  beforeAll(async () => {
    // 登录管理员获取 token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = res.body.data.token;
  });

  describe('Auth API', () => {
    test('POST /api/auth/register - 成功注册', async () => {
      testUsername = 'testapi' + Date.now().toString().slice(-8);
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          password: 'test123456',
          realName: '测试用户',
          phone: '13900139001',
          email: 'testapi@example.com'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data.userId).toBeDefined();
      testUserId = res.body.data.userId;
    });

    test('POST /api/auth/register - 用户名重复', async () => {
      // 先注册一个用户，然后再次注册同名用户
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'dupuser', password: 'test123456' });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'dupuser', password: 'test123456' });
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(1);
      expect(res.body.message).toContain('已存在');
    });

    test('POST /api/auth/register - 用户名格式错误', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'test123456' });
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(1);
    });

    test('POST /api/auth/login - 成功登录', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUsername, password: 'test123456' });
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.token).toBeDefined();
      userToken = res.body.data.token;
    });

    test('POST /api/auth/login - 密码错误', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUsername, password: 'wrongpassword' });
      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe(401);
    });

    test('GET /api/auth/me - 获取当前用户信息', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.username).toBe(testUsername);
    });

    test('GET /api/auth/me - 无 token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.code).toBe(1);
    });

    test('PUT /api/auth/profile - 更新用户信息', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ realName: '新名字', phone: '13800138001' });
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
    });

    test('PUT /api/auth/password - 修改密码', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ oldPassword: 'test123456', newPassword: 'newpass123' });
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
    });
  });

  describe('Trains API', () => {
    test('GET /api/trains/search - 搜索列车', async () => {
      const res = await request(app)
        .get('/api/trains/search?from=北京&to=上海&date=2026-06-10');
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /api/trains/search - 缺少参数', async () => {
      const res = await request(app).get('/api/trains/search');
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(1);
    });

    test('GET /api/trains/popular - 热门路线', async () => {
      const res = await request(app).get('/api/trains/popular');
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /api/trains/meta/stations - 车站列表', async () => {
      const res = await request(app).get('/api/trains/meta/stations');
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /api/trains/:id - 列车详情', async () => {
      const res = await request(app).get('/api/trains/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.train_no).toBeDefined();
    });

    test('GET /api/trains/:id - 不存在的列车', async () => {
      const res = await request(app).get('/api/trains/9999');
      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe(404);
    });
  });

  describe('Orders API', () => {
    test('POST /api/orders - 创建订单', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trainId: 1,
          seatType: 'hard_seat',
          passengerName: '测试乘客',
          passengerId: '110101199001011234'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.code).toBe(0);
      expect(res.body.data.orderId).toBeDefined();
      testOrderId = res.body.data.orderId;
    });

    test('POST /api/orders - 无效座位类型', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trainId: 1,
          seatType: 'invalid_type',
          passengerName: '测试乘客'
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(1);
    });

    test('GET /api/orders - 获取订单列表', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /api/orders/:id - 获取订单详情', async () => {
      const res = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
    });

    test('POST /api/orders/:id/pay - 支付订单', async () => {
      const res = await request(app)
        .post(`/api/orders/${testOrderId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
    });

    test('POST /api/orders/:id/pay - 重复支付', async () => {
      const res = await request(app)
        .post(`/api/orders/${testOrderId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe(1);
    });

    test('GET /api/orders/stats - 订单统计', async () => {
      const res = await request(app)
        .get('/api/orders/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.total_orders).toBeDefined();
    });
  });

  describe('Admin API', () => {
    test('GET /api/admin/stats - 管理统计', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(res.body.data.totalTrains).toBeDefined();
    });

    test('GET /api/admin/stats/revenue - 收入统计', async () => {
      const res = await request(app)
        .get('/api/admin/stats/revenue?days=30')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
    });

    test('GET /api/admin/trains - 列车列表', async () => {
      const res = await request(app)
        .get('/api/admin/trains')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('POST /api/admin/trains - 添加列车', async () => {
      const res = await request(app)
        .post('/api/admin/trains')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          trainNo: 'TEST' + Date.now().toString().slice(-6),
          departureStation: '测试站A',
          arrivalStation: '测试站B',
          departureTime: '10:00',
          arrivalTime: '12:00',
          priceHardSeat: 100,
          priceHardSleeper: 200,
          priceSoftSleeper: 300,
          totalSeats: 100,
          date: '2026-06-15'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.code).toBe(0);
    });

    test('GET /api/admin/orders - 所有订单', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /api/admin/users - 用户列表', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(0);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /api/admin/stats - 普通用户无权限', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe(1);
    });
  });
});
