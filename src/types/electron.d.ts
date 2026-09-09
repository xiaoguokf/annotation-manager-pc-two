export interface ElectronAPI {
  selectFolder: () => Promise<string | null>
  downloadFile: (url: string, filename: string, folderPath: string, token?: string) => Promise<{
    success: boolean
    path?: string
    error?: string
  }>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
