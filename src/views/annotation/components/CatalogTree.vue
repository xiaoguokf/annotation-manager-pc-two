<template>
  <div class="catalog-tree-container h-full">
    <el-tree
      ref="treeRef"
      :data="catalogData"
      :props="treeProps"
      :loading="loading"
      node-key="id"
      default-expand-all
      :expand-on-click-node="false"
      highlight-current
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span class="node-label-wrapper">
            <span>{{ node.label }}</span>
            <el-tag v-if="data.questionCount !== undefined && data.questionCount > 0" size="small" type="info" class="ml-2">
              {{ data.questionCount }}
            </el-tag>
            <el-tooltip v-if="data.page" content="跳转到目录页" placement="top">
              <el-button
                type="primary"
                link
                size="small"
                class="plane-btn"
                @click.stop="handlePlaneClick(data)"
              >
                <Icon icon="ep:promotion" />
              </el-button>
            </el-tooltip>
          </span>
          <span class="node-actions">
            <el-button
              type="primary"
              link
              size="small"
              :disabled="(data.level || 0) >= 4"
              @click.stop="handleAddChild(data)"
            >
              <Icon icon="ep:plus" />
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click.stop="handleEdit(data)"
            >
              <Icon icon="ep:edit" />
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click.stop="handleDelete(data)"
            >
              <Icon icon="ep:delete" />
            </el-button>
          </span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import { getCatalogueListApi, postCatalogueCreateApi, putCatalogueUpdateApi, deleteCatalogueDeleteApi, type CatalogueVO } from '@/api/gen/catalogueController'
import { getPdfPageListApi, type PdfPageVO } from '@/api/gen/pdfAdminController'
import { getQuestionListApi, type QuestionVO } from '@/api/gen/questionController'

interface Props {
  bookId: string
  projectId: string
}

const props = defineProps<Props>()

const emit = defineEmits(['select', 'go-to-page'])

const catalogData = ref<any[]>([])
const loading = ref(false)
const treeRef = ref()

const treeProps = {
  children: 'children',
  label: 'catalogueName'
}

// 存储扁平化的目录列表（方便查找）
const flatCatalogueList = ref<CatalogueVO[]>()
// 存储目录下的题目数量映射
const catalogueQuestionCountMap = ref<Map<string, number>>(new Map())

