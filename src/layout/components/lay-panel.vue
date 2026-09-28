<template>
  <div class="flex items-center justify-between" :style="{ paddingLeft: `var(--theme-panel-padding-x)`, paddingRight: `var(--theme-panel-padding-x)`, height: `var(--theme-header-height)`, backgroundColor: 'var(--theme-header-bg)' }">
    <!-- 左侧搜索栏 -->
    <div class="flex-1">
      <!-- <lay-search /> -->
    </div>

    <!-- 右侧用户信息 -->
    <div class="flex items-center gap-4">
      <!-- 主题切换按钮 -->
      <ThemeToggle />

      <!-- 全屏按钮 -->
      <el-tooltip content="全屏" placement="bottom">
        <div
          class="flex items-center justify-center rounded-md cursor-pointer transition-all duration-300 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
          :style="{ width: `var(--theme-panel-icon-size)`, height: `var(--theme-panel-icon-size)` }"
          @click="toggleFullscreen"
        >
          <el-icon size="18">
            <Icon icon="ep:full-screen" />
          </el-icon>
        </div>
      </el-tooltip>

      <!-- 通知图标 -->
      <!-- <el-tooltip content="通知" placement="bottom">
        <div class="flex items-center justify-center w-9 h-9 rounded-md cursor-pointer text-gray-600 transition-all duration-300 hover:bg-gray-50 hover:text-blue-500">
          <el-badge :value="3" :max="99">
            <el-icon size="18">
              <Icon icon="ep:bell" />
            </el-icon>
          </el-badge>
        </div>
      </el-tooltip> -->

      <!-- 用户信息下拉菜单 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div
          class="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <el-avatar :size="32" :src="userInfo?.avatar || avatar" />
          <span class="text-sm text-gray-800 dark:text-gray-200 font-medium">
            {{ userInfo?.nickname || userInfo?.username || "管理员" }}
          </span>
          <el-icon class="text-xs text-gray-400 transition-transform duration-300">
            <Icon icon="ep:arrow-down" />
          </el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon>
                <Icon icon="ep:user" />
              </el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="theme">
              <el-icon>
                <Icon icon="ep:brush" />
              </el-icon>
              主题设置
            </el-dropdown-item>
            <el-dropdown-item command="nodeManagement">
              <el-icon>
                <Icon icon="ep:connection" />
              </el-icon>
              节点管理
            </el-dropdown-item>
            <el-dropdown-item command="checkUpdate">
              <el-icon>
                <Icon icon="ep:download" />
              </el-icon>
              检查更新
            </el-dropdown-item>
            <el-dropdown-item command="viewChangeLog">
              <el-icon>
                <Icon icon="ep:document" />
              </el-icon>
              变更日志
            </el-dropdown-item>
            <!-- <el-dropdown-item command="settings">
              <el-icon>
                <Icon icon="ep:setting" />
              </el-icon>
              系统设置
            </el-dropdown-item> -->
            <el-dropdown-item divided command="logout">
              <el-icon>
                <Icon icon="ep:switch-button" />
              </el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 节点管理弹窗 -->
      <NodeManagementDialog v-model="showNodeManagement" />

      <!-- 更新日志弹窗 -->
      <ChangeLogDialog v-model="showChangeLog" />

      <!-- 更新组件 -->
      <Updater ref="updaterRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useNodeStore } from "@/stores/node";
import { ElMessage, ElMessageBox } from "element-plus";
import { Icon } from "@iconify/vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
import NodeManagementDialog from "./NodeManagementDialog.vue";
import ChangeLogDialog from "@/components/ChangeLog/ChangeLogDialog.vue";
import Updater from "@/components/Updater/Updater.vue";
import avatar from "@/assets/user.png";
import { getToken } from "@/utils/auth";

defineOptions({
  name: "ShortClipPanel",
});

const router = useRouter();
const userStore = useUserStore();
const nodeStore = useNodeStore();

// 节点管理弹窗显示状态
const showNodeManagement = ref(false);

// 更新日志弹窗显示状态
const showChangeLog = ref(false);

// 更新组件引用
const updaterRef = ref<InstanceType<typeof Updater>>();

// 用户信息
const userInfo = computed(() => userStore.getUserInfo());

// 切换全屏
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

// 处理下拉菜单命令
const handleCommand = async (command: string) => {
  switch (command) {
    case "profile":
      router.push("/profile");
      break;
    case "theme":
      router.push("/system/theme");
      break;
    case "nodeManagement":
      await handleNodeManagement();
      break;
    case "checkUpdate":
      await handleCheckUpdate();
      break;
    case "viewChangeLog":
      handleViewChangeLog();
      break;
    case "logout":
      handleLogout();
      break;
  }
};

// 检查更新
const handleCheckUpdate = async () => {
  const result = await window.ipcRenderer?.invoke("check-update-by-user");
  if (!result?.isUpdateAvailable) {
    ElMessage.success("当前已是最新版本");
  }
};

// 查看更新日志
const handleViewChangeLog = () => {
  showChangeLog.value = true;
};

// 节点管理
const handleNodeManagement = async () => {
  await nodeStore.initNodes();
  showNodeManagement.value = true;
};

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm("确定要退出登录吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await userStore.logout();
      router.push("/login");
    })
    .catch(() => {
      // 用户取消
    });
};
onMounted(() => {
  // 如果已登录且没有用户信息，初始化用户信息
  if (getToken()) {
    userStore.initAppUserInfo();
  }
});
</script>
