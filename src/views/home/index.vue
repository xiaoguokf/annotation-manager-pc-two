<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <el-card class="welcome-card">
      <div class="welcome-content">
        <div class="welcome-info">
          <h1>欢迎回来，{{ userInfo?.nickname || userInfo?.username || '管理员' }}！</h1>
          <p class="welcome-desc">今天是 {{ currentDate }}，祝您工作愉快！</p>
        </div>
        <div class="welcome-avatar">
          <el-avatar :size="80" :src="userInfo?.avatar || avatar" />
        </div>
      </div>
    </el-card>

    <!-- 快捷操作 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="6">
        <el-card class="action-card" @click="navigateTo('/system/user')">
          <div class="action-content">
            <el-icon class="action-icon" size="32"><Icon icon="ep:user" /></el-icon>
            <div class="action-text">
              <div class="action-title">用户管理</div>
              <div class="action-desc">管理系统用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="action-card" @click="navigateTo('/system/role')">
          <div class="action-content">
            <el-icon class="action-icon" size="32"><Icon icon="ep:user-filled" /></el-icon>
            <div class="action-text">
              <div class="action-title">角色管理</div>
              <div class="action-desc">管理用户角色</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="action-card" @click="navigateTo('/statistics/overview')">
          <div class="action-content">
            <el-icon class="action-icon" size="32"><Icon icon="ep:trend-charts" /></el-icon>
            <div class="action-text">
              <div class="action-title">数据概览</div>
              <div class="action-desc">查看数据统计</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="action-card" @click="navigateTo('/statistics/report')">
          <div class="action-content">
            <el-icon class="action-icon" size="32"><Icon icon="ep:document" /></el-icon>
            <div class="action-text">
              <div class="action-title">报表管理</div>
              <div class="action-desc">生成和查看报表</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统信息 -->
    <el-row :gutter="20" class="system-info">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统信息</span>
          </template>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">系统版本：</span>
              <span class="info-value">v1.0.0</span>
            </div>
            <div class="info-item">
              <span class="info-label">Vue版本：</span>
              <span class="info-value">3.5.22</span>
            </div>
            <div class="info-item">
              <span class="info-label">Element Plus版本：</span>
              <span class="info-value">2.11.8</span>
            </div>
            <div class="info-item">
              <span class="info-label">运行环境：</span>
              <span class="info-value">Node.js 20+</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近活动</span>
          </template>
          <div class="activity-list">
            <div class="activity-item">
              <el-icon class="activity-icon"><Icon icon="ep:clock" /></el-icon>
              <div class="activity-content">
                <div class="activity-title">系统启动</div>
                <div class="activity-time">2024-01-27 10:00:00</div>
              </div>
            </div>
            <div class="activity-item">
              <el-icon class="activity-icon"><Icon icon="ep:user" /></el-icon>
              <div class="activity-content">
                <div class="activity-title">用户登录</div>
                <div class="activity-time">2024-01-27 09:30:00</div>
              </div>
            </div>
            <div class="activity-item">
              <el-icon class="activity-icon"><Icon icon="ep:document" /></el-icon>
              <div class="activity-content">
                <div class="activity-title">报表生成</div>
                <div class="activity-time">2024-01-27 09:15:00</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Icon } from '@iconify/vue'
import avatar from '@/assets/user.png'
defineOptions({
  name: 'AnnotationHome'
})

const router = useRouter()
const userStore = useUserStore()

// 用户信息 - 直接使用 store 中的 ref，确保响应式更新
const userInfo = computed(() => userStore.userInfo)

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }
  return now.toLocaleDateString('zh-CN', options)
})

// 导航到指定页面
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<style scoped>


.welcome-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
}

.welcome-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.welcome-info h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.welcome-desc {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.quick-actions {
  margin-bottom: 20px;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.action-content {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.action-icon {
  margin-right: 16px;
  color: #409EFF;
}

.action-text {
  flex: 1;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 14px;
  color: #909399;
}

.system-info {
  margin-bottom: 20px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-label {
  color: #606266;
}

.info-value {
  color: #303133;
  font-weight: 500;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-icon {
  color: #409EFF;
  font-size: 16px;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

/* 覆盖Element Plus卡片样式 */
:deep(.welcome-card .el-card__body) {
  padding: 30px;
}
</style>

