<template>
  <div class="drawer-con">
    <el-drawer v-model="drawerVisible" :title="type === 'book' ? '书籍信息' : '试卷信息'" direction="btt" size="80%" resizable
      style="position: absolute" :close-on-click-modal="true" class="menu-info-drawer" :append-to-body="false">
      <div class="info-drawer-content">
        <BookInfoForm v-if="type === 'book'" :book-id="projectId" :readonly="readonly" @refresh="handleRefresh" />
        <DocInfoForm v-if="type === 'doc'" :doc-id="projectId" :readonly="readonly" @refresh="handleRefresh" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import BookInfoForm from './BookInfoForm.vue'
import DocInfoForm from './DocInfoForm.vue'

interface Props {
  visible: boolean
  type: 'book' | 'doc'
  projectId: string
  readonly?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits(['update:visible', 'refresh'])

const drawerVisible = ref(false)

watch(() => props.visible, (val) => {
  drawerVisible.value = val
})

watch(drawerVisible, (val) => {
  emit('update:visible', val)
})

const handleRefresh = () => {
  emit('refresh')
}

onMounted(() => {
  drawerVisible.value = props.visible
})
</script>

<style scoped>
.info-drawer-content {
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  /* Firefox */
}

.info-drawer-content::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari, Edge */
}

.drawer-con :deep(.el-modal-drawer) {
  position: absolute !important;

}



.menu-info-drawer :deep(.el-drawer__header) {
  margin-bottom: 0 !important;
  /* padding: 15px 20px; */
  border-bottom: 1px solid #e4e7ed;
}

.menu-info-drawer :deep(.el-drawer__body) {
  padding: 0 20px 20px;
}
</style>
