<template>
  <div class="deliver-docx-preview">
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="项目ID">
          <el-input
            v-model="projectId"
            placeholder="请输入项目ID"
            clearable
            style="width: 260px"
            @keyup.enter="handlePreview"
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="withSubQuestion" label="包含子题" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="previewing" @click="handlePreview">
            <el-icon><Icon icon="ep:view" /></el-icon>
            预览
          </el-button>
          <el-button type="success" :loading="exporting" :disabled="!previewData" @click="handleExport">
            <el-icon><Icon icon="ep:download" /></el-icon>
            导出ZIP
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="4">
        <el-card shadow="never">
          <div class="stat-title">学段</div>
          <div class="stat-value">{{ phaseText }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never">
          <div class="stat-title">学科</div>
          <div class="stat-value">{{ previewData?.subject ?? '-' }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never">
          <div class="stat-title">册次</div>
          <div class="stat-value">{{ previewData?.volume || '-' }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never">
          <div class="stat-title">节点数</div>
          <div class="stat-value">{{ nodeCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never">
          <div class="stat-title">题量</div>
          <div class="stat-value">{{ questionCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="never">
          <div class="stat-title">教辅名称</div>
          <div class="stat-value ellipsis" :title="previewData?.supTreeName">
            {{ previewData?.supTreeName || '-' }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <span>教辅树</span>
          </template>
          <el-tree
            :data="treeData"
            :props="{ label: 'label', children: 'children' }"
            default-expand-all
            node-key="key"
          >
            <template #default="{ data }">
              <span class="tree-node">
                <span class="tree-node-name">{{ data.label }}</span>
                <el-tag v-if="data.count" type="info" size="small">{{ data.count }} 题</el-tag>
              </span>
            </template>
          </el-tree>
          <el-empty v-if="treeData.length === 0" description="暂无数据" />
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>交付 JSON（docx 新格式）</span>
              <el-button v-if="previewJson" link type="primary" @click="handleCopy">复制</el-button>
            </div>
          </template>
          <el-input
            v-model="previewJson"
            type="textarea"
            readonly
            :rows="24"
            class="json-area"
          />
          <el-empty v-if="!previewJson" description="输入项目ID后点击预览" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import {
  getDeliverDocxExportApi,
  getDeliverDocxPreviewApi,
  type QuestionOutputVO,
  type SupTreeOutputVO,
  type SupTreeNodeOutputVO,
} from '@/api/gen/docxDeliver'
import { copyToClipboard } from '@/utils/clipboard'

/** el-tree 节点视图 */
interface TreeNode {
  key: string
  label: string
  count: number
  children?: TreeNode[]
}

const projectId = ref('')
const withSubQuestion = ref(true)
const previewing = ref(false)
const exporting = ref(false)
const previewJson = ref('')
const treeData = ref<TreeNode[]>([])
const nodeCount = ref(0)
const questionCount = ref(0)
const supTree = ref<SupTreeOutputVO | null>(null)
const previewData = computed(() => supTree.value)

const PHASE_TEXT: Record<number, string> = {
  1: '小学',
  2: '初中',
  3: '高中',
}

const phaseText = computed(() =>
  previewData.value?.phase ? PHASE_TEXT[previewData.value.phase] || String(previewData.value.phase) : '-',
)

/** 递归统计节点数与题量，并转换为 el-tree 需要的结构 */
const buildTree = (nodes: SupTreeNodeOutputVO[] = [], prefix = ''): TreeNode[] =>
  nodes.map((node, index) => {
    const children = buildTree(node.supTreeNodeChildren || [], `${prefix}-${index}`)
    // 题量 = 本级 questionList 内所有题目（含子题） + 下级节点题量
    const count =
      (node.questionList || []).reduce((sum, item) => sum + countQuestions(item.questions || []), 0) +
      children.reduce((sum, child) => sum + child.count, 0)

    nodeCount.value += 1
    return {
      key: `${prefix}-${index}`,
      label: node.supTreeNodeName || '未命名节点',
      count,
      children: children.length > 0 ? children : undefined,
    }
  })

/** 递归统计题目（含子题）数量 */
const countQuestions = (questions: QuestionOutputVO[] = []): number =>
  questions.reduce((sum, question) => sum + 1 + countQuestions(question.subQuestionList), 0)

const handlePreview = async () => {
  if (!projectId.value) {
    ElMessage.warning('请输入项目ID')
    return
  }

  previewing.value = true
  try {
    const res = await getDeliverDocxPreviewApi({
      projectId: projectId.value,
      withSubQuestion: withSubQuestion.value,
    })

    const payload = res.data?.code === 200 ? res.data.data : undefined
    supTree.value = payload ?? null
    previewJson.value = JSON.stringify(payload ?? {}, null, 2)

    nodeCount.value = 0
    treeData.value = buildTree(payload?.supTreeDetail || [])
    questionCount.value = treeData.value.reduce((sum, node) => sum + node.count, 0)

    if (!payload) {
      ElMessage.warning('未查询到该项目的数据')
    }
  } catch (error) {
    console.error('预览失败:', error)
    ElMessage.error('预览失败，请检查项目ID')
    supTree.value = null
    previewJson.value = ''
    treeData.value = []
  } finally {
    previewing.value = false
  }
}

const handleExport = async () => {
  if (!projectId.value) {
    ElMessage.warning('请输入项目ID')
    return
  }

  exporting.value = true
  try {
    await getDeliverDocxExportApi({
      projectId: projectId.value,
      withSubQuestion: withSubQuestion.value,
    })
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

const handleCopy = () => {
  // 复制结果由 copyToClipboard 统一提示
  copyToClipboard(previewJson.value)
}
</script>

<style scoped>
.deliver-docx-preview {
  padding: 4px;
}

.search-card {
  margin-bottom: 16px;
}

.stat-row {
  margin-bottom: 16px;
}

.stat-title {
  color: var(--el-text-color-secondary, #909399);
  font-size: 13px;
}

.stat-value {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 600;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-node-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.json-area :deep(.el-textarea__inner) {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
