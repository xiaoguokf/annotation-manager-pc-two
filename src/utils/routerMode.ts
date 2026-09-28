/**
 * 应用运行环境判定。
 *
 * Electron 打包后渲染进程以 file:// 协议加载页面，没有 Web 服务器做 try_files 回退，
 * 且 file 协议的 pathname 是文件真实路径，因此路由必须走 hash 模式，
 * 否则任意路径都匹配不到业务路由、直接掉进 404 兜底。
 *
 * 浏览器 / dev 环境仍保持 history 路由。
 */

/** 当前是否运行在 file:// 协议（即 Electron 打包后的渲染进程） */
export const isFileProtocol = window.location.protocol === 'file:'
