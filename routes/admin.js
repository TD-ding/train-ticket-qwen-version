/**
 * 管理员路由
 * 处理列车管理、订单管理、用户管理等管理功能
 */
const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const Validator = require('../utils/validator');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

/**
 * 获取所有列车
 * GET /api/admin/trains
 */
router.get('/trains', (req, res) => {
  const trains = db.prepare('SELECT * FROM trains ORDER BY date DESC, departure_time ASC').all();
  return ApiResponse.success(res, trains);
});

/**
 * 添加列车
 * POST /api/admin/trains
 */
router.post('/trains', (req, res) => {
  const {
    trainNo, departureStation, arrivalStation, departureTime, arrivalTime,
    priceHardSeat, priceHardSleeper, priceSoftSleeper, totalSeats, date
  } = req.body;

  if (!trainNo || !departureStation || !arrivalStation || !date) {
    return ApiResponse.error(res, '缺少必要参数', 400);
  }

  if (!Validator.isValidDate(date)) {
    return ApiResponse.error(res, '日期格式错误', 400);
  }

  if (departureTime && !Validator.isValidTime(departureTime)) {
    return ApiResponse.error(res, '出发时间格式错误', 400);
  }

  if (arrivalTime && !Validator.isValidTime(arrivalTime)) {
    return ApiResponse.error(res, '到达时间格式错误', 400);
  }

  if (priceHardSeat && !Validator.isNonNegativeNumber(priceHardSeat)) {
    return ApiResponse.error(res, '硬座价格必须为非负数', 400);
  }

  if (priceHardSleeper && !Validator.isNonNegativeNumber(priceHardSleeper)) {
    return ApiResponse.error(res, '硬卧价格必须为非负数', 400);
  }

  if (priceSoftSleeper && !Validator.isNonNegativeNumber(priceSoftSleeper)) {
    return ApiResponse.error(res, '软卧价格必须为非负数', 400);
  }

  if (totalSeats && !Validator.isPositiveInteger(totalSeats)) {
    return ApiResponse.error(res, '总座位数必须为正整数', 400);
  }

  const existing = db.prepare('SELECT id FROM trains WHERE train_no = ? AND date = ?').get(trainNo, date);
  if (existing) {
    return ApiResponse.error(res, '该日期已存在相同车次', 400);
  }

  const result = db.prepare(`
    INSERT INTO trains (train_no, departure_station, arrival_station, departure_time, arrival_time,
      price_hard_seat, price_hard_sleeper, price_soft_sleeper, total_seats, available_seats, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    trainNo, departureStation, arrivalStation, departureTime || '00:00', arrivalTime || '00:00',
    priceHardSeat || 0, priceHardSleeper || 0, priceSoftSleeper || 0,
    totalSeats || 100, totalSeats || 100, date
  );

  return ApiResponse.created(res, { trainId: result.lastInsertRowid }, '列车添加成功');
});

/**
 * 更新列车
 * PUT /api/admin/trains/:id
 */
router.put('/trains/:id', (req, res) => {
  const { status } = req.body;
  const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(req.params.id);

  if (!train) {
    return ApiResponse.notFound(res, '列车不存在');
  }

  const validStatuses = ['active', 'cancelled', 'completed'];
  if (status && !validStatuses.includes(status)) {
    return ApiResponse.error(res, '无效的状态值', 400);
  }

  if (status) {
    db.prepare('UPDATE trains SET status = ? WHERE id = ?').run(status, train.id);
  }

  return ApiResponse.success(res, null, '列车更新成功');
});

/**
 * 获取所有订单
 * GET /api/admin/orders
 */
router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, t.train_no, u.username, u.real_name as user_real_name
    FROM orders o
    JOIN trains t ON o.train_id = t.id
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `).all();
  return ApiResponse.success(res, orders);
});

/**
 * 获取所有用户
 * GET /api/admin/users
 */
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, username, real_name, phone, email, role, created_at FROM users ORDER BY created_at DESC').all();
  return ApiResponse.success(res, users);
});

/**
 * 获取统计数据
 * GET /api/admin/stats
 */
router.get('/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('user');
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE status = 'paid'").get();
  const totalTrains = db.prepare('SELECT COUNT(*) as count FROM trains').get();

  return ApiResponse.success(res, {
    totalUsers: totalUsers.count,
    totalOrders: totalOrders.count,
    totalRevenue: totalRevenue.total,
    totalTrains: totalTrains.count
  });
});

/**
 * 获取收入统计（按日期）
 * GET /api/admin/stats/revenue
 */
router.get('/stats/revenue', (req, res) => {
  const { days = 30 } = req.query;
  const revenue = db.prepare(`
    SELECT
      DATE(paid_at) as date,
      COUNT(*) as order_count,
      SUM(price) as revenue
    FROM orders
    WHERE status = 'paid' AND paid_at >= date('now', '-${parseInt(days)} days')
    GROUP BY DATE(paid_at)
    ORDER BY date DESC
  `).all();

  return ApiResponse.success(res, revenue);
});

/**
 * 批量更新列车状态
 * PUT /api/admin/trains/batch/status
 */
router.put('/trains/batch/status', (req, res) => {
  const { trainIds, status } = req.body;

  if (!Array.isArray(trainIds) || trainIds.length === 0) {
    return ApiResponse.error(res, '请提供列车ID列表', 400);
  }

  const validStatuses = ['active', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return ApiResponse.error(res, '无效的状态值', 400);
  }

  const placeholders = trainIds.map(() => '?').join(',');
  const result = db.prepare(`UPDATE trains SET status = ? WHERE id IN (${placeholders})`).run(status, ...trainIds);

  return ApiResponse.success(res, { updated: result.changes }, '批量更新成功');
});

module.exports = router;
