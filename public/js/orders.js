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
    } catch (e) {
      App.hideLoading();
      App.showToast(e.message, 'error');
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

    container.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-info">
          <div class="order-no">订单号: ${order.order_no}</div>
          <div class="order-route">${order.departure_station} → ${order.arrival_station} (${order.train_no})</div>
          <div class="order-details">
            ${order.date} ${order.departure_time} | ${this.seatTypeLabels[order.seat_type]} | 乘客: ${order.passenger_name}
            | <span class="status-badge status-${order.status}">${this.statusLabels[order.status]}</span>
          </div>
        </div>
        <div class="order-actions">
          <span class="order-price">¥${order.price}</span>
          ${order.status === 'pending' ? `
            <button class="btn btn-success" onclick="Orders.payOrder(${order.id})">支付</button>
            <button class="btn btn-danger" onclick="Orders.cancelOrder(${order.id})">取消</button>
          ` : ''}
        </div>
      </div>
    `).join('');
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
