# 后端开发文档

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (jsonwebtoken)
- **加密**: bcryptjs
- **验证**: 自定义 Validator 类

## 项目结构

```
train-ticket-system/
├── server.js              # 应用入口
├── db/
│   └── database.js        # 数据库初始化和迁移
├── routes/
│   ├── auth.js            # 认证路由
│   ├── trains.js          # 列车查询路由
│   ├── orders.js          # 订单管理路由
│   └── admin.js           # 管理后台路由
├── middleware/
│   └── auth.js            # JWT 认证中间件
├── utils/
│   ├── response.js        # API 响应封装
│   └── validator.js       # 输入验证工具
└── tests/
    └── api.test.js        # API 集成测试
```

## 数据库设计

### users 表

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  real_name TEXT,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### trains 表

```sql
CREATE TABLE trains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  train_no TEXT NOT NULL,
  departure_station TEXT NOT NULL,
  arrival_station TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  price_hard_seat REAL DEFAULT 0,
  price_hard_sleeper REAL DEFAULT 0,
  price_soft_sleeper REAL DEFAULT 0,
  total_seats INTEGER DEFAULT 100,
  available_seats INTEGER DEFAULT 100,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### orders 表

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  train_id INTEGER NOT NULL,
  seat_type TEXT NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_id TEXT,
  price REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (train_id) REFERENCES trains(id)
);
```

## API 接口

### 认证接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | ❌ |
| POST | `/api/auth/login` | 用户登录 | ❌ |
| GET | `/api/auth/me` | 获取当前用户 | ✅ |
| PUT | `/api/auth/profile` | 更新用户信息 | ✅ |
| PUT | `/api/auth/password` | 修改密码 | ✅ |

### 列车接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/trains/search` | 搜索列车 | ❌ |
| GET | `/api/trains/:id` | 列车详情 | ❌ |
| GET | `/api/trains/popular` | 热门路线 | ❌ |
| GET | `/api/trains/meta/stations` | 车站列表 | ❌ |

### 订单接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/orders` | 创建订单 | ✅ |
| GET | `/api/orders` | 获取订单列表 | ✅ |
| GET | `/api/orders/:id` | 订单详情 | ✅ |
| POST | `/api/orders/:id/pay` | 支付订单 | ✅ |
| POST | `/api/orders/:id/cancel` | 取消订单 | ✅ |
| GET | `/api/orders/stats` | 订单统计 | ✅ |

### 管理接口

| 方法 | 路径 | 描述 | 认证 | 权限 |
|------|------|------|------|------|
| GET | `/api/admin/stats` | 管理统计 | ✅ | admin |
| GET | `/api/admin/stats/revenue` | 收入统计 | ✅ | admin |
| GET | `/api/admin/trains` | 列车列表 | ✅ | admin |
| POST | `/api/admin/trains` | 添加列车 | ✅ | admin |
| PUT | `/api/admin/trains/:id` | 更新列车 | ✅ | admin |
| GET | `/api/admin/orders` | 所有订单 | ✅ | admin |
| GET | `/api/admin/users` | 用户列表 | ✅ | admin |

## 认证机制

### JWT Token 流程

1. 用户登录成功，服务端生成 JWT token
2. 客户端存储 token 到 localStorage
3. 每次请求在 Authorization header 携带 token
4. 中间件验证 token 有效性和用户角色

### Token 格式

```javascript
{
  id: 1,
  username: 'admin',
  role: 'admin',
  iat: 1718000000,
  exp: 1718086400  // 24小时有效期
}
```

### 中间件

```javascript
// authenticateToken - 验证 token
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ code: 1, message: '请先登录' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ code: 1, message: '登录已过期' });
    req.user = decoded;
    next();
  });
}

// requireAdmin - 验证管理员权限
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 1, message: '无权限访问' });
  }
  next();
}
```

## 统一响应格式

所有 API 返回统一的 JSON 格式：

```javascript
{
  code: 0,           // 0 表示成功，非 0 表示失败
  message: '成功',   // 响应消息
  data: { ... }      // 响应数据
}
```

### ApiResponse 工具类

