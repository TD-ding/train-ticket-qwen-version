/**
 * 列车查询路由
 * 处理列车搜索、详情查询等
 */
const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * 搜索列车
 * GET /api/trains/search?from=北京&to=上海&date=2026-06-10
 */
router.get('/search', (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: '出发站和到达站不能为空' });
  }

  let sql = 'SELECT * FROM trains WHERE departure_station = ? AND arrival_station = ? AND status = ?';
  const params = [from, to, 'active'];

  if (date) {
    sql += ' AND date = ?';
    params.push(date);
  }

  sql += ' ORDER BY departure_time ASC';

  const trains = db.prepare(sql).all(...params);
  res.json(trains);
});

/**
 * 获取列车详情
 * GET /api/trains/:id
 */
router.get('/:id', (req, res) => {
  const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(req.params.id);
  if (!train) {
    return res.status(404).json({ error: '列车不存在' });
  }
  res.json(train);
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
  res.json(stations.map(s => s.station));
});

module.exports = router;
