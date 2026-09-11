export default
  [{
    path: '/deliver',
    redirect: '/deliver/docx-preview',
    meta: {
      title: '交付管理',
      icon: 'ep:upload-filled',
      showMenu: true,
      sort: 6
    },
    children: [
      {
        path: 'docx-preview',
        name: 'DeliverDocxPreview',
        component: () => import('@/views/deliver/DocxPreview.vue'),
        meta: {
          title: '交付预览',
          icon: 'ep:view',
          showMenu: true
        }
      }
    ]
  }] satisfies ShortClipRoute
