# AGENT.md

本文件是给 AI 编码助手（以及新同学）看的**项目协作手册**。在动手改代码前请完整阅读，并严格遵守其中约定。
更细节的 UI/样式示例见 [README.md](./README.md)。

---

## 1. 项目概述

`sshine-admin`：基于 **Vue 3 + TypeScript + Element Plus + TailwindCSS v4 + Pinia** 的后台管理系统前端。

- 应用显示名由 `package.json` 的 `name` 自动生成（`sshine-admin` → `Sshine Admin`），通过 Vite `define` 注入为全局常量 `__APP_NAME__`，统一从 `src/config/app.ts` 的 `APP_NAME` 获取，**禁止在业务代码里硬编码应用名**。
- 后端接口约定：所有请求走 `/api` 前缀（Vite dev proxy 或 Nginx 反代剥离），响应体统一为 `{ code: number, msg: string, data: T }`，`code === 200` 表示成功。

### 技术栈版本

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 3.5（`script setup` + TS） |
| UI | Element Plus 2.11 |
| 样式 | TailwindCSS 4.3（`@tailwindcss/vite`，**无** `tailwind.config.js`） |
| 状态 | Pinia 3（setup store 风格） |
| 路由 | Vue Router 4.6 |
| 请求 | Axios 1.13（自封装 `src/utils/http`） |
| 图标 | `@iconify/vue`（**未**安装 `@element-plus/icons-vue`） |
| 其他 | dayjs、qs、nprogress、jsencrypt、@tiptap/*（富文本）、solarlunar（农历） |
| 构建 | Vite 7、pnpm、Node `^20.19.0 \|\| >=22.12.0` |

---

## 2. 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发（vite --host，端口 5173）
pnpm build            # 并发执行 type-check + vite build
pnpm preview          # 预览构建产物
pnpm type-check       # vue-tsc --build 类型检查
pnpm lint             # eslint . --fix --cache
pnpm format           # prettier --write src/
pnpm generate-api     # 从后端 OpenAPI 生成 src/api/gen（tsx scripts/generate-api.ts）
```

> `pnpm generate-api` 从后端 OpenAPI 生成接口，默认 `http://localhost:5173`（经 dev server 代理，路径 `/api/v3/api-docs`）；也可直连后端 `pnpm generate-api https://<host>`，脚本会自动回退到 `/v3/api-docs`。

---

## 3. 目录结构与职责

```
src/
├── api/                # 接口层
│   ├── gen/            # ★ 由脚本自动生成，禁止手动修改
│   └── user.ts         # 遗留文件，新代码不要引用
├── assets/             # main.css（Tailwind 入口 + 主题 token + EP 深色覆盖）、base.css、logo/user.png
├── components/         # 全局业务组件：DefaultLogin、DefaultHome、ThemeToggle、RichTextEditor、AnnouncementDialog
├── config/             # app.ts（APP_NAME）
├── layout/
│   ├── index.vue       # 整体布局
│   └── components/     # lay-sidebar / navbar / subbar / content / footer / panel / search / view
├── router/
│   ├── index.ts        # createRouter + 全局前置守卫 + 导出 MenuRoutes
│   ├── login.ts        # 登录页路由
│   ├── normal.ts       # 不占用管理端布局的独立页面路由（当前为空数组）
│   └── modules/        # ★ 业务路由模块，自动 glob 导入（dashboard / system / profile / error）
├── services/           # 业务服务层：封装 gen API + 统一错误提示（userService / roleService / announcementService）
├── stores/             # Pinia：user、theme、counter
├── utils/              # http/（axios 封装）、auth、debounce、timeFormat、festival、nprogress、title、clipboard
├── views/              # 页面：system/（user、role、announcement、menu、theme）、home、login、profile、error
├── App.vue             # el-config-provider 包裹 RouterView，按 themeSize 控制组件尺寸
└── main.ts             # 入口：注册 Pinia/Router/ElementPlus(zh-cn)，初始化主题与用户信息
```

`scripts/`：API 生成相关。`config.ts`（URL 过滤、方法名映射）、`generate-api.ts`（CLI 入口）、`syncApi.ts`（旧路径兼容层），生成器实现拆分在 `scripts/generator/`。
`types/`：`router.d.ts`（全局 `ShortClipRoute`）、`solarlunar.d.ts`。

---

## 4. 必须遵守的硬性规则

1. **禁止修改 `src/api/gen/` 下任何文件**。需要新接口就重新运行 `pnpm generate-api`，或在 `scripts/config.ts` 中配置 `urlFilters` / `customMethods` 后重新生成。
2. **提交代码前必须通过类型检查**：`pnpm type-check`（`pnpm build` 已内置）。类型检查不过不得提交。
3. **所有页面/组件必须兼容深色模式**（详见第 8 节）。
4. 图标只用 `@iconify/vue` 的 `<Icon icon="ep:xxx" />`，**不要**用 `@element-plus/icons-vue`。
5. 路径别名统一用 `@/*` → `src/*`，禁止长串相对路径跨目录引用。
6. 不要新增全局自动导入插件（当前未启用 unplugin 系列），所有依赖显式 `import`；Element Plus 全局组件类型由 `tsconfig.app.json` 的 `types: ["element-plus/global"]` 提供。
7. 修改生成脚本时，必须通过 `diff` 确认 `src/api/gen/` 产物变化符合预期（先用 `cp -r src/api/gen /tmp/gen-before` 备份，再用 `diff -r` 对比）。

---

## 5. 分层与写法约定

### 5.0 API 生成器（`scripts/generator/`）

按四个阶段拆分，每阶段职责单一，改动时只需定位对应文件：

| 阶段 | 文件 | 职责 |
|------|------|------|
| 1. OpenAPI 解析 | `openapi.ts` | 拉取文档（`/v3/api-docs` 与 `/api/v3/api-docs` 双地址回退）、按 `config.urlFilters` 过滤、按 tag 分组、补齐后端未声明的路径参数、生成 URL 模板、方法名冲突检测 |
| 2. 通用方法解析 | `operation.ts` | 判定请求形态（`json` / `sse` / `download`）与传输方式（`request` / `form`），构造参数槽位（body / params / config / options），产出 `OperationSpec` |
| 3. 实体类处理 | `schema.ts` | Schema → TS 类型（枚举、雪花 ID 转 string、File 识别、注释提取）、收集引用类型、拓扑排序后渲染 `interface` |
| 4. 模板生成 | `render.ts` | 纯字符串渲染：JSDoc + 函数签名 + 调用表达式。**不做任何业务判定** |
| 风格检测 | `lint.ts` | REST 风格检测，**只打印提示，不影响生成结果** |
| 编排 | `index.ts` | 串联 1→2→3→4（外加风格检测），落盘到 `src/api/gen/`，清理已下线的 controller 文件 |

关键设计：阶段 2 产出的 `OperationSpec`（`types.ts`）是唯一中间表示，阶段 4 只依赖它。因此新增请求形态（如 WebSocket）只需改阶段 2 与 4，不触碰类型解析。

约定与已知规则：

- 方法名 = HTTP 方法 + 路径段 PascalCase 拼接，**路径参数段不参与命名**，故 `/x/{id}` 与 `/x/{uid}` 会撞名，脚本会告警，需在 `config.ts` 的 `customMethods` 中指定唯一名。
- **不能按 REST 教条自行决定参数位置**，一律以后端 OpenAPI 契约为准：`requestBody` → body 位置，`in: path` → URL 插值，`in: query` → `config.params`。
- 雪花 ID（`int64`/`long` 且以 id 结尾）统一生成 `string`，避免 number 精度丢失；顶层数组 body（如批量删除的 `[int64]`）按 ID 列表推断。
- `download` 与 `sse` 是**多方法共用**的封装，生成时会显式带上 `method`（如 `http.download(url, { method: 'POST', data, ...config })`），不能依赖其默认值。
- **无请求体时也必须传 `null` 占位**：`post/put/patch` 签名是 `(url, data, config)`，省略 data 会让 config 左移成请求体。生成器用 `bodyPlacement: 'nullArgument'` 表达该约束；`get/delete` 签名是 `(url, config)`，无需占位。
- GET / HEAD 无法携带请求体（fetch 规范禁止、XHR 静默丢弃），这类方法的 `bodyPlacement` 为 `query`，body 数据会被并入 `config.params`。这是技术限制，不属于 REST 约定。

**REST 风格检测（`lint.ts`）**

生成时会检测接口设计是否符合 REST 风格并打印提示。检测规则：

| 规则 | 说明 |
|------|------|
| `verb-in-uri` | URI 末段以动词开头（`addUser`、`update-info`、`assign-role`） |
| `post-for-query` | 查询类接口（末段含 list/query/search/page 等）用了 POST |
| `get-with-body` | GET 携带请求体，缓存与网关兼容性差 |
| `put-without-body` | PUT 无请求体，多为执行动作而非替换资源，难以保证幂等 |
| `id-in-query` | 单资源操作把标识放在 query 而非 path |
| `camel-case-in-uri` | URI 段使用 camelCase，建议统一 kebab-case |
| `duplicate-resource` | 同资源下同时存在标准端点与动词端点，语义重复 |

设计要点：

- **只提示，不改生成结果**。生成代码必须服从后端契约，不能因"不符合 REST"就改动参数落位。
- 认证类端点（`login`、`logout`、`register`、`forget`、`refreshToken`、`genSecret` 等）无对应资源表示，已列入白名单，不报动词问题。
- 末段会先做分词再判断首词（`addUser` → `add`），以覆盖"动词 + 名词"的常见命名。
- 在 `scripts/config.ts` 的 `restLint` 中配置：`enabled` 总开关、`rules` 关闭单条规则、`ignore` 排除指定路径（支持通配符）。
- DELETE 也可带 body（如批量删除），需走 `config.data`。
- `scripts/**/*.ts` 已纳入 `tsconfig.node.json`，`pnpm type-check` 会覆盖脚本。

### 5.1 接口 → 服务 → 页面（三层）

- `src/api/gen/*Controller.ts`：生成器产出，导出 `xxxApi(params?, config?)`，返回 `Promise<AxiosResponse<Result<T>>>`，**不做任何业务判断**。
- `src/services/*Service.ts`：用 **静态方法 class**（如 `UserService.getUserList`）封装，负责：
  - 调用 gen API；
  - 判断 `data.code === 200`，失败时 `ElMessage.error(data.msg || '默认提示')` 并返回 `null` / `false`；
  - 成功时返回解包后的 `data.data` 或 `true`。
- `src/views/**`：只调用 Service，**不要在页面里直接 `import` gen API 或手写 axios 请求**。

```ts
// src/services/xxxService.ts 模板
import { ElMessage } from 'element-plus'
import { getXxxListApi } from '@/api/gen/xxxController'

export class XxxService {
  static async getList(params: XxxQuery): Promise<PageVOXxxVO | null> {
    const { data } = await getXxxListApi(params)
    if (data.code === 200) return data.data || null
    ElMessage.error(data.msg || '获取列表失败')
    return null
  }
}
```

### 5.2 HTTP 封装（`src/utils/http/index.ts`）

- 默认 `baseURL: '/api'`、`timeout: 10000`，GET 参数用 `qs` 序列化（数组为 `id=1&id=2` 重复形式）。
- 请求拦截器自动注入 `Authorization: getToken()`；`whiteList`（`**/login`、`**/genSecret`）跳过。
- 扩展配置类型：`SshineAdminRequestConfig<D>`（含 `loading?: boolean`，为 true 时启用 NProgress）。`OrangeRequestConfig` 为旧别名，新代码用前者。
- 401 自动无感刷新 token（并发请求排队），刷新失败则登出并跳转 `/login`；403 跳 403 页；502/503 节流提示"系统更新重启中"。
- 下载用 `http.download(url, params, config)`；流式响应用 `http.sse(url, data, { onMessage, onError, onDone })`，返回 abort 函数。
- 状态码提示（400/404/405/500 等）已在拦截器统一处理，业务代码**不要重复弹全局错误**。

### 5.3 状态管理

- 统一 **setup store**：`defineStore('xxx', () => { ... return { ... } })`。
- `useUserStore`（`stores/user.ts`）：`userInfo`、`getUserInfo/setUserInfo/fetchUserInfo/initAppUserInfo/logout/isLoggedIn`；用户信息持久化在 `localStorage['user_info']`，token 在 `utils/auth.ts`（内存 + `localStorage['token' | 'refresh_token']`）。
- `useThemeStore`（`stores/theme.ts`）：主题模式 `light | dark | auto`、尺寸 `small | default | large`、浅色/深色两套配色，持久化并在 `applyTheme()` 时写入 CSS 变量 + Element Plus 变量 + `html/body` 的 `dark` 类。
- 需要持久化时自己写 `localStorage` 读写（项目未引入 pinia 持久化插件）。

### 5.4 路由与菜单

路由分两类，写入位置不同：

**A. 带管理端布局的页面（绝大多数业务页）**

在 `src/router/modules/` 下新建 `xxx.ts`，默认导出单个路由对象或数组，并用 `satisfies ShortClipRoute`（数组用 `satisfies ShortClipRoute[]`）。会被 `import.meta.glob('./modules/**/*.ts', { eager: true })` 自动收集，按 `meta.sort`（缺省 999）排序后挂到 `/` → `layout/index.vue` 的 children 下，并自动补 `meta.isTop = true`。

**B. 不占用管理端布局的独立页面（登录、注册、大屏、嵌入页等）**

写入 `src/router/normal.ts`（当前为空数组），与 `login.ts` 同级被展开进顶层 `routes`：

```ts
// src/router/normal.ts
export default [
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: { title: '注册' },
  },
] satisfies ShortClipRoute[]
```

要点：

- `normal.ts` 默认导出**数组**，用 `satisfies ShortClipRoute[]` 约束；页面组件同样懒加载。
- 这类页面**不进入菜单**（`MenuRoutes` 只导出 `modules/` 收集到的路由），页面需自带完整结构与深色模式适配（`layout/index.vue` 的侧边栏/头部/内容容器都不会渲染）。
- 若该页面允许匿名访问，必须同时把路径加入 `src/router/index.ts` 守卫里的 `publicPaths` 数组（当前只有 `'/login'`），否则会被重定向到登录页。
- 顺序上 `normal.ts` 的路由展开在布局路由之前，兜底规则 `/:pathMatch(.*)* → /error/404` 保持在最后。

**通用约定**

- `meta` 字段（`types/router.d.ts`）：`title`、`icon`（Iconify 名，如 `ep:setting`）、`roles?: string[]`（空数组=所有登录用户）、`showMenu?: boolean`、`sort?: number`。
- 菜单数据来自 `router/index.ts` 导出的 `MenuRoutes`。
- 路由守卫已处理：未登录跳 `/login`、已登录访问 `/login` 跳 `/dashboard`、拉取用户信息（502/503 容错放行）、`meta.roles` 校验失败跳 `/error/403`、设置标题。**新增页面不要再造一套鉴权逻辑**。

### 5.5 权限判断

统一用 `src/utils/auth.ts`：`hasRole(role)`、`hasAnyRole(roles[])`、`hasAllRoles(roles[])`；页面级用 `meta.roles`，元素级用 `v-if="hasRole('supper_admin')"`。注意后端超级管理员角色码是 **`supper_admin`**（非 super）。

---

## 6. 页面开发规范

### 6.1 组件写法

- 一律 `<script setup lang="ts">`，并用 `defineOptions({ name: 'XxxYyy' })` 声明组件名（新代码用 `Sshine` 前缀语义，勿再沿用旧的 `ShortClip*` 命名）。
- Props 用 `defineProps<{ ... }>()` / `withDefaults`，Emits 用 `defineEmits<{ ... }>()`，类型优先复用 `src/api/gen` 导出的 VO/CMD 类型。
- 视图文件放 `src/views/<模块>/<页面>.vue`（当前 system 模块是平铺 `user.vue` / `role.vue`，新模块建议 `views/<模块>/index.vue` 或保持同级命名一致）。
- 布局组件命名前缀 `lay-*`（`lay-sidebar.vue` 等），业务组件放 `src/components/` 用大驼峰。

### 6.2 CRUD 页面标准结构

复用 `ViewLayout`（`@/layout/components/lay-view.vue`），它提供 `title` / `#header-actions` / `#search` / `#default` / `#footer` 五个插槽（空插槽自动隐藏），内置卡片 + 搜索区 + 内容区 + 底部分页栏布局：

