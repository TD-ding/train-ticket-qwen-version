# 火车票订购系统

一个完整的火车票在线订购系统，包含前端 SPA、后端 RESTful API、管理后台。

## 功能特性

- 用户注册/登录（JWT 认证）
- 列车搜索与查询（按车站、日期）
- 在线购票（硬座/硬卧/软卧）
- 订单管理（支付/取消）
- 管理后台（列车管理、订单统计、用户管理）
- 热门路线推荐
- 响应式设计（支持移动端）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JavaScript (SPA) |
| 后端 | Node.js + Express.js |
| 数据库 | SQLite (better-sqlite3, WAL mode) |
| 认证 | JWT + bcryptjs |
| 测试 | Jest + supertest |
| 部署 | Docker + Docker Compose + GitHub Actions |

## 快速开始

### 本地运行

```bash
npm install
npm start
```

访问 http://localhost:3000

默认管理员账号：`admin` / `admin123`

### Docker 运行

```bash
docker-compose up -d
```

## 项目结构

```
train-ticket-system/
├── server.js              # 服务入口
├── db/
│   └── database.js        # 数据库初始化
├── routes/                # API 路由
│   ├── auth.js            # 认证
│   ├── trains.js          # 列车查询
│   ├── orders.js          # 订单管理
│   └── admin.js           # 管理后台
├── middleware/
│   └── auth.js            # JWT 中间件
├── utils/
│   ├── response.js        # 统一响应
│   └── validator.js       # 输入验证
├── public/                # 前端静态文件
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js         # 应用核心
│       ├── api.js         # API 客户端
│       ├── auth.js        # 认证模块
│       ├── search.js      # 搜索模块
│       ├── orders.js      # 订单模块
│       └── admin.js       # 管理模块
├── tests/
│   └── api.test.js        # API 测试 (29 tests)
├── docs/
│   ├── frontend.md        # 前端文档
│   ├── backend.md         # 后端文档
│   └── deployment.md      # 部署文档
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## API 概览

所有 API 返回统一格式：`{ code: 0, message: '', data: {} }`

| 模块 | 端点 | 说明 |
|------|------|------|
| 认证 | `POST /api/auth/register` | 注册 |
| 认证 | `POST /api/auth/login` | 登录 |
| 列车 | `GET /api/trains/search` | 搜索列车 |
| 列车 | `GET /api/trains/popular` | 热门路线 |
| 订单 | `POST /api/orders` | 创建订单 |
| 订单 | `POST /api/orders/:id/pay` | 支付订单 |
| 管理 | `GET /api/admin/stats` | 管理统计 |

详细 API 文档见 [docs/backend.md](docs/backend.md)

## 测试

```bash
npm test
```

## 文档

- [前端开发文档](docs/frontend.md)
- [后端开发文档](docs/backend.md)
- [部署文档](docs/deployment.md)
- [开发日志](collab-log.md)

## 许可证

MIT