```javascript
ApiResponse.success(res, data, message)     // 成功响应 (200)
ApiResponse.created(res, data, message)     // 创建成功 (201)
ApiResponse.error(res, message, status)     // 错误响应
ApiResponse.notFound(res, message)          // 未找到 (404)
ApiResponse.serverError(res, message)       // 服务器错误 (500)
```

## 输入验证

使用 Validator 类验证输入数据：

```javascript
Validator.isValidUsername(username)  // 3-20位字母数字下划线
Validator.isValidPassword(password)  // 至少6位
Validator.isValidEmail(email)        // 邮箱格式
Validator.isValidPhone(phone)        // 手机号格式
Validator.isValidIdCard(idCard)      // 身份证号格式
Validator.isValidDate(dateStr)       // YYYY-MM-DD
Validator.isValidTime(timeStr)       // HH:MM
Validator.isPositiveInteger(value)   // 正整数
Validator.isNonNegativeNumber(value) // 非负数
```

## 数据库事务

订单创建和取消使用事务保证数据一致性：

```javascript
const createOrder = db.transaction(() => {
  // 1. 检查列车状态和余票
  const train = db.prepare('SELECT * FROM trains WHERE id = ? AND status = ?').get(trainId, 'active');
  if (!train || train.available_seats <= 0) {
    throw new Error('列车不存在或已无余票');
  }
  
  // 2. 创建订单
  const result = db.prepare('INSERT INTO orders ...').run(...);
  
  // 3. 扣减余票
  db.prepare('UPDATE trains SET available_seats = available_seats - 1 WHERE id = ?').run(trainId);
  
  return { orderId: result.lastInsertRowid };
});

try {
  const orderData = createOrder();
  // 返回成功响应
} catch (err) {
  // 事务自动回滚
  return ApiResponse.error(res, err.message, 400);
}
```

## 错误处理

### 全局错误中间件

```javascript
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 1,
    message: '服务器内部错误',
    data: null
  });
});
```

### 常见错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 安全实践

### 1. 密码加密

使用 bcrypt 哈希密码：

```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = bcrypt.hashSync(password, 10);
const isValid = bcrypt.compareSync(inputPassword, hashedPassword);
```

### 2. SQL 注入防护

使用参数化查询：

```javascript
// ✅ 安全
db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

// ❌ 危险
db.prepare(`SELECT * FROM users WHERE id = ${userId}`).get();
```

### 3. XSS 防护

前端转义用户输入，后端不返回原始 HTML。

### 4. CORS 配置

```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

### 5. 请求限流

```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

## 测试

使用 Jest + supertest 进行 API 测试：

```javascript
test('POST /api/auth/login - 成功登录', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  
  expect(res.statusCode).toBe(200);
  expect(res.body.code).toBe(0);
  expect(res.body.data.token).toBeDefined();
});
```

运行测试：

```bash
npm test
```

## 部署

### 环境变量

```bash
NODE_ENV=production
HOST_PORT=3000
JWT_SECRET=your-secret-key-change-in-production
ALLOWED_ORIGINS=https://your-domain.com
```

### 生产环境启动

```bash
node server.js
```

### Docker 部署

```bash
docker build -t train-ticket-system .
docker run -p 3000:3000 -v $(pwd)/data:/app/data train-ticket-system
```

## 性能优化

1. **数据库索引**: 为常用查询字段添加索引
2. **连接池**: SQLite 使用 WAL 模式提高并发性能
3. **缓存**: 热门路线、车站列表等静态数据缓存
4. **压缩**: 使用 gzip 压缩响应体

## 日志

使用 console.log 记录关键操作：

```javascript
console.log(`用户 ${userId} 创建订单 ${orderId}`);
console.error('数据库查询失败:', err);
```

生产环境建议使用 winston 或 pino 日志库。

## 监控

建议集成：

- **PM2**: 进程管理和监控
- **Prometheus**: 指标收集
- **Grafana**: 数据可视化

## 扩展性

当前架构适合单体应用，如需扩展：

1. **数据库**: 迁移到 PostgreSQL/MySQL
2. **缓存**: 添加 Redis
3. **消息队列**: 使用 RabbitMQ/Kafka
4. **微服务**: 拆分认证、订单、列车等模块
