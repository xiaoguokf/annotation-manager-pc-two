export default [
  {
    path: '/annotation/:projectId',
    name: 'Annotation',
    component: () => import('@/views/annotation/index.vue'),
    meta: {
      title: '标注工作台',
      showMenu: false
    }
  },
  {
    path: '/task/review/:projectId',
    name: 'TaskReviewDetail',
    component: () => import('@/views/task/review-detail.vue'),
    meta: {
      title: '审核详情',
      showMenu: false
    }
  },
  {
    path: '/task/book-info/:projectId',
    name: 'BookInfoManage',
    component: () => import('@/views/task/book-info-manage.vue'),
    meta: {
      title: '书籍信息管理',
      showMenu: false
    }
  }
] satisfies ShortClipRoute

