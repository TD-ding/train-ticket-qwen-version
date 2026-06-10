/**
 * 用户认证路由
 * 处理用户注册、登录、获取用户信息等
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const Validator = require('../utils/validator');

const router = express.Router();

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', (req, res) => {
  const { username, password, realName, phone, email } = req.body;

  if (!username || !password) {
    return ApiResponse.error(res, '用户名和密码不能为空', 400);
  }

  if (!Validator.isValidUsername(username)) {
    return ApiResponse.error(res, '用户名格式错误（3-20位，只能包含字母、数字和下划线）', 400);
  }

  if (!Validator.isValidPassword(password)) {
    return ApiResponse.error(res, '密码长度至少6位', 400);
  }

  if (phone && !Validator.isValidPhone(phone)) {
    return ApiResponse.error(res, '手机号格式错误', 400);
  }

  if (email && !Validator.isValidEmail(email)) {
    return ApiResponse.error(res, '邮箱格式错误', 400);
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return ApiResponse.error(res, '用户名已存在', 400);
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (username, password, real_name, phone, email)
    VALUES (?, ?, ?, ?, ?)
  `).run(username, hashedPassword, realName || '', phone || '', email || '');

  return ApiResponse.created(res, { userId: result.lastInsertRowid }, '注册成功');
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return ApiResponse.error(res, '用户名和密码不能为空', 400);
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return ApiResponse.unauthorized(res, '用户名或密码错误');
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return ApiResponse.unauthorized(res, '用户名或密码错误');
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return ApiResponse.success(res, {
    token,
    user: {
      id: user.id,
      username: user.username,
      realName: user.real_name,
      role: user.role
    }
  }, '登录成功');
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, real_name, phone, email, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return ApiResponse.notFound(res, '用户不存在');
  }
  return ApiResponse.success(res, user);
});

module.exports = router;
