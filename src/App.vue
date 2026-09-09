<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { computed } from 'vue'
import Updater from './components/Updater/Updater.vue'

const themeStore = useThemeStore()
const themeSize = computed(() => themeStore.themeSize)
</script>

<template>
  <el-config-provider :size="themeSize">
    <RouterView />
    <Updater />
  </el-config-provider>
</template>

