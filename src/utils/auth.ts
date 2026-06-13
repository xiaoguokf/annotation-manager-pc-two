import { useUserStore } from '@/stores/user'

const TOKEN_KEY = 'token'
const REFRESH_TOKEN_KEY = 'refresh_token'
let _token = localStorage.getItem(TOKEN_KEY) ?? ''
let _refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) ?? ''

export function getToken() {
  // 优先从内存读取，如果没有则从localStorage读取
  return (_token || localStorage.getItem(TOKEN_KEY)) ?? ''
}

export function setToken(token: string) {
  _token = token
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken() {
  _token = ''
  localStorage.removeItem(TOKEN_KEY)
}

export function getRefreshToken() {
  // 优先从内存读取，如果没有则从localStorage读取
  return (_refreshToken || localStorage.getItem(REFRESH_TOKEN_KEY)) ?? ''
}

export function setRefreshToken(refreshToken: string) {
  _refreshToken = refreshToken
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function removeRefreshToken() {
  _refreshToken = ''
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function hasRole(role: string): boolean {
  return useUserStore().getUserInfo()?.roles.includes(role) ?? false
}

export function hasAnyRole(roles: string[]): boolean {
  const _roles = useUserStore().getUserInfo()?.roles
  const result = _roles?.some((role) => roles.includes(role)) ?? false
  console.log('权限检查:', { userRoles: _roles, requiredRoles: roles, result })
  return result
}

export function hasAllRoles(roles: string[]): boolean {
  const _roles = useUserStore().getUserInfo()?.roles
  return _roles?.every((role) => roles.includes(role)) ?? false
}
