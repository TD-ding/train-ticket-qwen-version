/**
 * 列车查询路由
 * 处理列车搜索、详情查询等
 */
const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const ApiResponse = require('../utils/response');
const Validator = require('../utils/validator');

const router = express.Router();

/**
 * 搜索列车
 * GET /api/trains/search?from=北京&to=上海&date=2026-06-10
 */
router.get('/search', (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to) {
    return ApiResponse.error(res, '出发站和到达站不能为空', 400);
  }

  if (date && !Validator.isValidDate(date)) {
    return ApiResponse.error(res, '日期格式错误', 400);
  }

  let sql = 'SELECT * FROM trains WHERE departure_station = ? AND arrival_station = ? AND status = ?';
  const params = [from, to, 'active'];

  if (date) {
    sql += ' AND date = ?';
    params.push(date);
  }

  sql += ' ORDER BY departure_time ASC';

  const trains = db.prepare(sql).all(...params);
  return ApiResponse.success(res, trains);
});

/**
 * 获取列车详情
 * GET /api/trains/:id
 */
router.get('/:id', (req, res) => {
  const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(req.params.id);
  if (!train) {
    return ApiResponse.notFound(res, '列车不存在');
  }
  return ApiResponse.success(res, train);
});

/**
 * 获取所有车站列表
 * GET /api/trains/meta/stations
 */
router.get('/meta/stations', (req, res) => {
  const stations = db.prepare(`
    SELECT DISTINCT departure_station as station FROM trains
    UNION
    SELECT DISTINCT arrival_station as station FROM trains
    ORDER BY station
  `).all();
  return ApiResponse.success(res, stations.map(s => s.station));
});

module.exports = router;
