import { ipcMain } from "electron";
import pkg from "electron-updater";
// import logger from "electron-log";
const { autoUpdater } = pkg;
let mainWindow: any = null;

/** 运行期定时检查间隔：1 小时 */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** 定时器句柄（退出时清理） */
let checkTimer: NodeJS.Timeout | null = null;

/** 是否已有一次检查在途，避免定时器与手动检查重叠 */
let checking = false;

/** 是否正在下载更新；下载期间不再触发检查 */
let downloading = false;

/**
 * 已提示过的版本号。
 * 运行期定时检查会反复查到同一个新版本，这里做去重：同一版本每次运行只弹一次，
 * 用户选了「稍后更新」也不会被每小时反复打扰；若期间又发布更高版本，仍会重新提示。
 */
let notifiedVersion = '';

export function upgradeHandle(window: any, feedUrl: any) {
  const msg = {
    error: "检查更新出错 ...",
    checking: "正在检查更 ...",
    updateAva: "检测到新版本 ...",
    updateNotAva: "已经是最新版本 ...",
    downloadProgress: "正在下载新版本 ...",
    downloaded: "下载完成，开始更新 ..."
  };
  mainWindow = window;
  autoUpdater.autoDownload = false; //true 自动升级 false 手动升级
  //设置更新包的地址
  autoUpdater.setFeedURL(feedUrl);
  autoUpdater.autoInstallOnAppQuit = false;
  // autoUpdater.logger = logger
  // autoUpdater.logger.transports.file.level = "info"
  // autoUpdater.forceDevUpdateConfig = true; // 开启开发模式更新配置



  //监听升级失败事件
  autoUpdater.on("error", function (message: any) {
    // 下载中途失败不会触发 update-downloaded，需在此复位，否则定时检查会被永久跳过
    downloading = false;
    sendUpdateMessage({
      cmd: "error",
      title: msg.error,
      message: message
    });
  });
  //监听开始检测更新事件
  autoUpdater.on("checking-for-update", function () {
    sendUpdateMessage({
      cmd: "checking-for-update",
      title: msg.checking,
      message: ""
    });
  });
  //监听发现可用更新事件
  autoUpdater.on("update-available", function (message: any) {
    // 同一版本每次运行只提示一次：定时检查每小时都会查到，重复弹窗会打扰用户
    const version = message?.version ?? '';
    if (version && version === notifiedVersion) {
      return;
    }
    notifiedVersion = version;
    sendUpdateMessage({
      cmd: "update-available",
      title: msg.updateAva,
      message: {
        ...message,
        currentVersion: autoUpdater.currentVersion
      }
    });
  });
  //监听没有可用更新事件
  autoUpdater.on("update-not-available", function (message: any) {
    sendUpdateMessage({
      cmd: "update-not-available",
      title: msg.updateNotAva,
      message: message
    });
  });

  // 更新下载进度事件
  autoUpdater.on("download-progress", function (message: any) {
    downloading = true;
    sendUpdateMessage({
      cmd: "download-progress",
      title: msg.downloadProgress,
      message: message
    });
  });
  //监听下载完成事件
  autoUpdater.on("update-downloaded", function (message: any) {
    downloading = false;
    sendUpdateMessage({
      cmd: "update-downloaded",
      title: msg.downloaded,
      message: "最新版本已下载完成, 退出程序进行安装"
    });
  });

  //接收渲染进程消息，开始检查更新
  ipcMain.on("checkForUpdate", () => {
    //执行自动更新检查
    autoUpdater.checkForUpdatesAndNotify();
  });
  ipcMain.on("downloadUpdate", () => {
    // 下载
    autoUpdater.downloadUpdate();
  });
  ipcMain.on("quitInstallApp", () => {
    // 退出安装
    autoUpdater.quitAndInstall();
  });
  ipcMain.handle("check-update-by-user", () => {
    return autoUpdater.checkForUpdates()
  })

  /**
   * 运行期定时检查：应用启动后每 1 小时查一次。
   *
   * 原有实现只在启动时查一次，用户长时间不关软件就永远发现不了新版本；
   * 这里补齐运行期检查。重复弹窗由 notifiedVersion 去重（见 update-available 处理）。
   */
  const runScheduledCheck = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (checking || downloading) return
    checking = true
    Promise.resolve(autoUpdater.checkForUpdates())
      .catch(() => {
        /* 离线等异常由 error 事件统一上报，这里静默即可 */
      })
      .finally(() => {
        checking = false
      })
  }

  if (checkTimer) {
    clearInterval(checkTimer)
  }
  checkTimer = setInterval(runScheduledCheck, CHECK_INTERVAL_MS)
  // 主进程退出前清理定时器
  process.once('beforeExit', () => {
    if (checkTimer) clearInterval(checkTimer)
    checkTimer = null
  })

  // 获取远程 changelog.json
  ipcMain.handle("get-changelog", async () => {
    try {
      const changelogUrl = feedUrl.endsWith('/') ? feedUrl + 'changelog.json' : feedUrl + '/changelog.json';
      const response = await fetch(changelogUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('获取 changelog 失败:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}

//给渲染进程发送消息
function sendUpdateMessage(text: any) {
  mainWindow.webContents.send("update-message", text);
}
