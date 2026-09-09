<template>
  <div class="statistics-overview">
    <!-- 数据卡片 -->
    <el-row :gutter="20" class="data-cards">
      <el-col :span="6">
        <el-card class="data-card">
          <div class="card-content">
            <div class="card-icon user">
              <el-icon size="32"><Icon icon="ep:user" /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">用户总数</div>
              <div class="card-value">1,234</div>
              <div class="card-trend up">+12.5%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card">
          <div class="card-content">
            <div class="card-icon order">
              <el-icon size="32"><Icon icon="ep:shopping-cart" /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">订单总数</div>
              <div class="card-value">5,678</div>
              <div class="card-trend up">+8.2%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card">
          <div class="card-content">
            <div class="card-icon revenue">
              <el-icon size="32"><Icon icon="ep:money" /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">总收入</div>
              <div class="card-value">¥89,012</div>
              <div class="card-trend down">-2.3%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card">
          <div class="card-content">
            <div class="card-icon visit">
              <el-icon size="32"><Icon icon="ep:view" /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">访问量</div>
              <div class="card-value">23,456</div>
              <div class="card-trend up">+15.8%</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-area">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>访问趋势</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
                <el-radio-button label="year">本年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-placeholder">
            <el-empty description="图表组件待集成" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>用户分布</span>
          </template>
          <div class="chart-placeholder">
            <el-empty description="图表组件待集成" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

defineOptions({
  name: "AnnotationStatisticsOverview"
})

const timeRange = ref('week')
</script>

<style scoped>


.data-cards {
  margin-bottom: 20px;
}

.data-card {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.data-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #fff;
}

.card-icon.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-icon.order {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-icon.revenue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-icon.visit {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.card-trend {
  font-size: 12px;
}

.card-trend.up {
  color: #67c23a;
}

.card-trend.down {
  color: #f56c6c;
}

.chart-area {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
