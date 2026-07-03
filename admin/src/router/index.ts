// 通过vue-router插件实现路由模板配置
import { createRouter, createWebHashHistory } from 'vue-router';
import { constantRoute } from './routes';
// 创建路由器
const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoute,
  scrollBehavior() {
    return {
      left: 0,
      top: 0,
    };
  },
});

// 路由守卫：未登录跳登录页
router.beforeEach((to, _from) => {
  const token = localStorage.getItem('token');
  if (to.path !== '/login' && !token) {
    return '/login';
  }
  if (to.path === '/login' && token) {
    return '/home';
  }
});

export default router;
