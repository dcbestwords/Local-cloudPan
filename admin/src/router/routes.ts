import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layouts/index.vue';

// 常量路由
export const constantRoute: RouteRecordRaw[] = [
  {
    //登录
    path: '/login',
    component: () => import('@/pages/login/index.vue'),
    name: 'login',
  },
  {
    //登录成功以后展示数据的路由
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'home',
        component: () => import('@/pages/home/index.vue'),
        meta: { title: '公告栏', subtitle: '' },
      },
      {
        path: '/sharePan',
        name: 'sharePan',
        component: () => import('@/pages/sharePan/index.vue'),
        meta: { title: '我的云盘', subtitle: '在线管理托管的磁盘' },
        beforeEnter: (to, _) => {
          if (to.query.path === undefined) {
            return { path: to.path, query: { ...to.query, path: '' } };
          }
        },
      },
      {
        path: '/chat',
        name: 'chat',
        component: () => import('@/pages/chat/index.vue'),
        meta: { title: '聊天界面', subtitle: '1对1私聊' },
      },
      {
        path: '/share',
        name: 'share',
        component: () => import('@/pages/share/index.vue'),
        meta: { title: '探店分享', subtitle: '发现教研室周边的美食与好去处' },
      },
    ],
  },
  {
    //404
    path: '/404',
    component: () => import('@/pages/404/index.vue'),
    name: '404',
  },
];

// 异步路由
// export const asyncRoute: RouteRecordRaw[] = [
//   {
//     path: '/acl',
//     component: () => import('@/layout/index.vue'),
//     name: 'Acl',
//     meta: {
//       title: '权限管理',
//       icon: 'Lock',
//     },
//     redirect: '/acl/user',
//     children: [
//       {
//         path: '/acl/user',
//         component: () => import('@/views/acl/user/index.vue'),
//         name: 'User',
//         meta: {
//           title: '用户管理',
//           icon: 'User',
//         },
//       },
//       {
//         path: '/acl/role',
//         component: () => import('@/views/acl/role/index.vue'),
//         name: 'Role',
//         meta: {
//           title: '角色管理',
//           icon: 'UserFilled',
//         },
//       },
//       {
//         path: '/acl/permission',
//         component: () => import('@/views/acl/permission/index.vue'),
//         name: 'Permission',
//         meta: {
//           title: '菜单管理',
//           icon: 'Monitor',
//         },
//       },
//     ],
//   },
// ];

//任意路由
export const anyRoute = {
  //任意路由
  path: '/:pathMatch(.*)*',
  redirect: '/404',
  name: 'Any',
  meta: {
    title: '任意路由',
    hidden: true,
    icon: 'DataLine',
  },
};
