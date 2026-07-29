<template>
  <div class="dashboard" :style="{ padding: sizeConfig.cardPadding }">
    <!-- 最新公告横幅（置顶显示） -->
    <div
      v-if="firstAnnouncement"
      class="ann-banner"
      :style="{ marginBottom: sizeConfig.sectionGap }"
      @click="openAnnouncement()"
    >
      <el-icon class="ann-banner__icon"><Icon icon="ep:bell" /></el-icon>
      <span class="ann-banner__label">最新公告</span>
      <span class="ann-banner__title">{{ firstAnnouncement.title }}</span>
      <span class="ann-banner__more">查看详情 ›</span>
    </div>

    <!-- 欢迎横幅 -->
    <div class="welcome-banner rounded-xl text-white shadow-lg relative overflow-hidden"
      :style="{ padding: sizeConfig.cardPadding, marginBottom: sizeConfig.sectionGap, background: `linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%)` }">
      <!-- 装饰圆 -->
      <div class="banner-deco-circle banner-deco-1"></div>
      <div class="banner-deco-circle banner-deco-2"></div>

      <div class="relative flex items-start justify-between flex-wrap" :style="{ gap: sizeConfig.gridGap }">
        <div class="min-w-0 flex-1" :style="{ minWidth: '260px' }">
          <!-- 主标题 - 跟随选中节日 -->
          <h1 class="font-bold tracking-tight" :style="{ fontSize: sizeConfig.headingLarge, marginBottom: sizeConfig.itemGap, lineHeight: '1.3' }">
            {{ activeFestival ? activeFestival.greeting : greeting }}
            <span class="text-white/80 font-medium">，{{ userName }}</span>
          </h1>

          <!-- 时间 + 节日徽章组（可点击切换） -->
          <div class="flex items-center flex-wrap" :style="{ gap: sizeConfig.elementGap, fontSize: sizeConfig.fontSizeBase, marginBottom: activeFestival ? sizeConfig.elementGap : 0 }">
            <span class="text-white/70">{{ currentTime }}</span>
            <template v-if="festivals.length">
              <span class="text-white/40">·</span>
              <button
                v-for="(f, i) in festivals"
                :key="f.name"
                type="button"
                class="banner-badge"
                :class="{ 'banner-badge-active': i === activeFestivalIndex, 'banner-badge-ghost': i !== activeFestivalIndex }"
                @click="activeFestivalIndex = i"
              >
                {{ f.name }}
              </button>
            </template>
          </div>

          <!-- 节日介绍 - 引用块（跟随选中节日，带淡入动画） -->
          <transition name="desc-fade" mode="out-in">
            <div v-if="activeFestival" :key="activeFestival.name" class="banner-desc" :style="{ fontSize: sizeConfig.fontSizeSm, maxWidth: '640px' }">
              {{ activeFestival.description }}
            </div>
          </transition>
        </div>

        <!-- 右侧角色卡 -->
        <div class="flex items-center" :style="{ gap: sizeConfig.elementGap }">
          <div class="banner-role-card">
            <div class="text-white/60" :style="{ fontSize: sizeConfig.fontSizeXs, marginBottom: '2px' }">当前角色</div>
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
          class="stat-card bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
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
          class="quick-card bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group"
          :style="{ padding: sizeConfig.cardPadding }"
          @click="item.link && router.push(item.link)">
          <div class="flex items-start" :style="{ gap: sizeConfig.gridGap }">
            <div :class="[item.iconBg, 'rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform']"
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
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xs border border-gray-100 dark:border-gray-700" :style="{ padding: sizeConfig.cardPadding }">
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

  <!-- 公告查看对话框 -->
  <AnnouncementDialog v-model="announcementVisible" :initial-id="firstAnnouncement?.id || ''" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AnnouncementDialog from '@/components/AnnouncementDialog.vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { UserService } from '@/services/userService'
