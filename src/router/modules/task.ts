export default
  [{
    path: '/task',
    redirect: '/task/list',
    meta: {
      title: '任务中心',
      icon: 'ep:document',
      showMenu: true,
      sort: 2
    },
    children: [
      {
        path: 'list',
        name: 'TaskList',
        component: () => import('@/views/task/list.vue'),
        meta: {
          title: '标注任务',
          icon: 'ep:list',
          showMenu: true,
          roles: ['user', 'supper_admin'],
        }
      },
      {
        path: 'review',
        name: 'TaskReview',
        component: () => import('@/views/task/review.vue'),
        meta: {
          title: '审核任务',
          icon: 'ep:check',
          showMenu: true,
          roles: ['audit_user', 'supper_admin'],
        }
      }
    ]
  }] satisfies ShortClipRoute