```vue
<template>
  <ViewLayout title="XXX管理">
    <template #header-actions>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Icon icon="ep:plus" /></el-icon>新增
      </el-button>
    </template>

    <template #search>
      <el-form :model="searchForm" :inline="true"> ... 搜索/重置 ... </el-form>
    </template>

    <template #default>
      <el-table :data="tableData" v-loading="loading" row-key="id" height="100%"> ... </el-table>
      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑' : '新增'"> ... </el-dialog>
    </template>

    <template #footer>
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]" :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange" @current-change="handleCurrentChange" />
    </template>
  </ViewLayout>
</template>
```

配套脚本约定（参考 `src/views/system/user.vue`）：

- 响应式状态：`loading` / `tableData` / `total` / `currentPage` / `pageSize` / `searchForm`(reactive) / `dialogVisible` / `isEdit` / `<x>Form`。
- 方法命名：`getXxxList`、`handleSearch`、`handleReset`、`handleAdd`、`handleEdit(row)`、`handleDelete(row)`、`handleSave`、`handleSizeChange`、`handleCurrentChange`。
- 分页参数名对齐后端：`{ ...searchForm, current: currentPage, size: pageSize }`。
- 危险操作用 `ElMessageBox.confirm`，结果用 `ElMessage.success/error` 提示，成功后刷新列表。
- 表格高度用 `height="100%"`，不要写固定 px（布局内部已做 flex + min-height:0）。

