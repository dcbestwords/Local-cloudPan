import axios from 'axios';
import { ElMessage } from 'element-plus';

const errorCode = {
  '401': '认证失败，无法访问系统资源',
  '403': '当前操作没有权限',
  '404': '访问资源不存在',
  default: '系统未知错误，请反馈给管理员',
};

let request = axios.create({
  baseURL: './api',
  timeout: 5000,
});
// 请求拦截器
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const code = response.data.code || 200;
    const msg = errorCode[code] || response.data.msg || errorCode['default'];
    if (code === 201) {
      ElMessage({
        type: 'error',
        message: msg,
      });
      return Promise.reject(msg);
    } else {
      return response.data;
    }
  },
  (error) => {
    let msg = '';
    let status = error.response.status;
    switch (status) {
      case 401:
        msg = 'TOKEN过期';
        break;
      case 403:
        msg = '无权访问';
        break;
      case 404:
        msg = '请求地址错误';
        break;
      case 500:
        msg = '服务器出现问题';
        break;
      default:
        msg = '网络出现问题';
        break;
    }
    ElMessage({
      type: 'error',
      message: msg,
    });
    return Promise.reject(error);
  }
);

export default request;
