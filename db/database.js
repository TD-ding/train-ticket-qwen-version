/**
 * 数据库初始化模块
 * 使用 better-sqlite3 创建 SQLite 数据库
 * 包含用户、列车、订单三张核心表
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'train_ticket.db');
const db = new Database(dbPath);

// 启用 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 创建表结构
db.exec(`
  -- 用户表：存储所有用户信息（普通用户和管理员）
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    real_name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 列车表：存储列车班次信息
  CREATE TABLE IF NOT EXISTS trains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_no TEXT UNIQUE NOT NULL,
    departure_station TEXT NOT NULL,
    arrival_station TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    price_hard_seat REAL NOT NULL DEFAULT 0,
    price_hard_sleeper REAL NOT NULL DEFAULT 0,
    price_soft_sleeper REAL NOT NULL DEFAULT 0,
    total_seats INTEGER NOT NULL DEFAULT 100,
    available_seats INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'completed')),
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 订单表：存储用户购票订单
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    train_id INTEGER NOT NULL,
    seat_type TEXT NOT NULL CHECK(seat_type IN ('hard_seat', 'hard_sleeper', 'soft_sleeper')),
    passenger_name TEXT NOT NULL,
    passenger_id TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled', 'refunded')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (train_id) REFERENCES trains(id)
  );
`);

/**
 * 初始化默认管理员账号
 * 仅在数据库中不存在管理员时创建
 */
function initDefaultAdmin() {
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');

  if (adminExists.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, real_name, phone, email, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, '系统管理员', '13800000000', 'admin@train.com', 'admin');
    console.log('默认管理员已创建: admin / admin123');
  }
}

/**
 * 初始化示例列车数据
 * 仅在列车表为空时插入
 */
function initSampleTrains() {
  const trainCount = db.prepare('SELECT COUNT(*) as count FROM trains').get();

  if (trainCount.count === 0) {
    // 格式: [车次, 出发站, 到达站, 出发时间, 到达时间, 硬座价, 硬卧价, 软卧价, 总座位, 余票, 日期]
    const sampleTrains = [
      ['G1001', '北京', '上海', '08:00', '13:30', 553, 865, 1240, 600, 600, '2026-06-10'],
      ['G1002', '上海', '北京', '14:00', '19:30', 553, 865, 1240, 600, 600, '2026-06-10'],
      ['D2001', '北京', '广州', '09:00', '20:30', 380, 620, 950, 800, 800, '2026-06-10'],
      ['D2002', '广州', '北京', '10:00', '21:30', 380, 620, 950, 800, 800, '2026-06-10'],
      ['K301', '北京', '成都', '15:00', '12:00', 236, 420, 680, 1000, 1000, '2026-06-10'],
      ['K302', '成都', '北京', '16:00', '13:00', 236, 420, 680, 1000, 1000, '2026-06-10'],
      ['G5001', '北京', '深圳', '07:30', '16:00', 680, 1050, 1500, 500, 500, '2026-06-11'],
      ['G5002', '深圳', '北京', '08:30', '17:00', 680, 1050, 1500, 500, 500, '2026-06-11'],
      ['D3001', '上海', '杭州', '06:00', '07:00', 73, 0, 0, 1200, 1200, '2026-06-10'],
      ['D3002', '杭州', '上海', '22:00', '23:00', 73, 0, 0, 1200, 1200, '2026-06-10']
    ];

    const insertStmt = db.prepare(`
      INSERT INTO trains (train_no, departure_station, arrival_station, departure_time, arrival_time,
        price_hard_seat, price_hard_sleeper, price_soft_sleeper, total_seats, available_seats, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((trains) => {
      for (const t of trains) {
        insertStmt.run(...t);
      }
    });

    insertMany(sampleTrains);
    console.log('示例列车数据已初始化');
  }
}

// 执行初始化
initDefaultAdmin();
initSampleTrains();

module.exports = db;
