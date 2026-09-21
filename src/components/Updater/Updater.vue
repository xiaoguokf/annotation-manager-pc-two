<script setup lang="ts">
import { nextTick, ref, computed, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import { Icon } from '@iconify/vue';

defineOptions(
  {
    name: "AnnonationUpdater"
  }
)
interface UpdateInfoCom<T> {
  cmd:
  | "checking-for-update"
  | "update-available"
  | "download-progress"
  | "update-downloaded";
  title: string;
  message: T;
}

interface UpdateAvailable { version: string; currentVersion?: { version: string } };
type DownloadProgress = {
  total: number;
  delta: number;
  transferred: number;
  percent: number;
  bytesPerSecond: number;
};
type UpdateInfo =
  | UpdateInfoCom<UpdateAvailable>
  | UpdateInfoCom<DownloadProgress>;

interface ChangeLogVersion {
  version: string;
  date: string;
  newFeatures?: string[];
  fixes?: string[];
  optimizations?: string[];
}

interface ChangeLogData {
  versions: ChangeLogVersion[];
}

const newVersion = ref("");
const currentVersion = ref({
  version: ""
});
const loading = ref(false);
const percent = ref(0);
const downloadSpeed = ref(0);
const downloadedSize = ref(0);
const totalSize = ref(0);
const changelogDialogVisible = ref(false);
const changeLogs = ref<ChangeLogVersion[]>([]);
const remoteChangeLogData = ref<ChangeLogData | null>(null);

// 判断是否为强制更新（次版本号或主版本号变化）
const isForceUpdate = computed(() => {
  if (!newVersion.value || !currentVersion.value?.version) return false;

  console.log({
    nw: newVersion.value,
    cv: currentVersion.value
  });

  const parseVersion = (version: string) => {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  };

  const newVer = parseVersion(newVersion.value);
  const currentVer = parseVersion(currentVersion.value.version);

  // 主版本号或次版本号变化，则强制更新
  return newVer.major > currentVer.major || newVer.minor > currentVer.minor;
});

// 通过 Electron 加载远程 changelog.json
async function loadRemoteChangeLog() {
  try {
    const result = await window.ipcRenderer?.invoke("get-changelog");
    if (result && result.success) {
      remoteChangeLogData.value = result.data;
    } else {
      console.error('加载远程更新日志失败:', result?.error || 'Unknown error');
    }
  } catch (error) {
    console.error('加载远程更新日志失败:', error);
  }
}

// 版本号转换为数字用于比较
function versionToNumber(version: string): number {
  const parts = version.split('.').map(Number);
  return (parts[0] || 0) * 1000000 + (parts[1] || 0) * 1000 + (parts[2] || 0);
}

// 获取所有比当前版本大的更新日志
function getChangeLogs(): ChangeLogVersion[] {
  if (!remoteChangeLogData.value) return [];

  const currentVerNum = versionToNumber(currentVersion.value.version);

  return remoteChangeLogData.value.versions
    .filter(v => {
      const verNum = versionToNumber(v.version);
      return verNum > currentVerNum;
    })
    .sort((a, b) => versionToNumber(b.version) - versionToNumber(a.version));
}

window.ipcRenderer?.on("update-message", async (event, updateInfo: UpdateInfo) => {
  console.log("[更新消息]", updateInfo);
  switch (updateInfo.cmd) {
    case "update-available":
      const updateAvailable = updateInfo?.message as UpdateAvailable;
      newVersion.value = updateAvailable.version ?? "";
      currentVersion.value = updateAvailable.currentVersion ?? { version: "" };

      // 加载更新日志
      await loadRemoteChangeLog();
      changeLogs.value = getChangeLogs();

      // 显示更新日志弹窗
      changelogDialogVisible.value = true;
      break;
    case "download-progress":
      const downloadProgress = updateInfo?.message as DownloadProgress;
      percent.value = Math.round(downloadProgress.percent);
      downloadSpeed.value = downloadProgress.bytesPerSecond;
      downloadedSize.value = downloadProgress.transferred;
      totalSize.value = downloadProgress.total;
      break;
    case "update-downloaded":
      ElMessageBox.confirm("新版软件已就绪，点击确定", "提示", {
        confirmButtonText: "立即安装",
        cancelButtonText: isForceUpdate.value ? "" : "下次安装",
        type: "info",
        showCancelButton: !isForceUpdate.value,
        closeOnClickModal: !isForceUpdate.value,
        closeOnPressEscape: !isForceUpdate.value,
        showClose: !isForceUpdate.value
      })
        .then(() => {
          window.ipcRenderer.send("quitInstallApp");
        })
        .catch(() => {
          changelogDialogVisible.value = false;
        });
  }
});
nextTick(() => {
  if (sessionStorage.getItem("update-tips") === "false") {
    return;
  }
  window.ipcRenderer?.send("checkForUpdate");
});
function closeChangeLog() {
  changelogDialogVisible.value = false;
  sessionStorage.setItem("update-tips", "false");
}

function updateHandler() {
  window.ipcRenderer.send("downloadUpdate");
  loading.value = true;
}


const downloadUrlRef = ref();

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
  return formatSize(bytesPerSecond) + '/s';
}
function openUrlOther() {
  downloadUrlRef.value.click();
}
const downloadUrl = import.meta.env.VITE_APP_DOWNLOAD.endsWith('/') ? import.meta.env.VITE_APP_DOWNLOAD + 'download.html' : import.meta.env.VITE_APP_DOWNLOAD + '/download.html';
</script>