### 6.3 富文本

需要富文本用 `@/components/RichTextEditor.vue`（基于 @tiptap/vue-3，已集成 image/link/placeholder）。

---

## 7. 代码风格

- **格式化**：Prettier（`.prettierrc.json`）——无分号、单引号、`printWidth: 100`；缩进 2 空格、LF、UTF-8。改完跑 `pnpm format`。
- **类型**：`tsconfig.app.json` 严格模式（继承 `@vue/tsconfig/tsconfig.dom.json`）。禁止滥用 `any`（确需时写注释说明）；生成器导出的类型优先复用，不要手写重复 VO。
- **ESLint**：`eslint.config.ts` 使用 `defineConfigWithVueTs` + `pluginVue.configs['flat/essential']` + `vueTsConfigs.recommended` + `skipFormatting`。提交前 `pnpm lint`。
- **命名**：
  - 文件/目录：组件与布局用 kebab-case（`lay-sidebar.vue`），业务组件可用大驼峰（`DefaultLogin.vue`）；
  - 变量/函数：小驼峰；布尔值用 `is/has/enable` 前缀；
  - 常量：全大写下划线（`TOKEN_KEY`、`USER_INFO_KEY`）；
  - 类型/接口：大驼峰，不要加 `I` 前缀（局部内部类型除外）；
  - 事件处理统一 `handleXxx`，接口拉取统一 `getXxx / fetchXxx`。
