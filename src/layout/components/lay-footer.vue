<template>
  <div class="text-center">
    <span>© 2026 {{ appName }}. All Rights Reserved.</span>
  </div>
</template>

<script setup lang="ts">
import { APP_NAME } from '@/config/app'

// 底部栏组件，主要用于展示版权信息

defineOptions({
  name: "SshineAdminFooter"
})

const appName = APP_NAME
</script>
