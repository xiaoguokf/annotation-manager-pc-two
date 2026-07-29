<template>
  <el-dialog
    :model-value="modelValue"
    :title="detail ? (detail.title || '公告详情') : '公告中心'"
    width="760px"
    top="8vh"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <div class="ann-dialog">
      <!-- 左侧公告列表 -->
      <div class="ann-list">
        <div class="ann-list__header">公告列表</div>
        <el-scrollbar v-if="list.length" class="ann-list__scroll">
          <div
            v-for="item in list"
            :key="item.id"
            class="ann-list__item"
            :class="{ 'is-active': detail?.id === item.id }"
            @click="openDetail(item)"
          >
            <div class="ann-list__title">{{ item.title }}</div>
            <div class="ann-list__meta">
              <el-tag v-if="item.isTop" size="small" type="danger" effect="plain">置顶</el-tag>
              <span>{{ formatTime(item.createTime) }}</span>
            </div>
          </div>
        </el-scrollbar>
        <el-empty v-else description="暂无公告" :image-size="80" />
      </div>

      <!-- 右侧公告详情 -->
      <div class="ann-detail">
        <template v-if="detail">
          <div class="ann-detail__title">{{ detail.title }}</div>
          <div class="ann-detail__meta">
            <span v-if="detail.isTop" class="ann-tag ann-tag--top">置顶</span>
            <span>发布时间：{{ formatTime(detail.createTime) }}</span>
          </div>
          <!-- 富文本内容，管理员维护，按原样渲染 -->
          <div class="ann-detail__content" v-html="detail.content"></div>
        </template>
        <el-empty v-else description="请选择左侧公告查看详情" />
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { AnnouncementService } from '@/services/announcementService'
import type { AnnouncementVO } from '@/api/gen/announcementController'
import dayjs from 'dayjs'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    initialId?: string
  }>(),
  { modelValue: false, initialId: '' }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const loading = ref(false)
const list = ref<AnnouncementVO[]>([])
const detail = ref<AnnouncementVO | null>(null)

const formatTime = (time?: string) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await AnnouncementService.getUserAnnouncementList({ current: 1, size: 50 })
    list.value = res?.records || []
  } finally {
    loading.value = false
  }
}

// 点击列表项：请求详情并展示
const openDetail = async (item: AnnouncementVO) => {
  const res = await AnnouncementService.getUserAnnouncementDetail(item.id!)
  detail.value = res
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      fetchList().then(() => {
        const target = props.initialId
          ? list.value.find((i) => i.id === props.initialId)
          : list.value[0]
        if (target) openDetail(target)
        else detail.value = null
      })
    }
  }
)
</script>

<style scoped>
.ann-dialog {
  display: flex;
  height: 60vh;
  gap: 12px;
}

.ann-list {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
}

.ann-list__header {
  font-weight: 600;
  font-size: 14px;
  padding: 4px 8px 10px;
  color: var(--el-text-color-primary);
}

.ann-list__scroll {
  flex: 1;
}

.ann-list__item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 4px;
}

.ann-list__item:hover {
  background: var(--el-fill-color-light);
}

.ann-list__item.is-active {
  background: var(--el-color-primary-light-9);
}

.ann-list__title {
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ann-list__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ann-detail {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.ann-detail__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.ann-detail__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color);
}

.ann-tag {
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.ann-tag--top {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.ann-detail__content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.ann-detail__content :deep(img) {
  max-width: 100%;
  height: auto;
}

.ann-detail__content :deep(a) {
  color: var(--el-color-primary);
}

.ann-detail__content :deep(h2) {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0.4em 0;
}

.ann-detail__content :deep(ul),
.ann-detail__content :deep(ol) {
  padding-left: 1.5em;
  margin: 0.4em 0;
}

.ann-detail__content :deep(blockquote) {
  border-left: 3px solid var(--el-border-color);
  margin: 0.4em 0;
  padding-left: 1em;
  color: var(--el-text-color-secondary);
}

.ann-detail__content :deep(pre) {
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 0.6em 0.8em;
  overflow-x: auto;
  font-family: monospace;
}
</style>
