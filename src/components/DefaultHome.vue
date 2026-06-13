<template>
  <div class="dashboard" :style="{ padding: sizeConfig.cardPadding }">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner rounded-xl text-white shadow-lg"
      :style="{ padding: sizeConfig.cardPadding, marginBottom: sizeConfig.sectionGap, background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%)` }">
      <div class="flex items-center justify-between flex-wrap" :style="{ gap: sizeConfig.gridGap }">
        <div>
          <h1 class="font-bold" :style="{ fontSize: sizeConfig.headingLarge, marginBottom: sizeConfig.itemGap }">
            {{ greeting }}，{{ userName }}
          </h1>
          <p class="text-white/70" :style="{ fontSize: sizeConfig.fontSizeBase }">{{ currentTime }} · 欢迎回来</p>
        </div>
        <div class="flex items-center" :style="{ gap: sizeConfig.elementGap }">
          <div class="bg-white/20 rounded-lg text-center backdrop-blur-sm"
            :style="{ paddingLeft: sizeConfig.innerPaddingX, paddingRight: sizeConfig.innerPaddingX, paddingTop: sizeConfig.elementGap, paddingBottom: sizeConfig.elementGap }">
            <div class="text-white/70" :style="{ fontSize: sizeConfig.fontSizeXs }">当前角色</div>
            <div class="font-semibold" :style="{ fontSize: sizeConfig.fontSizeBase }">{{ userRoleName }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 系统概览统计卡片 -->
    <div v-if="showAdminStats" :style="{ marginBottom: sizeConfig.sectionGap }">
      <h2 class="font-bold text-gray-800 dark:text-gray-200" :style="{ fontSize: sizeConfig.headingMedium, marginBottom: sizeConfig.gridGap }">系统概览</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :style="{ gap: sizeConfig.gridGap }">
        <div v-for="item in statCards" :key="item.label"
          class="stat-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
          :style="{ padding: sizeConfig.cardPadding }"
          @click="item.link && router.push(item.link)">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500" :style="{ fontSize: sizeConfig.fontSizeSm, marginBottom: sizeConfig.itemGap }">{{ item.label }}</p>
              <p class="font-bold" :class="item.valueColor" :style="{ fontSize: sizeConfig.headingLarge }">{{ item.value }}</p>
            </div>
            <div :class="[item.iconBg, 'rounded-xl flex items-center justify-center']"
              :style="{ width: sizeConfig.statIconSize, height: sizeConfig.statIconSize }">
              <Icon :icon="item.icon" :width="sizeConfig.statIconInner" :class="item.iconColor" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div :style="{ marginBottom: sizeConfig.sectionGap }">
      <h2 class="font-bold text-gray-800 dark:text-gray-200" :style="{ fontSize: sizeConfig.headingMedium, marginBottom: sizeConfig.gridGap }">快捷入口</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :style="{ gap: sizeConfig.gridGap }">
        <div v-for="item in quickActions" :key="item.title"
          class="quick-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group"
          :style="{ padding: sizeConfig.cardPadding }"
          @click="item.link && router.push(item.link)">
          <div class="flex items-start" :style="{ gap: sizeConfig.gridGap }">
            <div :class="[item.iconBg, 'rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform']"
              :style="{ width: sizeConfig.quickIconSize, height: sizeConfig.quickIconSize }">
              <Icon :icon="item.icon" :width="sizeConfig.quickIconInner" :class="item.iconColor" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-800 dark:text-gray-200" :style="{ marginBottom: sizeConfig.itemGap, fontSize: sizeConfig.fontSizeBase }">{{ item.title }}</h3>
              <p class="text-gray-500 line-clamp-2" :style="{ fontSize: sizeConfig.fontSizeSm }">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 账户信息卡片 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700" :style="{ padding: sizeConfig.cardPadding }">
      <h2 class="font-bold text-gray-800 dark:text-gray-200" :style="{ fontSize: sizeConfig.headingMedium, marginBottom: sizeConfig.gridGap }">账户信息</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :style="{ gap: sizeConfig.gridGap }">
        <div class="flex flex-col" :style="{ gap: sizeConfig.itemGap }">
          <span class="text-gray-400" :style="{ fontSize: sizeConfig.fontSizeXs }">用户名</span>
          <span class="font-medium text-gray-700" :style="{ fontSize: sizeConfig.fontSizeBase }">{{ userInfo?.username || '-' }}</span>
        </div>
        <div class="flex flex-col" :style="{ gap: sizeConfig.itemGap }">
          <span class="text-gray-400" :style="{ fontSize: sizeConfig.fontSizeXs }">昵称</span>
          <span class="font-medium text-gray-700" :style="{ fontSize: sizeConfig.fontSizeBase }">{{ userInfo?.nickname || '-' }}</span>
        </div>
        <div class="flex flex-col" :style="{ gap: sizeConfig.itemGap }">
          <span class="text-gray-400" :style="{ fontSize: sizeConfig.fontSizeXs }">邮箱</span>
          <span class="font-medium text-gray-700" :style="{ fontSize: sizeConfig.fontSizeBase }">{{ userInfo?.email || '-' }}</span>
        </div>
        <div class="flex flex-col" :style="{ gap: sizeConfig.itemGap }">
          <span class="text-gray-400" :style="{ fontSize: sizeConfig.fontSizeXs }">手机号</span>
          <span class="font-medium text-gray-700" :style="{ fontSize: sizeConfig.fontSizeBase }">{{ userInfo?.phone || '-' }}</span>
        </div>
        <div class="flex flex-col" :style="{ gap: sizeConfig.itemGap }">
          <span class="text-gray-400" :style="{ fontSize: sizeConfig.fontSizeXs }">注册时间</span>
          <span class="font-medium text-gray-700" :style="{ fontSize: sizeConfig.fontSizeBase }">{{ formatTime(userInfo?.createTime) }}</span>
        </div>
        <div class="flex flex-col" :style="{ gap: sizeConfig.itemGap }">
          <span class="text-gray-400" :style="{ fontSize: sizeConfig.fontSizeXs }">账户状态</span>
          <el-tag :type="userInfo?.enable !== false ? 'success' : 'danger'" size="small">
            {{ userInfo?.enable !== false ? '启用' : '禁用' }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { UserService } from '@/services/userService'
import { RoleService } from '@/services/roleService'
import { hasAnyRole } from '@/utils/auth'
import dayjs from 'dayjs'

defineOptions({
  name: 'DefaultHome'
})

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const loading = ref(false)
const userCount = ref<number>(0)
const roleCount = ref<number>(0)

// 根据主题尺寸计算响应式尺寸
const sizeConfig = computed(() => {
  const s = themeStore.themeSize
  switch (s) {
    case 'small':
      return {
        headingLarge: '20px',
        headingMedium: '16px',
        fontSizeBase: '13px',
        fontSizeSm: '12px',
        fontSizeXs: '11px',
        cardPadding: '12px',
        sectionGap: '16px',
        gridGap: '12px',
        elementGap: '6px',
        itemGap: '3px',
        innerPaddingX: '10px',
        statIconSize: '40px',
        quickIconSize: '32px',
        statIconInner: 20,
        quickIconInner: 16,
      }
    case 'large':
      return {
        headingLarge: '28px',
        headingMedium: '20px',
        fontSizeBase: '15px',
        fontSizeSm: '14px',
        fontSizeXs: '13px',
        cardPadding: '28px',
        sectionGap: '32px',
        gridGap: '20px',
        elementGap: '10px',
        itemGap: '5px',
        innerPaddingX: '20px',
        statIconSize: '56px',
        quickIconSize: '48px',
        statIconInner: 28,
        quickIconInner: 24,
      }
    default:
      return {
        headingLarge: '24px',
        headingMedium: '18px',
        fontSizeBase: '14px',
        fontSizeSm: '13px',
        fontSizeXs: '12px',
        cardPadding: '20px',
        sectionGap: '24px',
        gridGap: '16px',
        elementGap: '8px',
        itemGap: '4px',
        innerPaddingX: '16px',
        statIconSize: '48px',
        quickIconSize: '40px',
        statIconInner: 24,
        quickIconInner: 20,
      }
  }
})

const userInfo = computed(() => userStore.getUserInfo())

const userName = computed(() => {
  const info = userStore.getUserInfo()
  return info?.nickname || info?.username || '用户'
})

const userRoleName = computed(() => {
  const info = userStore.getUserInfo()
  const roles = info?.roles || []
  if (roles.includes('supper_admin')) return '超级管理员'
  if (roles.includes('user')) return '普通用户'
  return '用户'
})

const showAdminStats = computed(() => hasAnyRole(['supper_admin']))

const greeting = computed(() => {
  const hour = dayjs().hour()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const currentTime = computed(() => {
  return dayjs().format('YYYY年MM月DD日 dddd')
})

const formatTime = (time?: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 统计卡片
const statCards = computed(() => [
  {
    label: '系统用户',
    value: loading.value ? '...' : userCount.value,
    icon: 'ep:user',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-500',
    valueColor: 'text-blue-600 dark:text-blue-400',
    link: '/system/user',
  },
  {
    label: '角色数量',
    value: loading.value ? '...' : roleCount.value,
    icon: 'ep:user-filled',
    iconBg: 'bg-green-50 dark:bg-green-900/30',
    iconColor: 'text-green-500',
    valueColor: 'text-green-600 dark:text-green-400',
    link: '/system/role',
  },
])

// 快捷入口（含权限过滤）
const allQuickActions = [
  {
    title: '系统管理',
    desc: '管理用户、角色和系统配置',
    icon: 'ep:setting',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-500',
    link: '/system',
    roles: ['supper_admin'] as string[],
  },
  {
    title: '个人资料',
    desc: '查看和修改个人信息',
    icon: 'ep:user',
    iconBg: 'bg-green-50 dark:bg-green-900/30',
    iconColor: 'text-green-500',
    link: '/profile',
    roles: [] as string[],
  },
  {
    title: '主题设置',
    desc: '自定义界面主题和配色方案',
    icon: 'ep:brush',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    iconColor: 'text-purple-500',
    link: '/system/theme',
    roles: ['supper_admin'] as string[],
  },
]

const quickActions = computed(() => {
  return allQuickActions.filter(item => {
    if (!item.roles || item.roles.length === 0) return true
    return hasAnyRole(item.roles)
  })
})

// 加载系统统计数据
const fetchSystemStats = async () => {
  if (!showAdminStats.value) return

  loading.value = true
  try {
    const [userResult, roleResult] = await Promise.allSettled([
      UserService.getUserList({ size: 1, current: 1 }),
      RoleService.getAllRoles(),
    ])

    if (userResult.status === 'fulfilled' && userResult.value) {
      userCount.value = Number(userResult.value.total) || 0
    }
    if (roleResult.status === 'fulfilled' && roleResult.value) {
      roleCount.value = roleResult.value.length
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSystemStats()
})
</script>

<style scoped>
.welcome-banner {
  min-height: 100px;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.quick-card {
  transition: all 0.3s ease;
}

.quick-card:hover {
  transform: translateY(-2px);
  border-color: var(--theme-primary);
}
</style>
