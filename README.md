# ShortClip-admin

基于 Vue 3 + Element Plus + TailwindCSS 的后台管理系统

## 技术栈

- **框架**: Vue 3.5.22
- **UI 库**: Element Plus 2.11.8
- **样式**: TailwindCSS 3.4.18
- **状态管理**: Pinia 3.0.3
- **路由**: Vue Router 4.6.3
- **HTTP 客户端**: Axios 1.13.2
- **图标**: @iconify/vue 5.0.0
- **构建工具**: Vite 7.1.11
- **开发语言**: TypeScript 5.9.0

## 环境要求

- Node.js: ^20.19.0 || >=22.12.0
- pnpm (推荐)

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
pnpm dev
```

开发服务器默认运行在 `http://localhost:5173`

### 构建

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

### 代码检查

```bash
# ESLint 检查并自动修复
pnpm lint

# 格式化代码
pnpm format

# 类型检查
pnpm type-check
```

## 项目结构

```
src/
├── api/           # API 接口定义
│   └── gen/       # 自动生成的 API 接口
├── assets/        # 静态资源
├── components/    # 公共组件
├── router/        # 路由配置
├── stores/        # Pinia 状态管理
├── utils/         # 工具函数
├── views/         # 页面组件
├── App.vue        # 根组件
└── main.ts        # 入口文件
```

## 开发规范

### 图标使用

项目使用 `@iconify/vue` 作为图标库，支持多种图标集，包括但不限于：

- **ep**: Element Plus 图标集
- **mdi**: Material Design Icons
- **heroicons**: Heroicons
- **ri**: Remix Icon

#### 使用示例

```vue
<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <!-- 使用 Element Plus 图标 -->
  <Icon icon="ep:user" />

  <!-- 使用 Material Design 图标 -->
  <Icon icon="mdi:home" />

  <!-- 自定义大小和颜色 -->
  <Icon icon="ep:search" :width="24" :height="24" color="#409eff" />

  <!-- 离线加载图标（需要提前注册） -->
  <Icon icon="ep:arrow-down" />
</template>
```

#### 推荐图标

以下是一些常用图标集的推荐图标：

**Element Plus (ep):**
- `ep:user` - 用户
- `ep:home` - 首页
- `ep:setting` - 设置
- `ep:search` - 搜索
- `ep:arrow-left` - 左箭头
- `ep:arrow-right` - 右箭头
- `ep:arrow-up` - 上箭头
- `ep:arrow-down` - 下箭头
- `ep:close` - 关闭
- `ep:check` - 成功
- `ep:edit` - 编辑
- `ep:delete` - 删除
- `ep:plus` - 添加
- `ep:refresh` - 刷新
- `ep:download` - 下载
- `ep:upload` - 上传
- `ep:filter` - 筛选
- `ep:sort` - 排序
- `ep:bell` - 通知
- `ep:document` - 文档
- `ep:folder` - 文件夹

### Element Plus 组件使用

#### 按钮组件

```vue
<el-button type="primary">主要按钮</el-button>
<el-button type="success">成功按钮</el-button>
<el-button type="warning">警告按钮</el-button>
<el-button type="danger">危险按钮</el-button>
```

#### 表单组件

```vue
<el-form :model="form" :rules="rules" ref="formRef">
  <el-form-item label="用户名" prop="username">
    <el-input v-model="form.username" placeholder="请输入用户名" />
  </el-form-item>
  <el-form-item label="密码" prop="password">
    <el-input v-model="form.password" type="password" placeholder="请输入密码" />
  </el-form-item>
  <el-form-item>
    <el-button type="primary" @click="submitForm">提交</el-button>
  </el-form-item>
</el-form>
```

#### 表格组件

```vue
<el-table :data="tableData" stripe border>
  <el-table-column prop="date" label="日期" width="180" />
  <el-table-column prop="name" label="姓名" width="180" />
  <el-table-column prop="address" label="地址" />
  <el-table-column label="操作" width="180">
    <template #default="scope">
      <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
      <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
    </template>
  </el-table-column>
</el-table>
```

### TailwindCSS 使用

#### 类名规范

TailwindCSS 提供了丰富的原子化 CSS 类名：

```vue
<!-- 布局 -->
<div class="flex items-center justify-between">...</div>
<div class="grid grid-cols-3 gap-4">...</div>

<!-- 间距 -->
<div class="p-4">...</div> <!-- padding: 1rem -->
<div class="m-4">...</div> <!-- margin: 1rem -->
<div class="px-4 py-2">...</div> <!-- padding-left/right: 1rem; padding-top/bottom: 0.5rem -->

<!-- 颜色 -->
<div class="text-blue-500">...</div> <!-- 文字颜色 -->
<div class="bg-gray-100">...</div> <!-- 背景颜色 -->
<div class="border-gray-300 border">...</div> <!-- 边框颜色 -->

<!-- 尺寸 -->
<div class="w-full h-screen">...</div> <!-- 宽度100%，高度100vh -->
<div class="text-lg font-bold">...</div> <!-- 大号文字，加粗 -->

<!-- 圆角和阴影 -->
<div class="rounded-lg shadow-md">...</div> <!-- 圆角，阴影 -->
```