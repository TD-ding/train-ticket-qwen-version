# 部署文档

本文档介绍如何将火车票订购系统部署到生产环境。

## 部署方式

提供以下三种部署方式：

1. **直接部署** — 适合开发和小型生产环境
2. **Docker 部署** — 推荐的标准化部署方式
3. **Docker Compose 部署** — 最简便的一键部署方式

## 方式一：直接部署

### 环境要求

- Node.js 18+ 或 20+
- npm 8+
- 至少 512MB 内存
- 1GB 磁盘空间

### 步骤

1. **克隆代码**

```bash
git clone <repository-url>
cd train-ticket-system
```

2. **安装依赖**

```bash
npm install --production
```

3. **配置环境变量**

创建 `.env` 文件：

```env
NODE_ENV=production
HOST_PORT=3000
JWT_SECRET=your-production-secret-key-at-least-32-chars
```

4. **启动服务**

```bash
node server.js
```

或使用 PM2 进行进程管理：

```bash
npm install -g pm2
pm2 start server.js --name train-ticket
pm2 save
pm2 startup
```

## 方式二：Docker 部署

### 环境要求

- Docker 20+

### 步骤

1. **构建镜像**

```bash
docker build -t train-ticket-system:latest .
```

2. **运行容器**

```bash
docker run -d \
  --name train-ticket \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e JWT_SECRET=your-production-secret \
  -e NODE_ENV=production \
  --restart unless-stopped \
  train-ticket-system:latest
```

3. **验证部署**

```bash
curl http://localhost:3000/api/trains/popular
```

### 常用 Docker 命令

```bash
# 查看日志
docker logs -f train-ticket

# 停止容器
docker stop train-ticket

# 重启容器
docker restart train-ticket

# 更新镜像
docker pull train-ticket-system:latest
docker stop train-ticket
docker rm train-ticket
# 重新运行步骤 2
```

## 方式三：Docker Compose 部署

### 环境要求

- Docker 20+
- Docker Compose 2+

### 步骤

1. **创建 `.env` 文件**

```env
JWT_SECRET=your-production-secret-key-at-least-32-chars
```

2. **启动服务**

```bash
docker-compose up -d
```

3. **验证部署**

```bash
docker-compose ps
curl http://localhost:3000/api/trains/popular
```

4. **查看日志**

```bash
docker-compose logs -f
```

5. **停止服务**

```bash
docker-compose down
```

## 反向代理配置

生产环境建议使用 Nginx 作为反向代理。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 请求
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 限流
        limit_req zone=api burst=20 nodelay;
    }

    # 其他请求
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 限流区域
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
```

## 安全加固

### 1. 修改 JWT 密钥

生产环境必须修改 `JWT_SECRET`，建议使用 32 字符以上的随机字符串：

```bash
openssl rand -hex 32
```

### 2. 启用 HTTPS

使用 Let's Encrypt 免费证书：

```bash
certbot certonly --nginx -d your-domain.com
```

### 3. 防火墙配置

```bash
# Ubuntu/Debian
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 4. 数据库备份

SQLite 数据库文件位于 `data/` 目录，定期备份：

```bash
# 每日备份脚本
#!/bin/bash
BACKUP_DIR="/backup/train-ticket"
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR
sqlite3 data/train_ticket.db ".backup $BACKUP_DIR/backup_$DATE.db"
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
```

建议添加到 crontab：

```cron
0 2 * * * /path/to/backup.sh
```

## 监控

### 健康检查

```bash
curl -f http://localhost:3000/api/trains/popular
```

### PM2 监控

```bash
pm2 monit
pm2 logs
```

### Docker 健康检查

Docker Compose 已内置健康检查，可通过以下命令查看：

```bash
docker inspect --format='{{.State.Health.Status}}' train-ticket-app
```

## 性能调优

### Node.js

```bash
# 增加内存限制
node --max-old-space-size=2048 server.js
```

### SQLite

数据库初始化时已启用 WAL 模式，适合并发读取场景。

### Nginx

```nginx
worker_processes auto;
worker_connections 1024;
```

## 升级

```bash
# 1. 备份数据库
cp data/train_ticket.db data/train_ticket.db.bak

# 2. 拉取新代码
git pull

# 3. 安装新依赖
npm install --production

# 4. 重启服务
pm2 restart train-ticket
# 或
docker-compose restart
```

## 故障排除

### 问题：服务无法启动

```bash
# 检查端口占用
netstat -tlnp | grep 3000

# 查看日志
docker-compose logs
pm2 logs
```

### 问题：数据库被锁定

```bash
# 停止服务，删除 WAL 文件
docker-compose stop
rm -f data/train_ticket.db-wal data/train_ticket.db-shm
docker-compose start
```

### 问题：内存泄漏

```bash
# 使用 PM2 自动重启
pm2 start server.js --max-memory-restart 500M
```

## CI/CD

本项目配置了 GitHub Actions 工作流（`.github/workflows/ci.yml`）：

- **push/PR 到 main** — 自动运行测试
- **合并到 main** — 自动构建 Docker 镜像并验证

## 生产部署检查清单

- [ ] 修改 JWT_SECRET 为随机字符串
- [ ] 配置 HTTPS
- [ ] 设置数据库定期备份
- [ ] 配置防火墙规则
- [ ] 配置 Nginx 反向代理
- [ ] 验证健康检查端点
- [ ] 配置日志收集
- [ ] 设置监控告警
