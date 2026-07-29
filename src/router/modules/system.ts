export default
    [{
        path: '/system',
        redirect: '/system/user',
        meta: {
            title: '系统管理',
            icon: 'ep:setting',
            roles: ['supper_admin'],
            showMenu: true,
            sort: 9999
        },
        children: [
            {
                path: 'user',
                name: 'SystemUser',
                component: () => import('@/views/system/user.vue'),
                meta: {
                    title: '用户管理',
                    icon: 'ep:user',
                    showMenu: true
                }
            },
            {
                path: 'role',
                name: 'SystemRole',
                component: () => import('@/views/system/role.vue'),
                meta: {
                    title: '角色管理',
                    icon: 'ep:user-filled',
                    showMenu: true
                }
            },
            {
                path: 'announcement',
                name: 'SystemAnnouncement',
                component: () => import('@/views/system/announcement.vue'),
                meta: {
                    title: '公告管理',
                    icon: 'ep:bell',
                    showMenu: true
                }
            },

            // {
            //     path: 'theme-preview',
            //     name: 'SystemThemePreview',
            //     component: () => import('@/components/ThemePreview.vue'),
            //     meta: {
            //         title: '主题预览',
            //         icon: 'ep:view',
            //         showMenu: true
            //     }
            // },
            // {
            //     path: 'settings',
            //     name: 'SystemSettings',
            //     component: () => import('@/views/system/settings.vue'),
            //     meta: {
            //         title: '系统设置',
            //         icon: 'ep:tools',
            //         showMenu: true
            //     }
            // }
        ]
    }, {
        path: '/system/theme',
        name: 'SystemTheme',
        component: () => import('@/views/system/theme.vue'),
        meta: {
            title: '主题设置',
            icon: 'ep:brush',
            showMenu: false
        }
    },] satisfies ShortClipRoute