- **注释**：中文注释，只在非显而易见处写；不要保留调试用 `console.log`（生产构建虽由 `vite-plugin-remove-console` 移除，但仍应主动清理）。
- **CSS**：组件内样式一律 `<style scoped>`；需要穿透 Element Plus 内部节点用 `:deep()`。

---

## 8. 深色模式（强制）

实现方式：TailwindCSS v4 的 `@custom-variant dark (&:where(.dark, .dark *))`（`src/assets/main.css`），切换时在 `<html>` 与 `<body>` 上增删 `dark` 类。

三选一（推荐顺序）：

1. **Tailwind 变体**：`class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700"`
2. **CSS 变量**：`var(--theme-header-bg)`、`var(--theme-content-bg)`、`var(--theme-border-color)`、`var(--theme-sidebar-menu-text)`、`var(--theme-primary)` 等（完整清单见 `src/stores/theme.ts` 的 `ThemeColors`）
3. **Tailwind 主题 token**：`bg-theme-content-bg`、`text-theme-sidebar-menu-text`、`border-theme-border-color`（由 `@theme` 注册）

原则：

- **禁止硬编码颜色**（`color="#333"`、`style="background:#fff"`）；
- 写浅色样式时**同步写 `dark:`**；
- 深色下文字用 `gray-200/gray-300`，避免纯白刺眼，保证对比度；
- Element Plus 组件已由 `main.css` 中的**无层级（unlayered）**样式统一覆盖深色（表格/输入框/对话框/下拉等），通常无需额外处理；新增覆盖样式必须放在 `main.css` 的无层级位置，否则优先级不足。

