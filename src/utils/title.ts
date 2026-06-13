/**
 * 浏览器标题管理工具
 */

import { APP_NAME } from '@/config/app'

const DEFAULT_TITLE = APP_NAME

/**
 * 设置浏览器标题
 * @param title 页面标题，如果不提供则使用默认标题
 */
export function setPageTitle(title?: string): void {
  if (title) {
    document.title = `${title} - ${DEFAULT_TITLE}`
  } else {
    document.title = DEFAULT_TITLE
  }
}

/**
 * 获取当前页面标题
 */
export function getPageTitle(): string {
  return document.title
}