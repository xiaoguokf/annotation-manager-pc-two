import { ipcMain } from "electron";
import pkg from "electron-updater";
// import logger from "electron-log";
const { autoUpdater } = pkg;
let mainWindow: any = null;

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
    sendUpdateMessage({
      cmd: "download-progress",
      title: msg.downloadProgress,
      message: message
    });
  });
  //监听下载完成事件
  autoUpdater.on("update-downloaded", function () {
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