<template>
  <!-- 更新日志弹窗 -->
  <el-dialog v-model="changelogDialogVisible" :title="'发现新版本 ' + newVersion" width="50%" align-center
    :close-on-click-modal="!isForceUpdate" :show-close="!isForceUpdate" class="update-dialog">
    <div v-if="changeLogs.length === 0" class="empty-logs">
      暂无更新日志
    </div>
    <div v-else class="changelog-container">
      <div class="changelog-list">
        <div v-for="log in changeLogs" :key="log.version" class="changelog-item">
          <div class="changelog-header">
            <span class="version-tag">v{{ log.version }}</span>
            <span class="release-date">{{ log.date }}</span>
          </div>
          <div v-if="log.newFeatures && log.newFeatures.length > 0" class="changelog-section">
            <div class="section-title">
              <Icon icon="ep:circle-plus" class="new-feature-icon" />
              <span>功能新增</span>
            </div>
            <ul class="changelog-features">
              <li v-for="(feature, index) in log.newFeatures" :key="index">
                {{ feature }}
              </li>
            </ul>
          </div>
          <div v-if="log.fixes && log.fixes.length > 0" class="changelog-section">
            <div class="section-title">
              <Icon icon="mdi:bug" class="fix-icon" />
              <span>功能修复</span>
            </div>
            <ul class="changelog-features">
              <li v-for="(fix, index) in log.fixes" :key="index">
                {{ fix }}
              </li>
            </ul>
          </div>
          <div v-if="log.optimizations && log.optimizations.length > 0" class="changelog-section">
            <div class="section-title">
              <Icon icon="ep:refresh" class="optimize-icon" />
              <span>体验优化</span>
            </div>
            <ul class="changelog-features">
              <li v-for="(opt, index) in log.optimizations" :key="index">
                {{ opt }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer-wrapper">
        <div v-if="loading" class="download-footer">
          <div class="download-progress">
            <el-progress :percentage="percent" />
          </div>
          <div class="download-info-footer">
            <div class="info-item">下载速度: {{ formatSpeed(downloadSpeed) }}</div>
            <div class="info-item">已下载: {{ formatSize(downloadedSize) }} / {{ formatSize(totalSize) }}</div>
          </div>
        </div>
        <div class="dialog-footer-buttons">
          <el-button v-show="!loading && !isForceUpdate" @click="closeChangeLog">
            稍后更新
          </el-button>
          <el-button v-show="loading && !isForceUpdate" @click="closeChangeLog">
            后台下载
          </el-button>
          <el-button v-show="!loading" type="primary" @click="updateHandler">
            {{ isForceUpdate ? '立即更新' : '立即下载' }}
          </el-button>
          <el-button v-show="loading" type="primary" @click="openUrlOther">
            浏览器下载
          </el-button>
          <a ref="downloadUrlRef" class="hidden" :href="downloadUrl" target="_blank">浏览器下载</a>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.download-footer {
  width: 100%;
}

.download-progress {
  margin-bottom: 8px;
}

.download-info-footer {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #606266;
}

.download-info-footer .info-item {
  display: flex;
  align-items: center;
}

.dialog-footer-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.download-info {
  margin-top: 16px;
}

.download-info .info-item {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.update-notice {
  display: flex;
  align-items: center;
}

.changelog-container {
  max-height: 400px;
  overflow-y: auto;
}

.empty-logs {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.changelog-list {
  padding: 10px 0;
}

.changelog-item {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.changelog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.version-tag {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.release-date {
  font-size: 12px;
  color: #909399;
}

.changelog-section {
  margin-bottom: 16px;
}

.changelog-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.new-feature-icon {
  margin-right: 6px;
  color: #67c23a;
  width: 16px;
  height: 16px;
}

.fix-icon {
  margin-right: 6px;
  color: #409eff;
  width: 16px;
  height: 16px;
}

.changelog-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.changelog-features li {
  position: relative;
  padding-left: 20px;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.changelog-features li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #409eff;
  font-weight: bold;
}

.changelog-features li:last-child {
  margin-bottom: 0;
}
</style>
