/**
 * 应用主控制器
 * 负责页面路由、事件绑定、全局工具方法
 */
const App = {
  currentPage: 'search',
  selectedTrainId: null,

  /**
   * 应用初始化入口
   */
  async init() {
    await Auth.init();
    await Search.init();
    this.bindEvents();
    this.updateNav();
    this.showPage('search');
  },

  /**
   * 绑定所有事件
   */
  bindEvents() {
    // 搜索表单
    document.getElementById('search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const from = document.getElementById('search-from').value;
      const to = document.getElementById('search-to').value;
      const date = document.getElementById('search-date').value;
      Search.search(from, to, date);
    });

    // 登录表单
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      try {
        App.showLoading('登录中...');
        await Auth.login(username, password);
        App.hideLoading();
        this.showToast('登录成功！', 'success');
        this.updateNav();
        this.showPage('search');
      } catch (err) {
        App.hideLoading();
        this.showToast(err.message, 'error');
      }
    });

    // 注册表单
    document.getElementById('register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('reg-password').value;
      const passwordConfirm = document.getElementById('reg-password-confirm').value;

      // 验证所有字段
      const isValid = this.validateUsername() && this.validatePassword() &&
                      this.validatePasswordConfirm() && this.validatePhone() &&
                      this.validateEmail();

      if (!isValid) {
        this.showToast('请修正表单中的错误', 'error');
        return;
      }

      try {
        App.showLoading('注册中...');
        await Auth.register({
          username: document.getElementById('reg-username').value,
          password: password,
          realName: document.getElementById('reg-realname').value,
          phone: document.getElementById('reg-phone').value,
          email: document.getElementById('reg-email').value
        });
        App.hideLoading();
        this.showToast('注册成功，请登录', 'success');
        this.showPage('login');
      } catch (err) {
        App.hideLoading();
        this.showToast(err.message, 'error');
      }
    });

    // 购票表单
    document.getElementById('booking-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const passenger = document.getElementById('booking-passenger').value.trim();
      if (!passenger) {
        this.showFieldError('booking-passenger', '请填写乘客姓名');
        this.showToast('请填写乘客信息', 'error');
        return;
      }

      if (!this.validateIdCard()) {
        this.showToast('请填写正确的身份证号', 'error');
        return;
      }

      try {
        App.showLoading('购票中...');
        await API.orders.create({
          trainId: this.selectedTrainId,
          seatType: document.getElementById('booking-seat-type').value,
          passengerName: document.getElementById('booking-passenger').value,
          passengerId: document.getElementById('booking-id-number').value
        });
        App.hideLoading();
        this.showToast('购票成功！', 'success');
        this.closeModal('booking-modal');
        // 刷新搜索结果以更新余票数
        Search.refreshLastSearch();
        this.showPage('orders');
        Orders.loadOrders();
      } catch (err) {
        App.hideLoading();
        this.showToast(err.message, 'error');
      }
    });

    // 添加列车表单
    document.getElementById('train-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await Admin.addTrain({
          trainNo: document.getElementById('train-no').value,
          date: document.getElementById('train-date').value,
          departureStation: document.getElementById('train-from').value,
          arrivalStation: document.getElementById('train-to').value,
          departureTime: document.getElementById('train-departure-time').value,
          arrivalTime: document.getElementById('train-arrival-time').value,
          priceHardSeat: parseFloat(document.getElementById('train-price-seat').value) || 0,
          priceHardSleeper: parseFloat(document.getElementById('train-price-sleeper').value) || 0,
          priceSoftSleeper: parseFloat(document.getElementById('train-price-soft').value) || 0,
          totalSeats: parseInt(document.getElementById('train-seats').value) || 100
        });
        this.closeModal('train-modal');
        document.getElementById('train-form').reset();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });

    // 页面切换链接
    document.getElementById('show-register').addEventListener('click', (e) => {
      e.preventDefault();
      this.showPage('register');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
      e.preventDefault();
      this.showPage('login');
    });

    // 弹窗关闭按钮
    document.getElementById('btn-cancel-booking').addEventListener('click', () => this.closeModal('booking-modal'));
    document.getElementById('btn-cancel-train').addEventListener('click', () => this.closeModal('train-modal'));

    // 管理员标签切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        const tab = btn.dataset.tab;
        if (tab === 'dashboard') {
          document.getElementById('admin-dashboard').classList.add('active');
          Admin.loadDashboard();
        } else if (tab === 'trains') {
          document.getElementById('admin-trains').classList.add('active');
          Admin.loadTrains();
        } else if (tab === 'all-orders') {
          document.getElementById('admin-all-orders').classList.add('active');
          Admin.loadOrders();
        } else if (tab === 'users') {
          document.getElementById('admin-users').classList.add('active');
          Admin.loadUsers();
        }
      });
    });

    // 添加列车按钮
    document.getElementById('btn-add-train').addEventListener('click', () => {
      document.getElementById('train-modal').classList.remove('hidden');
    });

    // 弹窗背景点击关闭
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', () => {
        overlay.closest('.modal').classList.add('hidden');
      });
    });

    // 个人资料表单
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.validateProfilePhone() || !this.validateProfileEmail()) {
        this.showToast('请修正表单中的错误', 'error');
        return;
      }
      try {
        App.showLoading('保存中...');
        await API.auth.updateProfile({
          realName: document.getElementById('profile-realname').value,
          phone: document.getElementById('profile-phone').value,
          email: document.getElementById('profile-email').value
        });
        App.hideLoading();
        this.showToast('信息更新成功', 'success');
        await Auth.init();
        this.updateNav();
      } catch (err) {
        App.hideLoading();
        this.showToast(err.message, 'error');
      }
    });

    // 修改密码表单
    document.getElementById('password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.validateNewPassword() || !this.validateNewPasswordConfirm()) {
        this.showToast('请修正表单中的错误', 'error');
        return;
      }
      try {
        App.showLoading('修改中...');
        await API.auth.changePassword({
          oldPassword: document.getElementById('password-old').value,
          newPassword: document.getElementById('password-new').value
        });
        App.hideLoading();
        this.showToast('密码修改成功，请重新登录', 'success');
        document.getElementById('password-form').reset();
        Auth.logout();
        this.updateNav();
        this.showPage('login');
      } catch (err) {
        App.hideLoading();
        this.showToast(err.message, 'error');
      }
    });
  },

  /**
   * 更新导航栏
   */
  updateNav() {
    const navLinks = document.getElementById('nav-links');
    let html = '<a href="#" onclick="App.showPage(\'search\'); return false;">查询车票</a>';

    if (Auth.isLoggedIn()) {
      html += `<a href="#" onclick="App.showPage('orders'); return false;">我的订单</a>`;
      html += `<a href="#" onclick="App.showPage('profile'); return false;">个人中心</a>`;
      if (Auth.isAdmin()) {
        html += `<a href="#" onclick="App.showPage('admin'); return false;">管理后台</a>`;
      }
      html += `<span style="color: var(--text-secondary); font-size: 14px;">${Auth.currentUser.username}</span>`;
      html += `<button onclick="App.doLogout()">登出</button>`;
    } else {
      html += `<a href="#" onclick="App.showPage('login'); return false;">登录</a>`;
    }

    navLinks.innerHTML = html;
  },

  /**
   * 显示指定页面
   */
  showPage(page) {
    // 需要登录的页面
    if ((page === 'orders' || page === 'admin' || page === 'profile') && !Auth.isLoggedIn()) {
      this.showPage('login');
      this.showToast('请先登录', 'warning');
      return;
    }

    // 需要管理员权限
    if (page === 'admin' && !Auth.isAdmin()) {
      this.showPage('search');
      this.showToast('需要管理员权限', 'error');
      return;
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add('active');
    this.currentPage = page;

    // 加载页面数据
    if (page === 'orders') Orders.loadOrders();
    if (page === 'admin') Admin.loadDashboard();
    if (page === 'profile') this.loadProfile();
  },

  /**
   * 打开购票弹窗
   */
  openBooking(trainId, trainNo) {
    if (!Auth.isLoggedIn()) {
      this.showPage('login');
      this.showToast('请先登录后再购票', 'warning');
      return;
    }
    this.selectedTrainId = trainId;
    document.getElementById('booking-form').reset();
    document.getElementById('booking-train-no').textContent = trainNo;
    document.getElementById('booking-modal').classList.remove('hidden');
  },

  /**
   * 关闭弹窗
   */
  closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  },

  /**
   * 登出
   */
  doLogout() {
    Auth.logout();
    this.updateNav();
    this.showPage('search');
    this.showToast('已退出登录', 'info');
  },

  /**
   * 显示 Toast 通知
   */
  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  },

  /**
   * 显示加载状态
   */
  showLoading(message = '加载中...') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast info';
    toast.classList.remove('hidden');
  },

  /**
   * 隐藏加载状态
   */
  hideLoading() {
    const toast = document.getElementById('toast');
    toast.classList.add('hidden');
  },

  /**
   * 显示字段错误
   */
  showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + '-error');
    if (field && errorDiv) {
      field.parentElement.classList.add('has-error');
      errorDiv.textContent = message;
      errorDiv.classList.add('show');
    }
  },

  /**
   * 清除字段错误
   */
  clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + '-error');
    if (field && errorDiv) {
      field.parentElement.classList.remove('has-error');
      errorDiv.textContent = '';
      errorDiv.classList.remove('show');
    }
  },

  /**
   * 验证用户名
   */
  validateUsername() {
    const username = document.getElementById('reg-username').value.trim();
    this.clearFieldError('reg-username');
    if (username.length < 3) {
      this.showFieldError('reg-username', '用户名至少3个字符');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      this.showFieldError('reg-username', '用户名只能包含字母、数字和下划线');
      return false;
    }
    return true;
  },

  /**
   * 验证密码
   */
  validatePassword() {
    const password = document.getElementById('reg-password').value;
    this.clearFieldError('reg-password');
    if (password.length < 6) {
      this.showFieldError('reg-password', '密码至少6个字符');
      return false;
    }
    return true;
  },

  /**
   * 验证确认密码
   */
  validatePasswordConfirm() {
    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm').value;
    this.clearFieldError('reg-password-confirm');
    if (password !== passwordConfirm) {
      this.showFieldError('reg-password-confirm', '两次输入的密码不一致');
      return false;
    }
    return true;
  },

  /**
   * 验证手机号
   */
  validatePhone() {
    const phone = document.getElementById('reg-phone').value.trim();
    this.clearFieldError('reg-phone');
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      this.showFieldError('reg-phone', '请输入正确的手机号');
      return false;
    }
    return true;
  },

  /**
   * 验证邮箱
   */
  validateEmail() {
    const email = document.getElementById('reg-email').value.trim();
    this.clearFieldError('reg-email');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showFieldError('reg-email', '请输入正确的邮箱地址');
      return false;
    }
    return true;
  },

  /**
   * 验证身份证号
   */
  validateIdCard() {
    const idCard = document.getElementById('booking-id-number').value.trim();
    this.clearFieldError('booking-id-number');
    if (!/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard)) {
      this.showFieldError('booking-id-number', '请输入正确的身份证号');
      return false;
    }
    return true;
  },

  validateProfilePhone() {
    const phone = document.getElementById('profile-phone').value.trim();
    this.clearFieldError('profile-phone');
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      this.showFieldError('profile-phone', '请输入正确的手机号');
      return false;
    }
    return true;
  },

  validateProfileEmail() {
    const email = document.getElementById('profile-email').value.trim();
    this.clearFieldError('profile-email');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showFieldError('profile-email', '请输入正确的邮箱地址');
      return false;
    }
    return true;
  },

  validateNewPassword() {
    const password = document.getElementById('password-new').value;
    this.clearFieldError('password-new');
    if (password.length < 6) {
      this.showFieldError('password-new', '密码至少6个字符');
      return false;
    }
    return true;
  },

  validateNewPasswordConfirm() {
    const password = document.getElementById('password-new').value;
    const confirm = document.getElementById('password-confirm').value;
    this.clearFieldError('password-confirm');
    if (password !== confirm) {
      this.showFieldError('password-confirm', '两次输入的密码不一致');
      return false;
    }
    return true;
  },

  async loadProfile() {
    try {
      const user = await API.auth.me();
      document.getElementById('profile-username').value = user.username || '';
      document.getElementById('profile-realname').value = user.real_name || '';
      document.getElementById('profile-phone').value = user.phone || '';
      document.getElementById('profile-email').value = user.email || '';
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => App.init());
