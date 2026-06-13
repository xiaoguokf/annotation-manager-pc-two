<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { computed } from 'vue'

const themeStore = useThemeStore()
const themeSize = computed(() => themeStore.themeSize)
</script>

<template>
  <el-config-provider :size="themeSize">
    <RouterView />
  </el-config-provider>
</template>
