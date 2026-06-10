# 前端开发文档

## 技术栈

- **框架**: 原生 JavaScript (Vanilla JS)
- **样式**: CSS3 + CSS Variables
- **架构**: SPA (单页应用)
- **API 通信**: Fetch API + async/await

## 项目结构

```
public/
├── index.html          # 主 HTML 文件
├── css/
│   └── style.css       # 全局样式
└── js/
    ├── app.js          # 应用入口和核心功能
    ├── api.js          # API 客户端封装
    ├── auth.js         # 认证模块
    ├── search.js       # 列车搜索模块
    ├── orders.js       # 订单管理模块
    └── admin.js        # 管理后台模块
```

## 核心模块

### 1. App 模块 (`app.js`)

应用的核心控制器，负责：

- **页面路由管理**: 根据 URL hash 切换页面
- **用户状态管理**: 登录状态、用户信息
- **全局 UI 工具**: Loading、Toast 提示、模态框
- **XSS 防护**: 转义用户输入防止跨站脚本攻击

关键方法：

```javascript
App.switchPage(pageName)    // 切换页面
App.showLoading(msg)        // 显示加载提示
App.hideLoading()           // 隐藏加载提示
App.showToast(msg, type)    // 显示消息提示
App.escapeHtml(str)         // 转义 HTML 特殊字符
```

### 2. API 客户端 (`api.js`)

封装所有后端 API 调用：

```javascript
API.auth.login(data)        // 用户登录
API.auth.register(data)     // 用户注册
API.trains.search(params)   // 搜索列车
API.orders.list()           // 获取订单列表
API.orders.create(data)     // 创建订单
API.admin.getStats()        // 获取管理统计
```

**错误处理**:
- 统一捕获 HTTP 错误和业务错误
- 自动处理 token 过期（跳转登录页）
- 返回标准化的错误信息

### 3. Auth 模块 (`auth.js`)

处理用户认证相关功能：

- 登录表单提交
- 注册表单验证
- 用户信息展示
- 登出功能

### 4. Search 模块 (`search.js`)

列车搜索功能：

- 车站下拉选择
- 日期选择器
- 搜索结果展示
- 热门路线快捷搜索

### 5. Orders 模块 (`orders.js`)

用户订单管理：

- 订单列表展示（带状态筛选）
- 订单统计信息
- 支付订单
- 取消订单

### 6. Admin 模块 (`admin.js`)

管理后台功能：

- 数据统计仪表板
- 列车管理（添加、编辑状态）
- 订单管理
- 用户管理

## 页面结构

应用包含 5 个主要页面：

1. **首页** (`#page-home`): 搜索入口和热门路线
2. **登录页** (`#page-login`): 用户登录
3. **注册页** (`#page-register`): 用户注册
4. **订单页** (`#page-orders`): 用户订单管理
5. **管理页** (`#page-admin`): 管理后台（仅管理员可见）

## 样式规范

使用 CSS Variables 定义主题色：

```css
:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --danger-color: #ff4d4f;
  --warning-color: #faad14;
  --text-primary: #333;
  --text-secondary: #666;
  --border-color: #e8e8e8;
}
```

## 响应式设计

- **移动端**: < 768px（单列布局）
- **平板**: 768px - 1024px（双列布局）
- **桌面端**: > 1024px（多列布局）

## 安全实践

1. **XSS 防护**: 所有用户输入使用 `escapeHtml()` 转义
2. **Token 管理**: JWT 存储在 localStorage，每次请求带 Authorization header
3. **权限控制**: 前端根据用户角色显示/隐藏管理功能
4. **表单验证**: 前端验证减少无效请求

## 开发指南

### 添加新页面

1. 在 `index.html` 中添加页面容器：
```html
<div id="page-new" class="page">
  <!-- 页面内容 -->
</div>
```

2. 在 `app.js` 的 `switchPage` 方法中注册：
```javascript
case 'new':
  this.currentPage = 'new';
  // 初始化逻辑
  break;
```

3. 添加导航链接：
```html
<a href="#page-new" onclick="App.switchPage('new')">新页面</a>
```

### 添加新 API

在 `api.js` 中添加：

```javascript
newFeature: {
  getData: () => request('/api/feature/data'),
  postData: (data) => request('/api/feature/data', { method: 'POST', body: data })
}
```

### 调试技巧

1. 打开浏览器开发者工具（F12）
2. 查看 Network 标签页的 API 请求
3. 使用 Console 执行 JavaScript 代码
4. 查看 Application 标签页的 localStorage 数据

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 性能优化

1. **懒加载**: 非首屏内容延迟加载
2. **事件委托**: 减少事件监听器数量
3. **防抖节流**: 搜索框、滚动事件
4. **缓存策略**: 车站列表等静态数据缓存

## 已知问题

- 无离线支持（PWA）
- 无服务端渲染（SEO 不友好）
- 复杂状态管理较困难

## 未来改进方向

1. 迁移到 Vue.js 或 React 框架
2. 添加 WebSocket 实时通知
3. 实现 PWA 离线功能
4. 集成国际化（i18n）
