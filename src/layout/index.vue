<template>
  <el-container class="h-screen w-screen">
    <!-- 侧边栏 -->
    <lay-sidebar />

    <!-- 主内容区域 -->
    <el-container class="flex-1 flex flex-col">
      <!-- 顶部导航栏 - 固定高度 -->
      <el-header class="p-0 shrink-0" :style="{
        height: `var(--theme-header-height)`,
        backgroundColor: 'var(--theme-header-bg)',
        borderBottom: '1px solid var(--theme-border-color)'
      }">
        <lay-panel />
      </el-header>
      
      <!-- 主要内容区域 - 弹性高度 -->
      <div class="flex-1 flex flex-col overflow-hidden" style="background-color: var(--theme-content-bg);">
        <!-- 水平二级菜单 - 固定高度 -->
        <div class="shrink-0">
          <lay-subbar />
        </div>
        
        <!-- 页面内容 - 占用剩余空间 -->
        <div class="flex-1 overflow-hidden" style="background-color: var(--theme-content-bg);">
          <lay-content />
        </div>
      </div>

      <!-- 底部栏 - 固定高度 -->
      <el-footer class="p-0 shrink-0" :style="{
        height: `var(--theme-footer-height)`,
        backgroundColor: 'var(--theme-footer-bg)',
        borderTop: '1px solid var(--theme-border-color)'
      }">
        <lay-footer />
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import LaySidebar from '@/layout/components/lay-sidebar.vue'
import LaySubbar from '@/layout/components/lay-subbar.vue'
import LayPanel from '@/layout/components/lay-panel.vue'
import LayContent from '@/layout/components/lay-content.vue'
import LayFooter from '@/layout/components/lay-footer.vue'

defineOptions({
  name: "ShortClipMainLayout"
})
</script>
