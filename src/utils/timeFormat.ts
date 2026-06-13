/**
 * 时间格式化工具类
 * 用于将时间戳或日期字符串转换为相对时间格式
 */

/**
 * 格式化时间为相对时间格式
 * @param time 时间字符串或时间戳
 * @returns 格式化后的相对时间字符串
 */
export function formatRelativeTime(time?: string | number | Date): string {
  if (!time) return '-'
  
  try {
    // 转换为Date对象
    const date = new Date(time)
    if (isNaN(date.getTime())) return '-'
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)
    
    // 如果时间差小于1分钟
    if (diffSeconds < 60) {
      return '刚刚'
    }
    
    // 小于1小时
    if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`
    }
    
    // 小于1天
    if (diffHours < 24) {
      return `${diffHours}小时前`
    }
    
    // 小于1个月
    if (diffDays < 30) {
      return `${diffDays}天前`
    }
    
    // 小于1年
    if (diffMonths < 12) {
      return `${diffMonths}个月前`
    }
    
    // 超过1年
    return `${diffYears}年前`
  } catch (error) {
    console.error('时间格式化错误:', error)
    return '-'
  }
}

/**
 * 格式化时间为标准日期时间格式
 * @param time 时间字符串或时间戳
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(time?: string | number | Date): string {
  if (!time) return '-'
  
  try {
    const date = new Date(time)
    if (isNaN(date.getTime())) return '-'
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.error('时间格式化错误:', error)
    return '-'
  }
}

/**
 * 格式化时间为短日期格式
 * @param time 时间字符串或时间戳
 * @returns 格式化后的日期字符串
 */
export function formatDate(time?: string | number | Date): string {
  if (!time) return '-'
  
  try {
    const date = new Date(time)
    if (isNaN(date.getTime())) return '-'
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    console.error('时间格式化错误:', error)
    return '-'
  }
}

/**
 * 判断时间是否为最近（24小时内）
 * @param time 时间字符串或时间戳
 * @returns 是否为最近时间
 */
export function isRecent(time?: string | number | Date): boolean {
  if (!time) return false
  
  try {
    const date = new Date(time)
    if (isNaN(date.getTime())) return false
    
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    return diffHours < 24
  } catch (error) {
    console.error('时间判断错误:', error)
    return false
  }
}