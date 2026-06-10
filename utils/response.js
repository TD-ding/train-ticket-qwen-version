/**
 * 统一API响应格式封装
 */

class ApiResponse {
  static success(res, data = null, message = '操作成功', statusCode = 200) {
    return res.status(statusCode).json({
      code: 0,
      message,
      data
    });
  }

  static error(res, message = '操作失败', statusCode = 400, code = 1) {
    return res.status(statusCode).json({
      code,
      message,
      data: null
    });
  }

  static created(res, data = null, message = '创建成功') {
    return res.status(201).json({
      code: 0,
      message,
      data
    });
  }

  static unauthorized(res, message = '未授权访问') {
    return res.status(401).json({
      code: 401,
      message,
      data: null
    });
  }

  static forbidden(res, message = '禁止访问') {
    return res.status(403).json({
      code: 403,
      message,
      data: null
    });
  }

  static notFound(res, message = '资源不存在') {
    return res.status(404).json({
      code: 404,
      message,
      data: null
    });
  }

  static serverError(res, message = '服务器内部错误') {
    return res.status(500).json({
      code: 500,
      message,
      data: null
    });
  }
}

module.exports = ApiResponse;
