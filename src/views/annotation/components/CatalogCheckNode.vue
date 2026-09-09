<template>
  <div class="catalog-check-node" :class="{ 'has-error': node.hasZeroChild, 'has-warning': node.hasQuestionOnNonLeaf }">
    <div class="node-content">
      <Icon icon="ep:folder" v-if="node.children && node.children.length > 0" class="node-icon" />
      <Icon icon="ep:document" v-else class="node-icon" />
      <span class="node-label">{{ node.catalogueName }}</span>
      <span class="node-count">({{ node.totalCount }}题)</span>
      <el-tag v-if="node.hasQuestionOnNonLeaf && node.questionCountOnNonLeaf > 0" type="danger" size="small" class="mr-2">
        本节点{{ node.questionCountOnNonLeaf }}题
      </el-tag>
      <el-tag v-else-if="node.hasZeroChild" type="danger" size="small">存在空目录</el-tag>
    </div>
    <div v-if="node.children && node.children.length > 0" class="node-children">
      <CatalogCheckNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { CatalogueCheckVO } from '@/api/gen/catalogueController'

interface CatalogueTreeNode extends CatalogueCheckVO {
  children: CatalogueTreeNode[]
  totalCount: number
  hasZeroChild: boolean
  hasQuestionOnNonLeaf: boolean
  questionCountOnNonLeaf: number
}

interface Props {
  node: CatalogueTreeNode
}

defineProps<Props>()
</script>

<style scoped>
.catalog-check-node {
  margin-left: 0;
}

.catalog-check-node:first-child {
  margin-left: 0;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  margin: 4px 0;
  border-radius: 4px;
  background-color: #fff;
  transition: all 0.3s;
}

.catalog-check-node.has-error > .node-content {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
}

.catalog-check-node.has-warning > .node-content {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
}

.node-icon {
  font-size: 16px;
  color: #409eff;
}

.catalog-check-node.has-error > .node-content .node-icon {
  color: #f56c6c;
}

.node-label {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.catalog-check-node.has-error > .node-content .node-label {
  color: #f56c6c;
  font-weight: 500;
}

.node-count {
  font-size: 12px;
  color: #909399;
}

.catalog-check-node.has-error > .node-content .node-count {
  color: #f56c6c;
}

.mr-2 {
  margin-right: 8px;
}

.node-children {
  padding-left: 20px;
  border-left: 2px dashed #e4e7ed;
  margin-left: 10px;
}
</style>
