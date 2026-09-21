<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Icon } from '@iconify/vue';

defineOptions({
  name: "ChangeLogDialog"
});

interface ChangeLogVersion {
  version: string;
  date: string;
  newFeatures?: string[];
  fixes?: string[];
  optimizations?: string[];
}

interface ChangeLogData {
  versions: ChangeLogVersion[];
}

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const changeLogs = ref<ChangeLogVersion[]>([]);
const loading = ref(false);
const error = ref('');

// 加载更新日志
async function loadChangeLogs() {
  try {
    loading.value = true;
    error.value = '';

    // 使用本地日志，保持原有顺序
    const versions = window.changelog?.data?.versions || [];
    changeLogs.value = [...versions];
  } catch (err) {
    console.error('加载变更日志失败:', err);
    error.value = '加载变更日志失败';
  } finally {
    loading.value = false;
  }
}

// 关闭弹窗
function handleClose() {
  dialogVisible.value = false;
}

// 监听弹窗打开，加载数据
watch(() => props.modelValue, (newVal) => {
  if (newVal && changeLogs.value.length === 0) {
    loadChangeLogs();
  }
});
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="变更日志"
    width="50%"
    align-center
    :before-close="handleClose"
  >
    <div class="changelog-container">
      <div v-if="loading" class="loading-state">
        <span>加载中...</span>
      </div>
      
      <div v-else-if="error" class="error-state">
        <span>{{ error }}</span>
      </div>
      
      <div v-else-if="changeLogs.length === 0" class="empty-logs">
        暂无变更日志
      </div>
      
      <div v-else class="changelog-list">
        <div v-for="log in changeLogs" :key="log.version" class="changelog-item">
          <div class="changelog-header">
            <span class="version-tag">v{{ log.version }}</span>
            <span class="release-date">{{ log.date }}</span>
          </div>
          <div v-if="log.newFeatures && log.newFeatures.length > 0" class="changelog-section">
            <div class="section-title">
              <Icon icon="ep:circle-plus" class="new-feature-icon" />
              <span>功能新增</span>
            </div>
            <ul class="changelog-features">
              <li v-for="(feature, index) in log.newFeatures" :key="'nf-' + index">
                {{ feature }}
              </li>
            </ul>
          </div>
          <div v-if="log.fixes && log.fixes.length > 0" class="changelog-section">
            <div class="section-title">
              <Icon icon="mdi:bug" class="fix-icon" />
              <span>功能修复</span>
            </div>
            <ul class="changelog-features">
              <li v-for="(fix, index) in log.fixes" :key="'fx-' + index">
                {{ fix }}
              </li>
            </ul>
          </div>
          <div v-if="log.optimizations && log.optimizations.length > 0" class="changelog-section">
            <div class="section-title">
              <Icon icon="ep:refresh" class="optimize-icon" />
              <span>体验优化</span>
            </div>
            <ul class="changelog-features">
              <li v-for="(opt, index) in log.optimizations" :key="'opt-' + index">
                {{ opt }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.changelog-container {
  max-height: 400px;
  overflow-y: auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 12px;
  color: #909399;
}

.empty-logs {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.changelog-list {
  padding: 10px 0;
}

.changelog-item {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.changelog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.version-tag {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.release-date {
  font-size: 12px;
  color: #909399;
}

.changelog-section {
  margin-bottom: 16px;
}

.changelog-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.new-feature-icon {
  margin-right: 6px;
  color: #67c23a;
  width: 16px;
  height: 16px;
}

.fix-icon {
  margin-right: 6px;
  color: #409eff;
  width: 16px;
  height: 16px;
}

.changelog-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.changelog-features li {
  position: relative;
  padding-left: 20px;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.changelog-features li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #409eff;
  font-weight: bold;
}

.changelog-features li:last-child {
  margin-bottom: 0;
}
</style>
