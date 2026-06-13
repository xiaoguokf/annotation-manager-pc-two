/**
 * 防抖函数：延迟执行，在延迟期间再次调用会重置计时器
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }) as T
}

/**
 * 节流函数：首次立即执行，冷却期内忽略后续调用
 * @param fn 需要节流的函数
 * @param interval 冷却时间（毫秒）
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, interval: number): T {
  let lastTime = 0
  return ((...args: any[]) => {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn(...args)
    }
  }) as T
}
