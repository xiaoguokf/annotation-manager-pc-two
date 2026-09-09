<template>
  <el-dialog
    v-model="dialogVisible"
    title="节点管理"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <div class="node-management-dialog">
      <!-- 切换模式 -->
      <div class="mode-section">
        <h3 class="section-title">切换模式</h3>
        <el-radio-group v-model="currentModeString" @change="handleModeChange">
          <el-radio value="auto" border size="large">
            <div class="mode-option">
              <el-icon>
                <Icon icon="ep:cpu" />
              </el-icon>
              <div>
                <div class="mode-title">自动模式</div>
                <div class="mode-desc">网络超时自动切换到备用节点</div>
              </div>
            </div>
          </el-radio>
          <el-radio value="manual" border size="large">
            <div class="mode-option">
              <el-icon>
                <Icon icon="ep:user" />
              </el-icon>
              <div>
                <div class="mode-title">手动模式</div>
                <div class="mode-desc">手动选择要使用的节点</div>
              </div>
            </div>
          </el-radio>
        </el-radio-group>
      </div>

      <!-- 节点列表 -->
      <div class="nodes-section">
        <h3 class="section-title">可用节点列表</h3>
        <div class="nodes-list">
          <!-- 主节点 -->
          <div class="node-item main-node" :class="{ selected: isMainNodeSelected }">
            <div class="node-info">
              <el-icon class="node-icon" :class="{ online: true }">
                <Icon icon="ep:home-filled" />
              </el-icon>
              <div class="node-details">
                <div class="node-name">主节点</div>
                <div class="node-url">{{ mainNodeUrl }}</div>
                <div class="node-status">
                  <span class="status-badge online">在线</span>
                </div>
              </div>
            </div>
            <div class="node-actions">
              <el-radio v-model="selectedNodeCodeString" value="" :disabled="currentModeString === 'auto'" @change="handleNodeSelect">
                选择
              </el-radio>
            </div>
          </div>

          <!-- 备用节点 -->
          <div
            v-for="node in nodes"
            :key="node.code"
            class="node-item backup-node"
            :class="{ selected: selectedNodeCodeString === (node.code || ''), offline: !getNodeStatus(node.code || '')?.isOnline }"
          >
            <div class="node-info">
              <el-icon class="node-icon" :class="{ online: getNodeStatus(node.code || '')?.isOnline, offline: !getNodeStatus(node.code || '')?.isOnline }">
                <Icon icon="ep:connection" />
              </el-icon>
              <div class="node-details">
                <div class="node-name">
                  {{ node.code || '未命名节点' }}
                  <template v-if="getNodeStatus(node.code || '')?.isOnline === false">
                    <el-tooltip content="该节点当前不可用">
                      <el-icon class="warning-icon">
                        <Icon icon="ep:warning" />
                      </el-icon>
                    </el-tooltip>
                  </template>
                </div>
                <div class="node-url">{{ node.url }}</div>
                <div class="node-status">
                  <span class="status-badge" :class="getNodeStatus(node.code || '')?.isOnline ? 'online' : 'offline'">
                    {{ getNodeStatus(node.code || '')?.isOnline ? '在线' : '离线' }}
                  </span>
                  <span v-if="getNodeStatus(node.code || '')?.lastCheckTime" class="last-check">
                    上次检查：{{ formatTime(getNodeStatus(node.code || '')!.lastCheckTime!) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="node-actions">
              <el-radio
                v-model="selectedNodeCodeString"
                :value="node.code || ''"
                :disabled="currentModeString === 'auto' || !getNodeStatus(node.code || '')?.isOnline"
                @change="handleNodeSelect"
              >
                选择
              </el-radio>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前状态 -->
      <div class="current-status-section">
        <h3 class="section-title">当前状态</h3>
        <div class="current-status">
          <div class="status-item">
            <span class="status-label">当前模式：</span>
            <span class="status-value">{{ currentMode === 'auto' ? '自动模式' : '手动模式' }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">当前节点：</span>
            <span class="status-value">
              <template v-if="nodeStore.isMainNode">
                主节点
              </template>
              <template v-else>
                {{ getSelectedNodeName() }}
              </template>
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">节点URL：</span>
            <span class="status-value url">{{ nodeStore.currentNodeUrl || '未设置' }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleRefresh" :loading="refreshing">
          <el-icon>
            <Icon icon="ep:refresh" />
          </el-icon>
          刷新状态
        </el-button>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存设置
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useNodeStore, type NodeSwitchMode, type AtdNode } from '@/stores/node'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const nodeStore = useNodeStore()

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 当前模式（使用字符串值以便与el-radio-group兼容）
const currentModeString = ref<string>(nodeStore.switchMode)

// 选中的节点代码（使用字符串值，空字符串表示主节点）
const selectedNodeCodeString = ref<string>(nodeStore.selectedNodeCode || '')

// 加载状态
const refreshing = ref(false)
const saving = ref(false)

// 主节点URL
const mainNodeUrl = computed(() => {
  const envUrl = import.meta.env.VITE_API_URL
  return envUrl || '/api'
})

// 节点列表
const nodes = computed(() => nodeStore.nodes)

// 计算属性：获取当前模式的正确类型
const currentMode = computed<NodeSwitchMode>(() => {
  return currentModeString.value as NodeSwitchMode
})

// 计算属性：获取选中的节点代码（null表示主节点）
const selectedNodeCode = computed(() => {
  return selectedNodeCodeString.value === '' ? null : selectedNodeCodeString.value
})

// 是否选择了主节点
const isMainNodeSelected = computed(() => selectedNodeCodeString.value === '')

// 获取节点状态
const getNodeStatus = (nodeCode: string) => {
  return nodeStore.getNodeStatus(nodeCode)
}

// 获取选中的节点名称
const getSelectedNodeName = () => {
  if (selectedNodeCode.value) {
    const node = nodes.value.find(n => n.code === selectedNodeCode.value)
    return node?.code || '未知节点'
  }
  return '主节点'
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

// 处理模式变化
const handleModeChange = (mode: string | number | boolean | undefined) => {
  const modeStr = String(mode)
  currentModeString.value = modeStr
  // 如果是自动模式，不清空选中的节点（保持当前选择）
  // 如果当前节点URL为空，根据选中的节点设置当前节点URL
  if (modeStr === 'auto' && !nodeStore.currentNodeUrl) {
    if (selectedNodeCodeString.value) {
      // 选中了备用节点
      const node = nodes.value.find(n => n.code === selectedNodeCodeString.value)
      if (node?.url) {
        nodeStore.setCurrentNodeInfo(node.url, false)
      }
    } else {
      // 选中主节点
      nodeStore.setCurrentNodeInfo(mainNodeUrl.value, true)
    }
  }
}

// 处理节点选择
const handleNodeSelect = () => {
  // 如果选择了主节点（空字符串），确保模式是手动模式
  if (selectedNodeCodeString.value === '') {
    currentModeString.value = 'manual'
  }
}

// 处理刷新状态
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await nodeStore.checkAllNodesStatus()
    ElMessage.success('节点状态已刷新')
  } catch (error) {
    ElMessage.error('刷新节点状态失败')
  } finally {
    refreshing.value = false
  }
}

// 处理保存设置
const handleSave = async () => {
  saving.value = true
  try {
    // 更新节点切换模式
    nodeStore.setSwitchMode(currentMode.value)

    // 根据模式更新选中的节点和当前节点URL
    if (currentMode.value === 'manual') {
      // 手动模式：记录用户选中的节点
      nodeStore.setSelectedNode(selectedNodeCode.value)

      if (selectedNodeCode.value) {
        // 手动模式且选择了备用节点
        const node = nodes.value.find(n => n.code === selectedNodeCode.value)
        if (node?.url) {
          nodeStore.setCurrentNodeInfo(node.url, false)
        }
      } else {
        // 手动模式且选择主节点
        nodeStore.setCurrentNodeInfo(mainNodeUrl.value, true)
      }
    } else {
      // 自动模式：清除选中的节点（自动模式下不需要手动选择）
      // 保持当前正在使用的节点不变（主节点或备用节点）
      nodeStore.setSelectedNode(null)

      // 如果当前节点URL为空或不是备用节点，使用主节点
      if (!nodeStore.currentNodeUrl || nodeStore.isMainNode) {
        nodeStore.setCurrentNodeInfo(mainNodeUrl.value, true)
      }
      // 否则保持当前使用的备用节点不变
    }

    ElMessage.success('设置已保存')
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

// 处理关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 监听对话框显示
watch(dialogVisible, (visible) => {
  if (visible) {
    // 初始化当前值
    currentModeString.value = nodeStore.switchMode

    // 根据模式决定选中的节点
    if (currentModeString.value === 'auto') {
      // 自动模式：如果当前是主节点，显示选中主节点；如果当前是备用节点，显示选中的备用节点
      if (nodeStore.isMainNode) {
        // 当前使用主节点，显示选中主节点
        selectedNodeCodeString.value = ''
      } else {
        // 当前使用备用节点，根据当前URL找到对应的节点
        const currentNodeUrl = nodeStore.currentNodeUrl
        const matchedNode = nodes.value.find(n => n.url === currentNodeUrl)
        selectedNodeCodeString.value = matchedNode?.code || ''
      }
    } else {
      // 手动模式：使用上次选中的节点（从localStorage读取）
      selectedNodeCodeString.value = nodeStore.selectedNodeCode || ''

      // 如果selectedNodeCode为空，尝试根据当前URL推断
      if (!selectedNodeCodeString.value && !nodeStore.isMainNode) {
        const currentNodeUrl = nodeStore.currentNodeUrl
        const matchedNode = nodes.value.find(n => n.url === currentNodeUrl)
        if (matchedNode?.code) {
          selectedNodeCodeString.value = matchedNode.code
        }
      }
    }
  }
})
</script>

<style scoped>
.node-management-dialog {
  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #333;
  }

  .mode-section {
    margin-bottom: 24px;
  }

  .mode-option {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 8px 0;

    .el-icon {
      font-size: 24px;
      color: #3b82f6;
    }

    .mode-title {
      font-weight: 600;
      font-size: 14px;
    }

    .mode-desc {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }
  }

  .nodes-section {
    margin-bottom: 24px;
  }

  .nodes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .node-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s;

    &.selected {
      border-color: #3b82f6;
      background-color: rgba(59, 130, 246, 0.05);
    }

    &.main-node {
      background-color: rgba(59, 130, 246, 0.1);
    }

    &.backup-node.offline {
      opacity: 0.6;
      border-color: #f87171;
    }
  }

  .node-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .node-icon {
    font-size: 24px;

    &.online {
      color: #10b981;
    }

    &.offline {
      color: #f87171;
    }
  }

  .node-details {
    flex: 1;

    .node-name {
      font-weight: 600;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;

      .warning-icon {
        color: #f59e0b;
        font-size: 14px;
      }
    }

    .node-url {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
      word-break: break-all;
    }

    .node-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }
  }

  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;

    &.online {
      background-color: #d1fae5;
      color: #059669;
    }

    &.offline {
      background-color: #fee2e2;
      color: #dc2626;
    }
  }

  .last-check {
    font-size: 12px;
    color: #666;
  }

  .node-actions {
    margin-left: 12px;
  }

  .current-status-section {
    border-top: 1px solid #e5e7eb;
    padding-top: 16px;
  }

  .current-status {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-label {
    font-weight: 500;
    font-size: 14px;
    color: #333;
    min-width: 80px;
  }

  .status-value {
    font-size: 14px;
    color: #666;

    &.url {
      word-break: break-all;
      font-family: monospace;
      background-color: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }

  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style>
