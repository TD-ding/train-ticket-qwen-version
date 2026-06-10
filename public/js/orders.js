/**
 * 订单管理模块
 * 处理用户订单的显示、支付、取消
 */
const Orders = {
  allOrders: [],
  seatTypeLabels: {
    hard_seat: '硬座',
    hard_sleeper: '硬卧',
    soft_sleeper: '软卧'
  },

  statusLabels: {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消',
    refunded: '已退款'
  },

  /**
   * 加载并显示订单列表
   */
  async loadOrders() {
    try {
      App.showLoading('加载订单中...');
      const orders = await API.orders.list();
      this.allOrders = orders;
      App.hideLoading();
      this.renderOrders(orders);
      this.loadStats();
    } catch (e) {
      App.hideLoading();
      App.showToast(e.message, 'error');
    }
  },

  /**
   * 加载订单统计信息
   */
  async loadStats() {
    try {
      const stats = await API.orders.getStats();
      const container = document.getElementById('order-stats');
      container.innerHTML = `
        <div class="stats-card">
          <div class="stat-item">
            <span class="stat-value">${stats.total_orders || 0}</span>
            <span class="stat-label">总订单</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.paid_orders || 0}</span>
            <span class="stat-label">已支付</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${stats.cancelled_orders || 0}</span>
            <span class="stat-label">已取消</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">¥${(stats.total_spent || 0).toFixed(2)}</span>
            <span class="stat-label">总消费</span>
          </div>
        </div>
      `;
    } catch (e) {
      // 静默失败
    }
  },

  /**
   * 筛选订单
   */
  filterOrders() {
    const status = document.getElementById('order-status-filter').value;
    if (status === 'all') {
      this.renderOrders(this.allOrders);
    } else {
      const filtered = this.allOrders.filter(order => order.status === status);
      this.renderOrders(filtered);
    }
  },

  /**
   * 渲染订单列表
   */
  renderOrders(orders) {
    const container = document.getElementById('orders-list');

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📋</div>
          <p>暂无订单</p>
        </div>
      `;
      return;
    }

    container.innerHTML = orders.map(order => {
      // 转义用户输入以防止 XSS
      const escapeHtml = (str) => {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      };

      const orderNo = escapeHtml(order.order_no);
      const departureStation = escapeHtml(order.departure_station);
      const arrivalStation = escapeHtml(order.arrival_station);
      const trainNo = escapeHtml(order.train_no);
      const passengerName = escapeHtml(order.passenger_name);
      const date = escapeHtml(order.date);
      const departureTime = escapeHtml(order.departure_time);
      const seatType = this.seatTypeLabels[order.seat_type] || order.seat_type || '-';
      const status = this.statusLabels[order.status] || order.status;
      const price = order.price || 0;

      return `
        <div class="order-card">
          <div class="order-info">
            <div class="order-no">订单号: ${orderNo}</div>
            <div class="order-route">${departureStation} → ${arrivalStation} (${trainNo})</div>
            <div class="order-details">
              ${date} ${departureTime} | ${seatType} | 乘客: ${passengerName}
              | <span class="status-badge status-${order.status}">${status}</span>
            </div>
          </div>
          <div class="order-actions">
            <span class="order-price">¥${price}</span>
            ${order.status === 'pending' ? `
              <button class="btn btn-success" onclick="Orders.payOrder(${order.id})">支付</button>
              <button class="btn btn-danger" onclick="Orders.cancelOrder(${order.id})">取消</button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * 支付订单
   */
  async payOrder(id) {
    try {
      App.showLoading('支付中...');
      await API.orders.pay(id);
      App.hideLoading();
      App.showToast('支付成功！', 'success');
      this.loadOrders();
    } catch (e) {
      App.hideLoading();
      App.showToast(e.message, 'error');
    }
  },

  /**
   * 取消订单
   */
  async cancelOrder(id) {
    if (!confirm('确定要取消此订单吗？')) return;
    try {
      App.showLoading('取消中...');
      await API.orders.cancel(id);
      App.hideLoading();
      App.showToast('订单已取消', 'info');
      this.loadOrders();
    } catch (e) {
      App.hideLoading();
      App.showToast(e.message, 'error');
    }
  }
};
