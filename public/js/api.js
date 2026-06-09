/**
 * API 封装模块
 * 封装所有与后端的 HTTP 请求
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
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '请求失败');
    }

    return result;
  },

  // 认证相关
  auth: {
    register(data) { return API.request('POST', '/api/auth/register', data, false); },
    login(data) { return API.request('POST', '/api/auth/login', data, false); },
    me() { return API.request('GET', '/api/auth/me'); }
  },

  // 列车相关
  trains: {
    search(params) {
      const query = new URLSearchParams(params).toString();
      return API.request('GET', `/api/trains/search?${query}`, null, false);
    },
    getById(id) { return API.request('GET', `/api/trains/${id}`, null, false); },
    getStations() { return API.request('GET', '/api/trains/meta/stations', null, false); }
  },

  // 订单相关
  orders: {
    create(data) { return API.request('POST', '/api/orders', data); },
    list() { return API.request('GET', '/api/orders'); },
    getById(id) { return API.request('GET', `/api/orders/${id}`); },
    pay(id) { return API.request('POST', `/api/orders/${id}/pay`); },
    cancel(id) { return API.request('POST', `/api/orders/${id}/cancel`); }
  },

  // 管理员相关
  admin: {
    getStats() { return API.request('GET', '/api/admin/stats'); },
    getTrains() { return API.request('GET', '/api/admin/trains'); },
    addTrain(data) { return API.request('POST', '/api/admin/trains', data); },
    updateTrain(id, data) { return API.request('PUT', `/api/admin/trains/${id}`, data); },
    getOrders() { return API.request('GET', '/api/admin/orders'); },
    getUsers() { return API.request('GET', '/api/admin/users'); }
  }
};
