/**
 * 订单管理路由
 * 处理订单创建、查询、支付、取消等
 */
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const Validator = require('../utils/validator');

const router = express.Router();

/**
 * 创建订单（购票）
 * POST /api/orders
 */
router.post('/', authenticateToken, (req, res) => {
  const { trainId, seatType, passengerName, passengerId } = req.body;

  if (!trainId || !seatType || !passengerName) {
    return ApiResponse.error(res, '缺少必要参数', 400);
  }

  if (passengerId && !Validator.isValidIdCard(passengerId)) {
    return ApiResponse.error(res, '身份证号格式错误', 400);
  }

  const validSeatTypes = ['hard_seat', 'hard_sleeper', 'soft_sleeper'];
  if (!validSeatTypes.includes(seatType)) {
    return ApiResponse.error(res, '无效的座位类型', 400);
  }

  // 使用事务保证数据一致性
  const createOrder = db.transaction(() => {
    const train = db.prepare('SELECT * FROM trains WHERE id = ? AND status = ?').get(trainId, 'active');
    if (!train) {
      throw new Error('列车不存在或已取消');
    }

    if (train.available_seats <= 0) {
      throw new Error('该列车已无余票');
    }

    let price = 0;
    if (seatType === 'hard_seat') price = train.price_hard_seat;
    else if (seatType === 'hard_sleeper') price = train.price_hard_sleeper;
    else if (seatType === 'soft_sleeper') price = train.price_soft_sleeper;

    const orderNo = uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase();

    const result = db.prepare(`
      INSERT INTO orders (order_no, user_id, train_id, seat_type, passenger_name, passenger_id, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(orderNo, req.user.id, trainId, seatType, passengerName, passengerId || '', price);

    db.prepare('UPDATE trains SET available_seats = available_seats - 1 WHERE id = ?').run(trainId);

    return { orderId: result.lastInsertRowid, orderNo, price };
  });

  try {
    const orderData = createOrder();
    return ApiResponse.created(res, orderData, '订单创建成功');
  } catch (err) {
    return ApiResponse.error(res, err.message, 400);
  }
});

/**
 * 获取当前用户的订单列表
 * GET /api/orders
 */
router.get('/', authenticateToken, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, t.train_no, t.departure_station, t.arrival_station, t.departure_time, t.arrival_time, t.date
    FROM orders o
    JOIN trains t ON o.train_id = t.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id);
  return ApiResponse.success(res, orders);
});

/**
 * 获取订单详情
 * GET /api/orders/:id
 */
router.get('/:id', authenticateToken, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, t.train_no, t.departure_station, t.arrival_station, t.departure_time, t.arrival_time, t.date
    FROM orders o
    JOIN trains t ON o.train_id = t.id
    WHERE o.id = ? AND o.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!order) {
    return ApiResponse.notFound(res, '订单不存在');
  }
  return ApiResponse.success(res, order);
});

/**
 * 支付订单
 * POST /api/orders/:id/pay
 */
router.post('/:id/pay', authenticateToken, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!order) {
    return ApiResponse.notFound(res, '订单不存在');
  }

  if (order.status !== 'pending') {
    return ApiResponse.error(res, '订单状态不允许支付', 400);
  }

  db.prepare(`
    UPDATE orders SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(order.id);

  return ApiResponse.success(res, null, '支付成功');
});

/**
 * 取消订单
 * POST /api/orders/:id/cancel
 */
router.post('/:id/cancel', authenticateToken, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (!order) {
    return ApiResponse.notFound(res, '订单不存在');
  }

  if (order.status === 'cancelled') {
    return ApiResponse.error(res, '订单已取消', 400);
  }

  // 使用事务保证数据一致性
  const cancelOrder = db.transaction(() => {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('cancelled', order.id);
    db.prepare('UPDATE trains SET available_seats = available_seats + 1 WHERE id = ?').run(order.train_id);
  });

  try {
    cancelOrder();
    return ApiResponse.success(res, null, '订单已取消');
  } catch (err) {
    return ApiResponse.serverError(res, '取消订单失败');
  }
});

module.exports = router;
