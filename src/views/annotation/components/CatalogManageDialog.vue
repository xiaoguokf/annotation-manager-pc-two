<template>
  <el-dialog
    v-model="dialogVisible"
    width="900px"
    @close="handleClose"
    draggable
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">目录管理</span>
      </div>
    </template>
    <div class="catalog-manage-container">
      <div class="mb-4 flex flex-wrap gap-2">
        <el-button type="primary" :disabled="isDragMode" @click="handleAddRoot">
          <Icon icon="ep:plus" class="mr-1" />
          添加根目录
        </el-button>
        <el-button type="primary" :disabled="!selectedCatalog || (selectedCatalog.level || 0) >= 4 || isDragMode" @click="handleAddChild">
          <Icon icon="ep:plus" class="mr-1" />
          添加子目录
        </el-button>
        <el-button type="primary" :disabled="!selectedCatalog || isDragMode" @click="handleEdit">
          <Icon icon="ep:edit" class="mr-1" />
          编辑目录
        </el-button>
        <el-button type="danger" :disabled="!selectedCatalog || isDragMode" @click="handleDelete">
          <Icon icon="ep:delete" class="mr-1" />
          删除目录
        </el-button>
        <el-button type="warning" @click="handleToggleDragMode">
          <Icon :icon="isDragMode ? 'ep:check' : 'ep:rank'" class="mr-1" />
          {{ isDragMode ? '完成移动' : '移动目录' }}
        </el-button>
        <el-divider direction="vertical" />
        <el-button type="success" :disabled="isDragMode" @click="handleOpenJsonParse">
          <Icon icon="ep:magic-stick" class="mr-1" />
          JSON 自动解析
        </el-button>
        <el-button type="danger" :disabled="isDragMode" @click="handleClearCatalogs">
          <Icon icon="ep:delete" class="mr-1" />
          清空目录
        </el-button>
      </div>

      <!-- 左侧目录树 -->
      <div class="catalog-layout">
        <div class="catalog-tree-section">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            :loading="loading"
            node-key="id"
            :expand-on-click-node="false"
            :draggable="isDragMode"
            highlight-current
            :allow-drop="allowDrop"
            @node-click="handleNodeClick"
            @node-expand="handleNodeExpand"
            @node-collapse="handleNodeCollapse"
            @node-drop="handleNodeDrop"
          >
            <template #default="{ node, data }">
              <div class="tree-node-content">
                <span class="node-label">{{ node.label }}</span>
                <el-tag :type="getLevelType(data.level)" size="small" class="ml-2">
                  {{ getLevelText(data.level) }}
                </el-tag>
                <el-tag v-if="data.questionCount !== undefined && data.questionCount > 0" size="small" type="info" class="ml-2">
                  {{ data.questionCount }}
                </el-tag>
              </div>
            </template>
          </el-tree>
        </div>

        <!-- 右侧目录详情 -->
        <div class="catalog-detail-section">
          <el-empty v-if="!selectedCatalog" description="请选择左侧目录查看详情" />
          <div v-else class="catalog-detail">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="目录名称">
                {{ selectedCatalog.catalogueName }}
              </el-descriptions-item>
              <el-descriptions-item label="层级">
                <el-tag :type="getLevelType(selectedCatalog.level)" size="small">
                  {{ getLevelText(selectedCatalog.level) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="题目数量">
                <span class="question-count-text">{{ catalogueQuestionCountMap.get(selectedCatalog.id) || 0 }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>

    <!-- 添加/编辑目录对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="formDialogMode === 'add' ? '添加目录' : '编辑目录'"
      width="500px"
      append-to-body
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="目录名称" required>
          <el-input v-model="form.catalogueName" placeholder="请输入目录名称" />
        </el-form-item>
        <el-form-item label="层级" required>
          <el-tag :type="getLevelType(form.level)" size="large">
            {{ getLevelText(form.level) }}
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- JSON 自动解析对话框 -->
    <el-dialog
      v-model="jsonParseDialogVisible"
      title="JSON 自动解析"
      width="800px"
      append-to-body
    >
        <!-- 示例图片预览 -->
    <el-image-viewer
      v-if="exampleImageVisible"
      :url-list="[exampleImageUrl]"
      :initial-index="0"
      @close="exampleImageVisible = false"
    />
      <el-alert
        title="使用说明"
        type="info"
        :closable="false"
        class="mb-4"
      >
        <p>1. 点击下方按钮，复制提示词模板</p>
        <p>2. 将模板和目录图片粘贴到 AI 工具（如元宝、豆包、千问等）中</p>
        <p>3. 请 AI 根据书籍内容识别并生成对应的目录 JSON</p>
        <p>4. 将生成的 JSON 粘贴到下方文本框中，点击解析</p>
        <p>5. 若提示JSON格式错误，则继续回答AI：JSON格式错误，请帮我修复</p>
      </el-alert>

      <div class="mb-4 mt-2">
        <el-button type="primary" @click="handleCopyJsonTemplate">
          <Icon icon="ep:document-copy" class="mr-1" />
          复制提示词
        </el-button>
        <el-button @click="handleViewExample">
          <Icon icon="ep:view" class="mr-1" />
          查看示例
        </el-button>
        <el-button type="primary" @click="handleViewExampleImage">
          <Icon icon="ep:picture" class="mr-1" />
          查看示例图片
        </el-button>
      </div>

      <el-form label-width="100px">
        <el-form-item label="目录 JSON" required>
          <el-input
            v-model="jsonParseContent"
            type="textarea"
            :rows="15"
            placeholder='请粘贴 AI 生成的目录 JSON，格式如：
[
  {
    "title": "第一章",
    "page": "1",
    "children": [
      {
        "title": "第一节",
        "page": "2",
        "children": [
          {
            "title": "1.1.1",
            "page": "3"
          }
        ]
      }
    ]
  }
]'
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="jsonParseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="jsonParseLoading" @click="handleParseJson">
          <Icon icon="ep:magic-stick" class="mr-1" />
          解析目录
        </el-button>
      </template>
    </el-dialog>

    <!-- JSON 示例对话框 -->
    <el-dialog
      v-model="jsonExampleDialogVisible"
      title="目录 JSON 示例"
      width="600px"
      append-to-body
    >
      <pre class="json-example">{{ jsonExample }}</pre>
      <template #footer>
        <el-button @click="jsonExampleDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleCopyJsonExample">
          <Icon icon="ep:document-copy" class="mr-1" />
          复制示例
        </el-button>
      </template>
    </el-dialog>


  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import {
  getCatalogueListApi,
  postCatalogueCreateApi,
  putCatalogueUpdateApi,
  deleteCatalogueDeleteApi,
  postCatalogueParseApi,
  deleteCatalogueClearApi,
  postCatalogueLocationChangeApi,
  type CatalogueVO,
  type CatalogueParseDTO,
  type CatalogueParseCmd,
  type CatalogueChangeCmd,
  type CatalogueSort
} from '@/api/gen/catalogueController'
import { getQuestionListApi } from '@/api/gen/questionController'
import exampleImage from '@/assets/ai-example.png'

interface Props {
  visible: boolean
  bookId: string
  projectId: string
}

const props = defineProps<Props>()

const emit = defineEmits(['update:visible', 'refresh'])

const dialogVisible = ref(false)
const loading = ref(false)
const treeData = ref<any[]>([])
const selectedCatalog = ref<CatalogueVO | null>(null)
const treeRef = ref()
const isDragMode = ref(false)

const treeProps = {
  children: 'children',
  label: 'catalogueName'
}

// 存储目录下的题目数量映射
const catalogueQuestionCountMap = ref<Map<string, number>>(new Map())

const formDialogVisible = ref(false)
const formDialogMode = ref<'add' | 'edit'>('add')
const form = ref({
  catalogueName: '',
  level: 1,
  parentId: '0' as string,
  bookId: props.bookId
})
const currentEditId = ref<string | null>(null)

// JSON 解析相关
const jsonParseDialogVisible = ref(false)
const jsonParseContent = ref('')
const jsonParseLoading = ref(false)
const jsonExampleDialogVisible = ref(false)

// 示例图片
const exampleImageUrl = exampleImage
const exampleImageVisible = ref(false)

// 提示词模板
const jsonTemplate = `帮我分析出这个目录，直接返回json，格式如下：
[{
    "title": "标题",
    "page": "页码",
    "children":[
          {
            "title": "子标题",
    		"page": "子标题的页码",
          }
    ]
}]`

// JSON 示例
const jsonExample = `[
  {
    "title": "第一章 基础知识",
    "page": "1",
    "children": [
      {
        "title": "第一节 基本概念",
        "page": "2",
        "children": [
          {
            "title": "1.1.1 核心定义",
            "page": "3"
          },
          {
            "title": "1.1.2 关键术语",
            "page": "8"
          }
        ]
      },
      {
        "title": "第二节 应用实例",
        "page": "15",
        "children": [
          {
            "title": "1.2.1 实例一",
            "page": "16"
          },
          {
            "title": "1.2.2 实例二",
            "page": "22"
          }
        ]
      }
    ]
  },
  {
    "title": "第二章 进阶内容",
    "page": "30",
    "children": [
      {
        "title": "第一节 高级特性",
        "page": "31",
        "children": [
          {
            "title": "2.1.1 特性一",
            "page": "32"
          }
        ]
      }
    ]
  }
]`

watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    fetchCatalogList()
  }
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

// 获取目录列表
const fetchCatalogList = async () => {
  loading.value = true
  try {
    const response = await getCatalogueListApi({ bookId: props.bookId })
    if (response.data.code === 200) {
      const data = response.data.data || []
      // 获取所有目录的题目数量
      await fetchCatalogueQuestionCounts()
      treeData.value = buildTree(data)
    } else {
      ElMessage.error(response.data.msg || '获取目录列表失败')
    }
  } catch (error) {
    ElMessage.error('获取目录列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取所有目录的题目数量
const fetchCatalogueQuestionCounts = async () => {
  try {
    // 获取项目下所有题目
    const response = await getQuestionListApi({ projectId: props.projectId })
    if (response.data.code === 200) {
      const questions = response.data.data || []
      // 统计每个目录下的题目数量
      const countMap = new Map<string, number>()
      questions.forEach(question => {
        if (question.catalogueId) {
          const currentCount = countMap.get(question.catalogueId) || 0
          countMap.set(question.catalogueId, currentCount + 1)
        }
      })
      catalogueQuestionCountMap.value = countMap
    }
  } catch (error) {
    console.error('获取题目数量失败:', error)
  }
}

// 排序子节点：先按 sortNum 排序，然后按 id 排序
const sortChildren = (children: any[]) => {
  return children.sort((a, b) => {
    // 优先按 sortNum 排序，如果为空则赋值 0
    const sortNumA = a.sortNum ?? 0
    const sortNumB = b.sortNum ?? 0

    if (sortNumA !== sortNumB) {
      return sortNumA - sortNumB
    }

    // sortNum 相同，按目录 ID 排序（使用 BigInt 避免精度丢失）
    const idA = BigInt(a.id)
    const idB = BigInt(b.id)
    return idA > idB ? 1 : -1
  })
}

// 构建树形结构
const buildTree = (data: CatalogueVO[]) => {
  const tree: any[] = []
  const map = new Map()

  data.forEach(item => {
    map.set(item.id, { ...item, children: [], questionCount: catalogueQuestionCountMap.value.get(item.id) || 0 })
  })

  data.forEach(item => {
    const node = map.get(item.id)
    if (item.parentId === '0' || item.parentId === undefined) {
      tree.push(node)
    } else {
      const parent = map.get(item.parentId)
      if (parent) {
        parent.children.push(node)
      }
    }
  })

  // 排序所有节点（包括根节点和子节点）
  const sortedTree = sortChildren(tree)
  sortedTree.forEach(node => {
    sortNodeChildren(node)
  })

  // 构建完树后，统一更新所有节点的题目数量
  sortedTree.forEach(rootNode => {
    updateParentQuestionCount(rootNode)
  })

  return sortedTree
}

// 递归排序节点的子节点
const sortNodeChildren = (node: any) => {
  if (node.children && node.children.length > 0) {
    node.children = sortChildren(node.children)
    node.children.forEach((child: any) => {
      sortNodeChildren(child)
    })
  }
}

// 更新父节点的题目数量（累加所有子节点的题目数量）
const updateParentQuestionCount = (node: any): number => {
  let totalCount = node.questionCount || 0
  if (node.children && node.children.length > 0) {
    node.children.forEach((child: any) => {
      totalCount += updateParentQuestionCount(child)
    })
  }
  node.questionCount = totalCount
  return totalCount
}

// 节点点击
const handleNodeClick = (data: CatalogueVO) => {
  selectedCatalog.value = data
}

// 节点展开
const handleNodeExpand = (data: any) => {
  console.log('展开节点:', data)
}

// 节点折叠
const handleNodeCollapse = (data: any) => {
  console.log('折叠节点:', data)
}

// 添加根目录
const handleAddRoot = () => {
  form.value = {
    catalogueName: '',
    level: 1,
    parentId: '0',
    bookId: props.bookId
  }
  formDialogMode.value = 'add'
  currentEditId.value = null
  formDialogVisible.value = true
}

// 添加子目录
const handleAddChild = () => {
  if (!selectedCatalog.value) {
    ElMessage.warning('请先选择一个目录')
    return
  }
  form.value = {
    catalogueName: '',
    level: Math.min((selectedCatalog.value.level || 0) + 1, 4),
    parentId: selectedCatalog.value.id!,
    bookId: props.bookId
  }
  formDialogMode.value = 'add'
  currentEditId.value = null
  formDialogVisible.value = true
}

// 编辑
const handleEdit = () => {
  if (!selectedCatalog.value) {
    ElMessage.warning('请先选择一个目录')
    return
  }
  form.value = {
    catalogueName: selectedCatalog.value.catalogueName || '',
    level: selectedCatalog.value.level || 1,
    parentId: selectedCatalog.value.parentId || '0',
    bookId: props.bookId
  }
  formDialogMode.value = 'edit'
  currentEditId.value = selectedCatalog.value.id!
  formDialogVisible.value = true
}

// 保存
const handleSave = async () => {
  if (!form.value.catalogueName) {
    ElMessage.warning('请输入目录名称')
    return
  }

  if (formDialogMode.value === 'add') {
    try {
      const response = await postCatalogueCreateApi(form.value)
      if (response.data.code === 200) {
        ElMessage.success('添加成功')
        formDialogVisible.value = false
        selectedCatalog.value = null
        fetchCatalogList()
      } else {
        ElMessage.error(response.data.msg || '添加失败')
      }
    } catch (error) {
      ElMessage.error('添加失败')
      console.error(error)
    }
  } else {
    try {
      const response = await putCatalogueUpdateApi(
        { catalogueName: form.value.catalogueName },
        { id: currentEditId.value! }
      )
      if (response.data.code === 200) {
        ElMessage.success('编辑成功')
        formDialogVisible.value = false
        selectedCatalog.value = null
        fetchCatalogList()
      } else {
        ElMessage.error(response.data.msg || '编辑失败')
      }
    } catch (error) {
      ElMessage.error('编辑失败')
      console.error(error)
    }
  }
}

// 删除
const handleDelete = async () => {
  if (!selectedCatalog.value) {
    ElMessage.warning('请先选择一个目录')
    return
  }
  try {
    await ElMessageBox.confirm('确认删除该目录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const response = await deleteCatalogueDeleteApi({ id: selectedCatalog.value.id! })
    if (response.data.code === 200) {
      ElMessage.success('删除成功')
      selectedCatalog.value = null
      fetchCatalogList()
    } else {
      ElMessage.error(response.data.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 获取层级类型
const getLevelType = (level: number | undefined) => {
  switch (level) {
    case 1:
      return 'danger'
    case 2:
      return 'warning'
    case 3:
      return 'primary'
    case 4:
      return 'success'
    default:
      return undefined
  }
}

// 获取层级文本
const getLevelText = (level: number | undefined) => {
  switch (level) {
    case 1:
      return '一级目录'
    case 2:
      return '二级目录'
    case 3:
      return '三级目录'
    case 4:
      return '四级目录'
    default:
      return '-'
  }
}

const handleClose = () => {
  dialogVisible.value = false
  selectedCatalog.value = null
  emit('refresh')
}

// 打开 JSON 解析对话框
const handleOpenJsonParse = () => {
  jsonParseContent.value = ''
  jsonParseDialogVisible.value = true
}

// 复制提示词模板
const handleCopyJsonTemplate = () => {
  navigator.clipboard.writeText(jsonTemplate).then(() => {
    ElMessage.success('提示词已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 查看示例
const handleViewExample = () => {
  jsonExampleDialogVisible.value = true
}

// 复制 JSON 示例
const handleCopyJsonExample = () => {
  navigator.clipboard.writeText(jsonExample).then(() => {
    ElMessage.success('示例已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 查看示例图片
const handleViewExampleImage = () => {
  exampleImageVisible.value = true
}

// 解析 JSON
const handleParseJson = async () => {
  if (!jsonParseContent.value.trim()) {
    ElMessage.warning('请输入目录 JSON')
    return
  }

  try {
    const catalogueList: CatalogueParseDTO[] = JSON.parse(jsonParseContent.value)

    if (!Array.isArray(catalogueList) || catalogueList.length === 0) {
      ElMessage.error('JSON 格式错误，必须是非空数组')
      return
    }

    // 验证 JSON 结构
    const validateJson = (items: CatalogueParseDTO[]): boolean => {
      for (const item of items) {
        if (!item.title || typeof item.title !== 'string') {
          ElMessage.error('目录项必须包含 title 字段且为字符串')
          return false
        }
        if (item.children && !Array.isArray(item.children)) {
          ElMessage.error('children 字段必须是数组')
          return false
        }
        if (item.children && !validateJson(item.children)) {
          return false
        }
      }
      return true
    }

    if (!validateJson(catalogueList)) {
      return
    }

    // 调用解析 API
    jsonParseLoading.value = true
    const response = await postCatalogueParseApi({
      projectId: props.projectId,
      catalogueList
    })

    if (response.data.code === 200) {
      ElMessage.success(`解析成功，共创建 ${response.data.data?.count || 0} 个目录`)
      jsonParseDialogVisible.value = false
      jsonParseContent.value = ''
      selectedCatalog.value = null
      fetchCatalogList()
    } else {
      ElMessage.error(response.data.msg || '解析失败')
    }
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      ElMessage.error('JSON 格式错误，请发给AI进行修复')
    } else {
      ElMessage.error('解析失败')
      console.error(error)
    }
  } finally {
    jsonParseLoading.value = false
  }
}

// 清空目录
const handleClearCatalogs = async () => {
  try {
    await ElMessageBox.confirm(
      '确认清空所有目录吗？此操作不可恢复，所有目录及其子目录将被删除。',
      '危险操作',
      {
        confirmButtonText: '确认清空',
        cancelButtonText: '取消',
        type: 'error',
        distinguishCancelAndClose: true
      }
    )

    const response = await deleteCatalogueClearApi({ projectId: props.projectId })
    if (response.data.code === 200) {
      ElMessage.success('清空成功')
      selectedCatalog.value = null
      fetchCatalogList()
    } else {
      ElMessage.error(response.data.msg || '清空失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('清空失败')
      console.error(error)
    }
  }
}

// 切换拖拽模式
const handleToggleDragMode = async () => {
  if (isDragMode.value) {
    // 完成移动，保存到服务器
    await handleSaveLocation()
  } else {
    // 进入拖拽模式
    selectedCatalog.value = null
    isDragMode.value = true
    ElMessage.info('已进入拖拽模式，可拖拽目录调整位置')
  }
}

// 允许拖拽的限制
const allowDrop = (draggingNode: any, dropNode: any, type: string) => {
  // type: 'prev' - 拖拽到节点前面
  //       'next' - 拖拽到节点后面
  //       'inner' - 拖拽到节点内部（成为子节点）

  // 允许任何节点拖拽到一级目录的前面或后面（这样可以将子目录提升到根级别）
  if ((type === 'prev' || type === 'next') && dropNode.data.level === 1) {
    return true
  }

  // 允许同一层级的节点之间相互拖拽（prev/next）
  if ((type === 'prev' || type === 'next') && draggingNode.data.level === dropNode.data.level) {
    return true
  }

  // 允许拖拽作为某个节点的子节点（inner），但要满足层级限制（最多4级）
  if (type === 'inner') {
    const targetLevel = dropNode.data.level || 0
    // 目标节点的层级 + 1 必须小于等于 4
    return targetLevel + 1 <= 4
  }

  return false
}

// 更新树中所有节点的 sortNum 和 parentId
const updateTreeSortNum = (nodes: any[], parentId: string = '0'): void => {
  nodes.forEach((node, index) => {
    node.sortNum = index + 1  // sortNum 从 1 开始
    node.parentId = parentId

    if (node.children && node.children.length > 0) {
      updateTreeSortNum(node.children, node.id)
    }
  })
}

// 扁平化树形数据，生成排序数据
const flattenTree = (tree: any[]): CatalogueSort[] => {
  const result: CatalogueSort[] = []

  const traverse = (nodes: any[], parentId: string | null, level: number) => {
    nodes.forEach((node, index) => {
      const catalogueSort: CatalogueSort = {
        catalogueId: node.id,
        sortNum: index + 1  // sortNum 从 1 开始
      }

      // 如果有子节点，递归处理
      if (node.children && node.children.length > 0) {
        catalogueSort.children = flattenTreeChildren(node.children, node.id, level + 1)
      }

      result.push(catalogueSort)
    })
  }

  traverse(tree, '0', 1)
  return result
}

// 扁平化子节点
const flattenTreeChildren = (children: any[], parentId: string, level: number): any[] => {
  const result: any[] = []

  children.forEach((child, index) => {
    const catalogueSort: CatalogueSort = {
      catalogueId: child.id,
      sortNum: index + 1  // sortNum 从 1 开始
    }

    if (child.children && child.children.length > 0) {
      catalogueSort.children = flattenTreeChildren(child.children, child.id, level + 1)
    }

    result.push(catalogueSort)
  })

  return result
}

// 保存目录位置
const handleSaveLocation = async () => {
  try {
    // 先更新树中所有节点的 sortNum 和 parentId
    updateTreeSortNum(treeData.value)

    // 扁平化树形数据，生成排序数据
    const catalogues = flattenTree(treeData.value)

    console.log('保存的目录数据:', catalogues)

    const response = await postCatalogueLocationChangeApi({ catalogues })

    if (response.data.code === 200) {
      ElMessage.success('目录位置保存成功')
      isDragMode.value = false
      selectedCatalog.value = null
      await fetchCatalogList()
    } else {
      ElMessage.error(response.data.msg || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  }
}

// 拖拽完成后的回调
const handleNodeDrop = (draggingNode: any, dropNode: any, position: string) => {
  console.log('拖拽完成:', draggingNode.data, dropNode.data, position)

  // 更新拖拽节点的 parentId
  if (position === 'prev' || position === 'next') {
    // 拖拽到某个节点的前面或后面
    draggingNode.data.parentId = dropNode.data.parentId
  } else if (position === 'inner') {
    // 拖拽到某个节点的内部（作为子节点）
    draggingNode.data.parentId = dropNode.data.id
  }

  // el-tree 已经自动更新了树形结构，包括子节点的顺序
  // 我们只需要确保 parentId 正确，后续在保存时会根据新的树结构生成 sortNum

  console.log('拖拽后的树结构:', treeData.value)

  // 不在此处保存到服务器，等待用户点击"完成移动"按钮
}
</script>

<style scoped>
.catalog-manage-container {
  max-height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.catalog-layout {
  display: flex;
  gap: 20px;
  height: 500px;
  overflow: hidden;
}

.catalog-tree-section {
  flex: 1;
  overflow-y: auto;
  border-right: 1px solid #ebeef5;
  padding-right: 10px;
}

.catalog-detail-section {
  flex: 0 0 350px;
  overflow-y: auto;
  padding-left: 10px;
}

.tree-node-content {
  display: flex;
  align-items: center;
  width: 100%;
  padding-right: 8px;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-detail {
  padding: 10px;
}

.question-count-text {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

:deep(.el-tree-node__content) {
  height: 36px;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
}

.json-example {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.example-thumbnail {
  width: 300px;
  height: 200px;
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  overflow: hidden;
  transition: all 0.3s;
}

.example-thumbnail:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: var(--el-text-color-secondary);
}

.dialog-header {
  display: flex;
  align-items: center;
  cursor: move;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>

