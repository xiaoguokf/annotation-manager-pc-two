<script setup lang="ts">
defineOptions({
  name: "ShortClipForBadion"
})
</script>

<template>
  <div
    class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col  items-center justify-center ">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-red-500">403</h1>
      <h2 class="text-2xl font-semibold text-gray-800 mt-4">访问被拒绝</h2>
      <p class="text-gray-600 mt-2">您没有权限访问此页面</p>
      <button @click="$router.back()"
        class="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
        返回上一页
      </button>
    </div>
  </div>
</template>
