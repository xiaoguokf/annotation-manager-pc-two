import { createRouter, createWebHistory } from 'vue-router'
import login from '@/router/login.ts'
import { getToken, hasAnyRole } from '@/utils/auth'
import { setPageTitle } from '@/utils/title'
import { useUserStore } from '@/stores/user'
import normal from './normal'

const modules: Record<string, { default: ShortClipRoute }> = import.meta.glob(
  ['./modules/**/*.ts'],
  {
    eager: true,
  },
)

const routes: ShortClipRouteRecord[] = []

function loadRoute() {
  let _routes: ShortClipRouteRecord[] = []
  Object.values(modules).forEach((m) => {
    const route = m.default
    if (route instanceof Array) {
      _routes.push(...route as ShortClipRouteRecord[])
    } else {
      _routes.push(route as ShortClipRouteRecord)
    }
  })
  _routes = _routes.sort((a, b) => (a.meta.sort ?? 999) - (b.meta.sort ?? 999))
  console.log({ _routes });

  routes.push(..._routes)
}


loadRoute()
routes.forEach((route) => {
  if (route.meta) {
    route.meta.isTop = true
  } else {
    route.meta = {
      isTop: true
    }
  }
})
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    login, ...normal,
    {
      path: '/',
      component: () => import('@/layout/index.vue'),
      children: routes
    },
    {
      // 捕获所有未匹配的路由 - 必须放在最后
      path: '/:pathMatch(.*)*',
      redirect: '/error/404',
    },
  ],
})
export const MenuRoutes = routes
// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const token = getToken()
  const userStore = useUserStore()

  console.log('路由守卫检查:', {
    path: to.path,
    token: !!token,
    tokenValue: token,
    roles: userStore.getUserInfo()?.roles,
    localStorageToken: localStorage.getItem('token')
  })

  // 公开访问的路径列表
  const publicPaths = ['/login']

  // 如果没有登录且不是公开访问路径，重定向到登录页
  if (!token && !publicPaths.includes(to.path)) {
    console.log('未登录，重定向到登录页')
    next('/login')
    return
  }

  // 如果已登录且去登录页，重定向到首页
  if (token && to.path === '/login') {
    console.log('已登录，重定向到首页')
    next('/dashboard')
    return
  }

  // 确保用户信息已加载
  if (token && !useUserStore().getUserInfo()) {
    console.log('Token存在但用户信息未加载，尝试获取用户信息')
    try {
      const userInfo = await useUserStore().fetchUserInfo()
      if (!userInfo || !userInfo.roles) {
        console.error('用户信息不完整，重定向到登录页')
        next('/login')
        return
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      next('/login')
      return
    }
  }

  // 权限检查
  if (token && to.meta.roles && Array.isArray(to.meta.roles)) {
    const requiredRoles = to.meta.roles as string[]
    const userRoles = useUserStore().getUserInfo()?.roles || []
    console.log('权限检查:', { requiredRoles, userRoles })

    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      console.log('权限不足，重定向到403')
      next('/error/403')
      return
    }
  }

  // 更新浏览器标题
  setPageTitle(to.meta?.title as string)

  console.log('路由检查通过，继续导航')
  next()
})

export default router
