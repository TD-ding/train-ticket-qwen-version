/**
 * JWT 认证中间件
 * 验证请求头中的 Bearer Token
 * 区分普通用户和管理员权限
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

/**
 * 验证用户身份（必须登录）
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ code: 1, message: '请先登录', data: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ code: 1, message: '登录已过期，请重新登录', data: null });
  }
}

/**
 * 验证管理员权限（必须是管理员角色）
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ code: 1, message: '需要管理员权限', data: null });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };
