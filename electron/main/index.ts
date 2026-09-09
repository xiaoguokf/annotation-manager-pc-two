import { release } from "node:os";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { upgradeHandle } from "./updater";
import {
  app,
  Menu,
  shell,
  ipcMain,
  BrowserWindow,
  dialog,
} from "electron";


// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.env.DIST_ELECTRON = join(__dirname, "..");
process.env.DIST = join(process.env.DIST_ELECTRON, "../dist");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL as string
  ? join(process.env.DIST_ELECTRON, "../public")
  : process.env.DIST;
// 是否为开发环境
const isDev = process.env["NODE_ENV"] === "development";

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.mjs");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, "index.html");

// 创建菜单
// function createMenu(label = "进入全屏幕") {
function createMenu() {
  Menu.setApplicationMenu(null)
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    title: "Main window",
    icon: join(process.env.PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);

    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }
  createMenu();

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344

  // 开发模式下右键打开开发者工具
  win.webContents.on('context-menu', (event, params) => {
    if (isDev) {
      const contextMenu = Menu.buildFromTemplate([
        { label: '检查元素', click: () => win?.webContents.inspectElement(params.x, params.y) },
        { label: '刷新', role: 'reload' },
        { label: '强制刷新', role: 'forceReload' },
        {
          label: '开发者工具', click: () => {
            if (win?.webContents.isDevToolsOpened()) {
              win?.webContents.closeDevTools()
            } else {
              win?.webContents.toggleDevTools()
            }
          }
        },
        { type: 'separator' },
        { label: '退出', role: 'quit' }
      ]);
      contextMenu.popup();
    }
  });

  // 窗口进入全屏状态时触发
  win.on("enter-full-screen", () => {
    // createMenu("退出全屏幕");
    createMenu();
  });

  // 窗口离开全屏状态时触发
  win.on("leave-full-screen", () => {
    createMenu();
  });
  upgradeHandle(win, import.meta.env.VITE_APP_DOWNLOAD);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// 菜单栏 https://www.electronjs.org/zh/docs/latest/api/menu-item#%E8%8F%9C%E5%8D%95%E9%A1%B9
const appMenu = (fullscreenLabel: string) => {
  const menuItems = [
    { label: "关于", role: "about" },
    { label: "开发者工具", role: "toggleDevTools" },
    { label: "强制刷新", role: "forcereload" },
    { label: "退出", role: "quit" }
  ];
  // 生产环境删除开发者工具菜单
  if (!isDev) menuItems.splice(1, 1);
  const template = [
    {
      label: app.name,
      submenu: menuItems
    },
    {
      label: "编辑",
      submenu: [
        { label: "撤销", role: "undo" },
        {
          label: "重做",
          role: "redo"
        },
        { type: "separator" },
        { label: "剪切", role: "cut" },
        { label: "复制", role: "copy" },
        { label: "粘贴", role: "paste" },
        { label: "删除", role: "delete" },
        { label: "全选", role: "selectAll" }
      ]
    },
    {
      label: "显示",
      submenu: [
        { label: "加大", role: "zoomin" },
        {
          label: "默认大小",
          role: "resetzoom"
        },
        { label: "缩小", role: "zoomout" },
        { type: "separator" },
        {
          label: fullscreenLabel,
          role: "togglefullscreen"
        }
      ]
    }
  ];
  return template;
};

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

// 选择文件夹
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择导出文件夹'
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 下载文件到指定位置
ipcMain.handle("download-file", async (event, url: string, filename: string, folderPath: string, token?: string, baseUrl?: string) => {
  const { net } = await import('electron')
  const { writeFile } = await import('fs/promises')
  const { join } = await import('path')

  try {
    // 判断是否为开发环境
    const isDev = process.env["NODE_ENV"] === "development"

    // 构建完整的 URL
    console.log('Download params:', { url, filename, folderPath, token: token ? 'exists' : 'none', baseUrl, isDev })
    let fullUrl: string
    if (isDev && process.env.VITE_DEV_SERVER_URL) {
      // 开发环境：VITE_DEV_SERVER_URL + baseUrl + apiUrl
      const devUrl = process.env.VITE_DEV_SERVER_URL
      const combined = devUrl + (baseUrl || '') + url
      // 处理多个连续的斜杠
      fullUrl = combined.replace(/\/+/g, '/')
    } else {
      // 生产环境：baseUrl + apiUrl
      const prodBaseUrl = baseUrl || '/api'
      const combined = prodBaseUrl + url
      // 处理多个连续的斜杠
      fullUrl = combined.replace(/\/+/g, '/')
    }
    // 构建请求头，添加 token
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = token
    }

    // 下载文件
    const response = await net.fetch(fullUrl, {
      headers
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // 如果返回的是 JSON（错误响应），抛出异常
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        const jsonData = JSON.parse(await response.text())
        const errorMessage = jsonData.msg || jsonData.message || '下载失败：服务器返回了错误'
        throw errorMessage
      } catch (parseError) {
        // 如果不是有效的 JSON，继续处理
        if (parseError instanceof SyntaxError) {
          console.log('Not a valid JSON, treating as file content')
        } else {
          throw parseError
        }
      }
    }

    // 从响应头中提取文件名
    const disposition = response.headers.get('content-disposition')
    let finalFilename = filename
    if (disposition) {
      const filenameRegex = /filename\*=(UTF-8'')?([^;\n]*)/i
      const matches = filenameRegex.exec(disposition)
      if (matches != null && matches[2]) {
        finalFilename = decodeURIComponent(matches[2])
      }
    }
    // 使用传入的文件夹路径
    const savePath = join(folderPath, finalFilename)

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(savePath, buffer)

    console.log('File saved to:', savePath)
    return { success: true, path: savePath }
  } catch (error) {
    console.error('Download error:', error)
    return { success: false, error: String(error) }
  }
});


