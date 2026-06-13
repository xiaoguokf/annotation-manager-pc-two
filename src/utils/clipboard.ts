/**
 * 复制功能工具类
 * 支持 HTTPS 和 HTTP 环境下的文本复制
 */

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @param successMessage 复制成功时的提示信息
 * @param errorMessage 复制失败时的提示信息
 * @returns Promise<boolean> 复制是否成功
 */
export async function copyToClipboard(
  text: string,
  successMessage: string = '复制成功',
  errorMessage: string = '复制失败'
): Promise<boolean> {
  try {
    // 检查是否支持 Clipboard API (HTTPS 环境)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      if (successMessage) {
        // 动态导入 ElMessage 避免循环依赖
        const { ElMessage } = await import('element-plus')
        ElMessage.success(successMessage)
      }
      return true
    } else {
      // 降级方案：使用 document.execCommand (HTTP 环境)
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand('copy')
        if (successful && successMessage) {
          const { ElMessage } = await import('element-plus')
          ElMessage.success(successMessage)
        } else if (!successful && errorMessage) {
          const { ElMessage } = await import('element-plus')
          ElMessage.error(errorMessage)
        }
        return successful
      } catch {
        if (errorMessage) {
          const { ElMessage } = await import('element-plus')
          ElMessage.error(errorMessage)
        }
        return false
      } finally {
        document.body.removeChild(textArea)
      }
    }
  } catch {
    if (errorMessage) {
      const { ElMessage } = await import('element-plus')
      ElMessage.error(errorMessage)
    }
    return false
  }
}

/**
 * 静默复制文本到剪贴板（不显示提示消息）
 * @param text 要复制的文本
 * @returns Promise<boolean> 复制是否成功
 */
export async function copyToClipboardSilent(text: string): Promise<boolean> {
  return copyToClipboard(text, '', '')
}