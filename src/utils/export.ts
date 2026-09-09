/**
 * 保存上次选择的文件夹路径
 */
export function saveLastExportFolder(folderPath: string): void {
  localStorage.setItem('lastExportFolder', folderPath)
}

/**
 * 获取上次选择的文件夹路径
 */
export function getLastExportFolder(): string | null {
  return localStorage.getItem('lastExportFolder')
}

/**
 * 检查是否在 Electron 环境中
 */
export function isElectron(): boolean {
  return typeof window.ipcRenderer !== 'undefined'
}
