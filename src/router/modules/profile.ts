export default {
  path: '/profile',
  name: 'Profile',
  component: () => import('@/views/profile/index.vue'),
  meta: {
    title: '个人资料',
    icon: 'ep:user',
    sort: 999,
    roles: [], // 所有登录用户都可以访问
  }
}