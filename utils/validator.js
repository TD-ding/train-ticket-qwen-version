/**
 * 输入验证工具
 */

class Validator {
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email) {
    if (!email) return true; // 允许空邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式（中国大陆）
   */
  static isValidPhone(phone) {
    if (!phone) return true; // 允许空手机号
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证身份证号格式（简化版，支持15位和18位）
   */
  static isValidIdCard(idCard) {
    if (!idCard) return true; // 允许空身份证
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return idCardRegex.test(idCard);
  }

  /**
   * 验证用户名格式
   */
  static isValidUsername(username) {
    if (!username || username.length < 3 || username.length > 20) {
      return false;
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username);
  }

  /**
   * 验证密码强度
   */
  static isValidPassword(password) {
    if (!password || password.length < 6) {
      return false;
    }
    return true;
  }

  /**
   * 验证正整数
   */
  static isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
  }

  /**
   * 验证非负数
   */
  static isNonNegativeNumber(value) {
    return typeof value === 'number' && value >= 0;
  }

  /**
   * 验证日期格式 YYYY-MM-DD
   */
  static isValidDate(dateStr) {
    if (!dateStr) return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * 验证时间格式 HH:MM
   */
  static isValidTime(timeStr) {
    if (!timeStr) return false;
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(timeStr);
  }
}

module.exports = Validator;
