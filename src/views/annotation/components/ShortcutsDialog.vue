<template>
  <el-dialog
    v-model="dialogVisible"
    title="快捷键操作"
    width="800px"
    :close-on-click-modal="true"
    @close="handleClose"
  >
    <div class="shortcuts-list">
      <div class="shortcuts-row">
        <div v-for="(group, groupName) in shortcutsGrouped" :key="groupName" class="shortcut-group">
          <div class="group-title">{{ groupName }}</div>
          <div class="shortcut-items">
            <div v-for="shortcut in group" :key="shortcut.key" class="shortcut-item">
              <div class="shortcut-key">
                <kbd>{{ shortcut.key }}</kbd>
              </div>
              <div class="shortcut-desc">
                <span class="shortcut-name">{{ shortcut.name }}</span>
                <span class="shortcut-description">{{ shortcut.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button type="primary" @click="handleClose">知道了</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

export interface ShortcutItem {
  key: string
  name: string
  description: string
}

export interface ShortcutsGroup {
  [groupName: string]: ShortcutItem[]
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const dialogVisible = ref(false)

// 快捷键列表（按功能分组）
const shortcutsGrouped = computed<ShortcutsGroup>(() => ({
  '题目操作': [
    { key: 'Q', name: '快速新增题目', description: '在当前目录下快速新增一个空白题目' },
    { key: '1-6', name: '切换题目类型', description: '1-选择题 2-多选题 3-填空题 4-判断题 5-问答题 6-组合题' },
    { key: 'B', name: '编辑模式', description: '切换到题目编辑模式（仅在编辑面板打开时生效）' },
    { key: 'Y', name: '预览模式', description: '切换到题目预览模式（仅在编辑面板打开时生效）' }
  ],
  '标注操作': [
    { key: 'D', name: '删除标注', description: '快速删除选中的标注' },
    { key: 'T + 右键拖拽', name: '标注题干', description: '按住 T 键并右键拖拽，选框标注为题干' },
    { key: 'A + 右键拖拽', name: '标注答案', description: '按住 A 键并右键拖拽，选框标注为答案' },
    { key: 'Z + 右键拖拽', name: '标注解析', description: '按住 Z 键并右键拖拽，选框标注为解析' },
    { key: 'C + 右键拖拽', name: '标注选项', description: '按住 C 键并右键拖拽，选框标注为选项' }
  ]
}))

// 监听 visible 变化
watch(() => props.visible, (val) => {
  dialogVisible.value = val
})

// 监听 dialogVisible 变化
watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 暴露快捷键列表供外部使用
defineExpose({
  shortcutsGrouped
})
</script>

<style scoped>
.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shortcuts-row {
  display: flex;
  gap: 40px;
}

.shortcuts-row .shortcut-group {
  flex: 1;
}

.shortcut-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.shortcut-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.shortcut-key {
  flex-shrink: 0;
}

.shortcut-key kbd {
  display: inline-block;
  padding: 4px 10px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #409eff;
  background-color: #ecf5ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  min-width: 40px;
  text-align: center;
}

.shortcut-desc {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.shortcut-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.shortcut-description {
  font-size: 13px;
  color: #606266;
  line-height: 1.4;
}
</style>
