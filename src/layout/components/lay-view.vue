<template>
  <!-- 参照 lay-footer 模式：card 和 footer 是 flex column 的同级子元素 -->
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 卡片主体 - flex:1 占满剩余空间 -->
    <el-card class="view-card">
      <template #header>
        <div class="view-header">
          <div class="view-title">
            <slot name="title">{{ title }}</slot>
          </div>
          <div class="view-actions">
            <slot name="header-actions" />
          </div>
        </div>
      </template>

      <!-- 搜索区域 -->
      <div class="view-search">
        <slot name="search" />
      </div>

      <!-- 内容区域 - 表格等 -->
      <div class="view-content">
        <slot />
      </div>
    </el-card>

    <!-- 底部分页栏 - 与 card 同级，参照 el-footer 风格 -->
    <div class="view-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'LayView'
})

defineProps<{
  title?: string
}>()
</script>

<style scoped>
/* card 占满剩余空间，内部自然滚动 */
.view-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-card::deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  min-height: 0;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-title {
  font-weight: 600;
  font-size: 16px;
  color: var(--theme-sidebar-menu-text);
}

.view-search {
  flex-shrink: 0;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: var(--theme-content-bg);
  border: 1px solid var(--theme-border-color-light);
  border-radius: 8px;
  display: flex;
  align-items: center;
}

.view-search:empty {
  display: none;
  margin-bottom: 0;
}

/* 搜索区内表单项去掉默认下边距，实现垂直居中 */
.view-search :deep(.el-form-item) {
  margin-bottom: 0;
}

.view-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* 底部分页栏 - 参照 el-footer 风格：flex-shrink:0，固定在底部 */
.view-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 20px;
  border-top: 1px solid var(--theme-border-color);
  background-color: var(--theme-footer-bg);
}

.view-footer:empty {
  display: none;
}
</style>