// 获取目录列表
const fetchCatalogList = async () => {
  loading.value = true
  try {
    const response = await getCatalogueListApi({ bookId: props.bookId })
    if (response.data.code === 200) {
      const data = response.data.data || []
      flatCatalogueList.value = data
      // 获取所有目录的题目数量
      await fetchCatalogueQuestionCounts(data)
      catalogData.value = buildTree(data)
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
const fetchCatalogueQuestionCounts = async (catalogues: CatalogueVO[]) => {
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

// 构建目录路径
const buildCataloguePath = (catalogueId: string): string => {
  if (!catalogueId) return ''

  const path: string[] = []
  let currentId: string | undefined = catalogueId
  const maxDepth = 10 // 防止死循环

  while (currentId && path.length < maxDepth) {
    const catalogue = flatCatalogueList.value?.find(c => c.id === currentId)
    if (!catalogue) break

    path.unshift(catalogue.catalogueName ?? '')
    currentId = catalogue.parentId

    // 顶级目录的 parentId 为 '0' 或 undefined
    if (currentId === '0' || currentId === undefined) break
  }

  return path.join(' > ')
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

// 刷新题目数量（用于添加新题目后更新）
const refreshQuestionCounts = async () => {
  if (!flatCatalogueList.value) return
  await fetchCatalogueQuestionCounts(flatCatalogueList.value)
  catalogData.value = buildTree(flatCatalogueList.value)
}

// 节点点击
const handleNodeClick = (data: any) => {
  // 设置当前选中的节点
  treeRef.value.setCurrentKey(data.id)
  // 判断是否是最低级目录（没有子节点）
  const isLeaf = !data.children || data.children.length === 0
  // 所有节点都会传递 catalogueId，不再限制为叶子节点
  emit('select', { ...data, isLeaf })
}

// 添加子节点
const handleAddChild = (data: any) => {
  ElMessageBox.prompt('请输入目录名称', '添加子目录', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async (result) => {
    const name = (result as any).value
    if (name) {
      try {
        const response = await postCatalogueCreateApi({
          catalogueName: name,
          level: Math.min((data.level || 0) + 1, 4),
          parentId: data.id,
          bookId: props.bookId
        })
        if (response.data.code === 200) {
          ElMessage.success('添加成功')
          fetchCatalogList()
        } else {
          ElMessage.error(response.data.msg || '添加失败')
        }
      } catch (error) {
        ElMessage.error('添加失败')
        console.error(error)
      }
    }
  }).catch(() => {})
}

// 编辑节点
const handleEdit = (data: any) => {
  ElMessageBox.prompt('请输入新的目录名称', '编辑目录', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: data.catalogueName
  }).then(async (result) => {
    const name = (result as any).value
    if (name) {
      try {
        const response = await putCatalogueUpdateApi(
          { catalogueName: name },
          { id: data.id }
        )
        if (response.data.code === 200) {
          ElMessage.success('编辑成功')
          fetchCatalogList()
        } else {
          ElMessage.error(response.data.msg || '编辑失败')
        }
      } catch (error) {
        ElMessage.error('编辑失败')
        console.error(error)
      }
    }
  }).catch(() => {})
}

// 删除节点
const handleDelete = (data: any) => {
  ElMessageBox.confirm('确认删除该目录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await deleteCatalogueDeleteApi({ id: data.id })
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchCatalogList()
      } else {
        ElMessage.error(response.data.msg || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }).catch(() => {})
}

// 小飞机点击 - 跳转到目录页
const handlePlaneClick = async (data: any) => {
  if (!data.page) return

  try {
    // 获取内容页列表，检查是否有 type=3（目录）的页面
    const response = await getPdfPageListApi({ pdfOrProjectId: props.projectId })
    if (response.data.code !== 200) {
      ElMessage.error('获取内容页信息失败')
      return
    }

    const pages: PdfPageVO[] = response.data.data || []
    // 找到所有 type=3（目录）的页面，获取最后一页
    const catalogPages = pages.filter(p => p.type === 3)

    if (catalogPages.length === 0) {
      ElMessage.warning('请先在内容页管理中设置目录页（type=目录），才能使用快速跳转功能')
      return
    }

    // 找到目录页的最后一页
    const lastCatalogPage = catalogPages.reduce((max, p) => p.realPage > max ? p.realPage : max, catalogPages[0]?.realPage ?? 0)

    // 计算跳转页码：目录最后一页 + 目录中的页码
    const targetPage = lastCatalogPage + data.page
    emit('go-to-page', targetPage)
  } catch (error) {
    ElMessage.error('跳转失败')
    console.error(error)
  }
}

onMounted(() => {
  fetchCatalogList()
})

watch(() => props.bookId, () => {
  fetchCatalogList()
})

// 选中目录
const selectCatalog = (catalogueId: string) => {
  return new Promise<void>((resolve) => {
    if (!treeRef.value) {
      resolve()
      return
    }

    // 使用 nextTick 确保树组件已完全渲染
    nextTick(() => {
      const node = treeRef.value.getNode(catalogueId)
      if (node) {
        // 展开所有父节点
        let currentNode = node.parent
        while (currentNode) {
          currentNode.expanded = true
          currentNode = currentNode.parent
        }
        // 选中该节点
        treeRef.value.setCurrentKey(catalogueId)
        // 触发选中事件
        handleNodeClick(node.data)
      }
      resolve()
    })
  })
}

// 暴露方法供父组件调用
defineExpose({
  fetchCatalogList,
  selectCatalog,
  buildCataloguePath,
  flatCatalogueList,
  refreshQuestionCounts
})
</script>

<style scoped>
.catalog-tree-container {
  height: 100%;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
  font-size: 14px;
}

.node-label-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.plane-btn {
  padding: 2px;
  margin-left: 4px;
}

.plane-btn:hover {
  color: #409eff;
}

.node-actions {
  display: flex;
  gap: 4px;
}
</style>
