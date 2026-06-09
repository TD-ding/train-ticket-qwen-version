/**
 * 管理员模块
 * 处理管理面板的数据展示和操作
 */
const Admin = {
  statusLabels: {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消',
    refunded: '已退款'
  },

  seatTypeLabels: {
    hard_seat: '硬座',
    hard_sleeper: '硬卧',
    soft_sleeper: '软卧'
  },

  trainStatusLabels: {
    active: '运行中',
    cancelled: '已取消',
    completed: '已完成'
  },

  /**
   * 加载管理面板数据
   */
  async loadDashboard() {
    try {
      const stats = await API.admin.getStats();
      document.getElementById('stats-grid').innerHTML = `
        <div class="stat-card"><div class="value">${stats.totalUsers}</div><div class="label">注册用户</div></div>
        <div class="stat-card"><div class="value">${stats.totalOrders}</div><div class="label">总订单数</div></div>
        <div class="stat-card"><div class="value">¥${stats.totalRevenue.toFixed(2)}</div><div class="label">总收入</div></div>
        <div class="stat-card"><div class="value">${stats.totalTrains}</div><div class="label">列车数量</div></div>
      `;
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  /**
   * 加载列车管理表格
   */
  async loadTrains() {
    try {
      const trains = await API.admin.getTrains();
      const container = document.getElementById('admin-trains-table');
      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>车次</th><th>日期</th><th>出发站</th><th>到达站</th>
              <th>出发</th><th>到达</th><th>硬座</th><th>硬卧</th><th>软卧</th>
              <th>余票/总</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${trains.map(t => `
              <tr>
                <td>${t.train_no}</td><td>${t.date}</td>
                <td>${t.departure_station}</td><td>${t.arrival_station}</td>
                <td>${t.departure_time}</td><td>${t.arrival_time}</td>
                <td>¥${t.price_hard_seat}</td><td>¥${t.price_hard_sleeper}</td><td>¥${t.price_soft_sleeper}</td>
                <td>${t.available_seats}/${t.total_seats}</td>
                <td><span class="status-badge ${t.status === 'active' ? 'status-paid' : 'status-cancelled'}">${this.trainStatusLabels[t.status]}</span></td>
                <td>
                  ${t.status === 'active'
                    ? `<button class="btn btn-danger" onclick="Admin.cancelTrain(${t.id})">取消</button>`
                    : '-'
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  /**
   * 取消列车
   */
  async cancelTrain(id) {
    if (!confirm('确定要取消此列车吗？')) return;
    try {
      await API.admin.updateTrain(id, { status: 'cancelled' });
      App.showToast('列车已取消', 'info');
      this.loadTrains();
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  /**
   * 添加列车
   */
  async addTrain(data) {
    try {
      await API.admin.addTrain(data);
      App.showToast('列车添加成功', 'success');
      this.loadTrains();
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  /**
   * 加载所有订单
   */
  async loadOrders() {
    try {
      const orders = await API.admin.getOrders();
      const container = document.getElementById('admin-orders-table');
      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>订单号</th><th>用户</th><th>车次</th><th>路线</th>
              <th>乘客</th><th>座位类型</th><th>价格</th><th>状态</th><th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td>${o.order_no}</td>
                <td>${o.username}</td>
                <td>${o.train_no}</td>
                <td>${o.departure_station} → ${o.arrival_station}</td>
                <td>${o.passenger_name}</td>
                <td>${this.seatTypeLabels[o.seat_type]}</td>
                <td>¥${o.price}</td>
                <td><span class="status-badge status-${o.status}">${this.statusLabels[o.status]}</span></td>
                <td>${o.created_at}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  /**
   * 加载用户列表
   */
  async loadUsers() {
    try {
      const users = await API.admin.getUsers();
      const container = document.getElementById('admin-users-table');
      container.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th><th>用户名</th><th>姓名</th><th>手机</th>
              <th>邮箱</th><th>角色</th><th>注册时间</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.real_name || '-'}</td>
                <td>${u.phone || '-'}</td>
                <td>${u.email || '-'}</td>
                <td><span class="status-badge ${u.role === 'admin' ? 'status-paid' : 'status-pending'}">${u.role === 'admin' ? '管理员' : '用户'}</span></td>
                <td>${u.created_at}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  }
};
