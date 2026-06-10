# 火车票订购系统 - Docker 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装构建依赖（用于编译 better-sqlite3）
RUN apk add --no-cache python3 make g++

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV HOST_PORT=3000

# 启动应用
CMD ["node", "server.js"]
