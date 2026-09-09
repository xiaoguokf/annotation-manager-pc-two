# sshine-admin

基于 Vue 3 + Element Plus + TailwindCSS 的后台管理系统

## 技术栈

- **框架**: Vue 3.5.22
- **UI 库**: Element Plus 2.11.8
- **样式**: TailwindCSS 4.3.1
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
│   └── gen/       # 自动生成的 API 接口（勿手动修改）
├── assets/        # 静态资源
├── components/    # 公共组件
├── config/        # 项目配置
├── layout/        # 布局组件
├── router/        # 路由配置
├── services/      # 业务服务
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

项目使用 TailwindCSS v4。与 v3 的主要区别：

- **不再需要** `tailwind.config.js` 配置文件，主题和暗色模式通过 CSS 配置（`src/assets/main.css`）
- 插件通过 Vite 插件 `@tailwindcss/vite` 加载
- 自定义主题色通过 `@theme` 指令注册，自定义变体通过 `@custom-variant` 注册

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

### 深色模式适配

项目通过 TailwindCSS v4 的 `@custom-variant` + class 策略实现深色模式（在 `src/assets/main.css` 中配置 `@custom-variant dark (&:where(.dark, .dark *))`），切换深色模式时会在 `<html>` 和 `<body>` 上添加/移除 `dark` 类名。开发组件时**必须**兼容深色模式。

#### 方式一：Tailwind `dark:` 变体（推荐）

在 TailwindCSS 类名前添加 `dark:` 前缀，定义深色模式下的样式：

```vue
<template>
  <!-- 背景色 -->
  <div class="bg-white dark:bg-gray-800">...</div>

  <!-- 文字颜色 -->
  <span class="text-gray-800 dark:text-gray-200">...</span>

  <!-- 边框 -->
  <div class="border border-gray-200 dark:border-gray-700">...</div>

  <!-- 悬停状态 -->
  <div class="hover:bg-gray-50 dark:hover:bg-gray-700">...</div>

  <!-- 组合使用 -->
  <div class="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600">
    ...
  </div>
</template>
```

#### 方式二：CSS 变量

项目通过 `useThemeStore` 管理主题变量，所有变量在深色模式下会自动切换值。可在内联样式或 CSS 中使用：

```vue
<template>
  <!-- 内联样式使用 CSS 变量 -->
  <div :style="{ backgroundColor: 'var(--theme-header-bg)', color: 'var(--theme-sidebar-menu-text)' }">
    ...
  </div>
</template>

<style scoped>
/* CSS 中使用变量 */
.my-card {
  background-color: var(--theme-header-bg);
  border-color: var(--theme-border-color);
  color: var(--theme-sidebar-menu-text);
}
</style>
```

可用的主题 CSS 变量（在 `src/stores/theme.ts` 中定义）：

| 变量名 | 用途 |
|--------|------|
| `--theme-primary` | 主色调 |
| `--theme-primary-light` | 主色调浅色 |
| `--theme-primary-dark` | 主色调深色 |
| `--theme-header-bg` | 头部背景色 |
| `--theme-content-bg` | 内容区背景色 |
| `--theme-border-color` | 边框颜色 |
| `--theme-border-color-light` | 浅色边框 |
| `--theme-sidebar-menu-text` | 菜单文字颜色 |
| `--theme-sidebar-menu-hover` | 菜单悬停背景 |

#### 方式三：Tailwind 主题色类名

通过 `src/assets/main.css` 中的 `@theme` 指令，将主题 CSS 变量注册为 Tailwind 颜色 token，可直接使用 `bg-theme-*`、`text-theme-*` 等类名：

```vue
<template>
  <div class="bg-theme-content-bg text-theme-sidebar-menu-text border border-theme-border-color">
    ...
  </div>
</template>
```

#### Element Plus 深色模式

项目已在 `main.ts` 中引入了 `element-plus/theme-chalk/dark/css-vars.css`，并在 `src/assets/main.css` 中对 Element Plus 组件做了深色模式全局样式覆盖（表格、输入框、对话框、按钮等）。由于 TailwindCSS v4 的 CSS 层级机制，覆盖样式放在 `main.css` 无层级（unlayered）位置以确保能正常覆盖 Element Plus 默认样式。使用 Element Plus 组件时通常无需额外处理深色适配。

#### 适配原则

1. **禁止硬编码颜色**：避免使用 `color="#333"`、`style="background: #fff"` 等硬编码值，改用 CSS 变量或 `dark:` 变体
2. **确保对比度**：深色模式下文字和背景之间需保持足够对比度，文字颜色使用 `gray-200`/`gray-300` 而非纯白
3. **成对编写样式**：写浅色样式时同步写 `dark:` 对应样式，避免遗漏
4. **测试验证**：开发完成后切换到深色模式检查页面效果，确保无刺眼、不可读内容
## 升级基础模板

本项目基于 [sshine-admin](https://cnb.cool/sshinelt/labs/sshine-admin) 模板初始化，保留了模板的完整提交历史，
因此模板升级可以直接合并：

\`\`\`bash
# 首次使用需要添加模板仓库
git remote add sshine-admin https://cnb.cool/sshinelt/labs/sshine-admin.git

git fetch sshine-admin
git merge sshine-admin/develop   # 解决冲突后再提交
\`\`\`
