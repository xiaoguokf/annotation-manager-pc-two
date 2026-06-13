export default [
  {
    path: '/dashboard',
    meta: {
      title: '首页',
      icon: 'ep:house',
      showMenu: true,
      sort: 1,
    },
    component: () => import('@/views/home/index.vue'),
  },

] satisfies ShortClipRoute[]