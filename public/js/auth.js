/**
 * 用户认证模块
 * 处理登录、注册、登出、用户状态管理
 */
const Auth = {
  currentUser: null,

  /**
   * 初始化：检查本地存储的 token 并获取用户信息
   */
  async init() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.currentUser = await API.auth.me();
      } catch (e) {
        this.logout();
      }
    }
  },

  /**
   * 登录
   */
  async login(username, password) {
    const result = await API.auth.login({ username, password });
    localStorage.setItem('token', result.token);
    this.currentUser = result.user;
    return result;
  },

  /**
   * 注册
   */
  async register(data) {
    const result = await API.auth.register(data);
    return result;
  },

  /**
   * 登出
   */
  logout() {
    localStorage.removeItem('token');
    this.currentUser = null;
  },

  /**
   * 是否已登录
   */
  isLoggedIn() {
    return this.currentUser !== null;
  },

  /**
   * 是否是管理员
   */
  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }
};