import { RoleService } from '@/services/roleService'
import { AnnouncementService } from '@/services/announcementService'
import type { AnnouncementVO } from '@/api/gen/announcementController'
import { hasAnyRole } from '@/utils/auth'
import dayjs from 'dayjs'
import { FestivalService } from '@/utils/festival'

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

// 公告横幅相关
const announcementVisible = ref(false)
const firstAnnouncement = ref<AnnouncementVO | null>(null)

// 打开公告抽屉（定位到首条公告，由 initial-id 控制）
const openAnnouncement = () => {
  announcementVisible.value = true
}

// 加载最新一条启用公告
const fetchFirstAnnouncement = async () => {
  try {
    const res = await AnnouncementService.getUserAnnouncementList({ current: 1, size: 1 })
    firstAnnouncement.value = res?.records?.[0] || null
  } catch {
    // 加载失败静默忽略
  }
}

const greeting = computed(() => {
  const hour = dayjs().hour()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const currentTime = computed(() => {
  const d = dayjs()
  return `${d.format('YYYY年MM月DD日')} ${weekDays[d.day()]}`
})

// 今日命中的所有节日（按优先级倒序）
const festivals = computed(() => FestivalService.getFestivals())
// 当前选中的节日索引（默认 0，即最高优先级节日）
const activeFestivalIndex = ref(0)
// 当前选中的节日
const activeFestival = computed(() => festivals.value[activeFestivalIndex.value] || null)

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
  fetchFirstAnnouncement()
})
</script>

<style scoped>
.welcome-banner {
  min-height: 100px;
}

/* 装饰圆 - 营造氛围感 */
.banner-deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}

.banner-deco-1 {
  width: 220px;
  height: 220px;
  top: -110px;
  right: -60px;
}

.banner-deco-2 {
  width: 140px;
  height: 140px;
  bottom: -70px;
  right: 120px;
  background: rgba(255, 255, 255, 0.05);
}

/* 节日徽章 - 默认（未选中）描边幽灵态 */
.banner-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85em;
  font-weight: 500;
  line-height: 1.5;
  cursor: pointer;
  transition: all 0.2s ease;
}

.banner-badge:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.95);
}

/* 节日徽章 - 选中态：实心高亮 */
.banner-badge-active {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(255, 255, 255, 0.95);
  color: var(--theme-primary);
  font-weight: 600;
}

.banner-badge-active:hover {
  background: rgba(255, 255, 255, 1);
  color: var(--theme-primary-dark);
}

/* 兼容旧 class（已弃用，但保留避免其他地方引用报错） */
.banner-badge-ghost {
  /* 默认即幽灵态 */
}

/* 节日介绍 - 左侧引用线 */
.banner-desc {
  position: relative;
  padding-left: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-style: italic;
  line-height: 1.7;
}

.banner-desc::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.5);
}

/* 右侧角色卡 */
.banner-role-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  text-align: center;
  padding: 10px 18px;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

/* 最新公告横幅 */
.ann-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  /* 仅以 8% 主题色混入背景，橙色等深色主题下也不刺眼 */
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
  border-radius: 8px;
  cursor: pointer;
  color: var(--el-text-color-primary);
  transition: all 0.2s ease;
}

.ann-banner:hover {
  background: color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color));
}

.ann-banner__icon {
  color: var(--el-color-primary);
  font-size: 16px;
  flex-shrink: 0;
}

.ann-banner__label {
  font-weight: 600;
  color: var(--el-color-primary);
  flex-shrink: 0;
  font-size: 14px;
}

.ann-banner__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.ann-banner__more {
  flex-shrink: 0;
  color: var(--el-color-primary);
  font-size: 13px;
}

.quick-card {
  transition: all 0.3s ease;
}

.quick-card:hover {
  transform: translateY(-2px);
  border-color: var(--theme-primary);
}

/* 节日介绍切换淡入动画 */
.desc-fade-enter-active,
.desc-fade-leave-active {
  transition: all 0.25s ease;
}

.desc-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.desc-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
