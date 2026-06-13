export default [
  {
    path: '/error/403',
    name: '403',
    meta: {
      showMenu: false,
      roles: [],
      title: '权限不足',
    },
    component: () => import('@/views/error/403.vue'),
  },
  {
    path: '/error/404',
    name: '404',
    meta: {
      showMenu: false,
      roles: [],
      title: '页面找不到',
    },
    component: () => import('@/views/error/404.vue'),
  },
] as ShortClipRoute[]