---

## 9. 样式系统与主题

- `src/assets/main.css`：`@import 'tailwindcss'` + `@import './base.css' layer(base)` + `@custom-variant dark` + `@theme`（把 `--theme-*` 注册成 `--color-theme-*`）+ Element Plus 深色覆盖。
- 布局尺寸通过 `--theme-header-height`、`--theme-sidebar-width`、`--theme-content-padding` 等变量控制，由 `themeStore.applyThemeSize()` 按 `small|default|large` 写入；写布局时优先复用这些变量，不要写死高度。
- 主题色/预设主题在 `stores/theme.ts` 的 `presetThemes`（橙色经典/蓝色商务/绿色自然/紫色优雅），深浅两套配色成对维护。

---

## 10. 工程与部署

- `vite.config.ts`：别名 `@`→`src`；dev proxy `/api` → 目标后端（rewrite 去掉 `/api`）；插件：tailwindcss、vue、vueJsx、vueDevTools、viteMockServe(`mockPath: 'mock'`)、vite-plugin-remove-console、html title 注入。
- `Dockerfile`（nginx:alpine 托管 `dist`）+ `nginx.conf`（SPA fallback + `/api` 反代 `http://ts-backend:8080`）+ `docker-compose.yml`（frontend:80 / backend:8080）。
- `env.d.ts` 声明 `__APP_NAME__` 等全局常量类型；`types/` 存放全局 d.ts。
- 提交前自检清单：`pnpm type-check` ✅ → `pnpm lint` ✅ → 深色模式目视检查 ✅。

---

## 11. 已知历史遗留（改动时顺手纠正，勿再扩散）

- 遗留类型/类名：`ShortClipRoute`、组件 `defineOptions({ name: 'ShortClipSystemUser' })`。新代码统一使用 `SshineAdmin*` 命名。
- `src/utils/http` 命名已统一：HTTP 类 `SshineAdminHttp`、请求配置类型 `SshineAdminRequestConfig`（`OrangeRequestConfig` 兼容别名已删除）。生成器模板中的类型名常量需与之保持一致。
- `src/api/user.ts` 是遗留占位文件（仅一个 `login()`），无业务引用，勿使用。
- `src/router/index.ts` 与 `src/utils/auth.ts` 中存在调试用 `console.log`，清理时一并删除。
- ~~`src/api/gen/` 中带 `{id}` 路径参数的接口~~ **已修复**：生成脚本现从 URL 占位符兜底补齐未声明的路径参数（`resolveParameters`/`buildUrlTemplate`），已重新生成，gen 中无残留占位符。
- `src/stores/counter.ts` 为脚手架示例，可随业务清理。
