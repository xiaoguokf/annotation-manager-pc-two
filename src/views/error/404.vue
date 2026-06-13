<script setup lang="ts">
defineOptions({
  name: "ShortClipNotFound"
})
</script>

<template>
  <div
    class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-gray-400">404</h1>
      <h2 class="text-2xl font-semibold text-gray-800 mt-4">页面未找到</h2>
      <p class="text-gray-600 mt-2">抱歉，您访问的页面不存在</p>
      <div class="mt-6 space-x-4">
        <button @click="$router.push('/')"
          class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          返回首页
        </button>
        <button @click="$router.back()"
          class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
          返回上一页
        </button>
      </div>
    </div>
  </div>
</template>