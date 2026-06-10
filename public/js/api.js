/**
 * API 封装模块
 * 封装所有与后端的 HTTP 请求，统一处理新的响应格式
 */
const API = {
  baseUrl: '',

  /**
   * 通用请求方法
   */
  async request(method, url, data = null, needAuth = true) {
    const headers = { 'Content-Type': 'application/json' };

    if (needAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const options = { method, headers };
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(this.baseUrl + url, options);

    // 处理非JSON响应
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('服务器返回非JSON响应');
    }

    const result = await response.json();

    // 统一处理新的API响应格式
    if (!response.ok) {
      throw new Error(result.message || result.error || '请求失败');
    }

    // 检查API响应码
    if (result.code !== 0) {
      throw new Error(result.message || '请求失败');
    }

    return result.data;
  },

  // 认证相关
  auth: {
    register(data) { return API.request('POST', '/api/auth/register', data, false); },
    login(data) { return API.request('POST', '/api/auth/login', data, false); },
    me() { return API.request('GET', '/api/auth/me'); },
    updateProfile(data) { return API.request('PUT', '/api/auth/profile', data); },
    changePassword(data) { return API.request('PUT', '/api/auth/password', data); }
  },

  // 列车相关
  trains: {
    search(params) {
      const query = new URLSearchParams(params).toString();
      return API.request('GET', `/api/trains/search?${query}`, null, false);
    },
    getById(id) { return API.request('GET', `/api/trains/${id}`, null, false); },
    getStations() { return API.request('GET', '/api/trains/meta/stations', null, false); },
    getPopular() { return API.request('GET', '/api/trains/popular', null, false); }
  },

  // 订单相关
  orders: {
    create(data) { return API.request('POST', '/api/orders', data); },
    list() { return API.request('GET', '/api/orders'); },
    getById(id) { return API.request('GET', `/api/orders/${id}`); },
    pay(id) { return API.request('POST', `/api/orders/${id}/pay`); },
    cancel(id) { return API.request('POST', `/api/orders/${id}/cancel`); },
    getStats() { return API.request('GET', '/api/orders/stats'); }
  },

  // 管理员相关
  admin: {
    getStats() { return API.request('GET', '/api/admin/stats'); },
    getRevenueStats(days) { return API.request('GET', `/api/admin/stats/revenue?days=${days}`); },
    getTrains() { return API.request('GET', '/api/admin/trains'); },
    addTrain(data) { return API.request('POST', '/api/admin/trains', data); },
    updateTrain(id, data) { return API.request('PUT', `/api/admin/trains/${id}`, data); },
    batchUpdateTrainStatus(trainIds, status) {
      return API.request('PUT', '/api/admin/trains/batch/status', { trainIds, status });
    },
    getOrders() { return API.request('GET', '/api/admin/orders'); },
    getUsers() { return API.request('GET', '/api/admin/users'); }
  }
};
