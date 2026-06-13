import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 主题类型定义
export type ThemeMode = 'light' | 'dark' | 'auto'

// 主题尺寸类型
export type ThemeSize = 'small' | 'default' | 'large'

// 主题颜色配置
export interface ThemeColors {
  // 主色调
  primary: string
  primaryLight: string
  primaryDark: string

  // 侧边栏颜色
  sidebarBg: string
  sidebarLogoBg: string
  sidebarLogoText: string
  sidebarMenuHover: string
  sidebarMenuActive: string
  sidebarMenuActiveBorder: string
  sidebarMenuText: string
  sidebarMenuActiveText: string
  sidebarFooterBg: string

  // 二级菜单颜色
  submenuBg: string
  submenuBorder: string
  submenuItemHover: string
  submenuItemActive: string
  submenuItemText: string
  submenuItemActiveText: string
  submenuItemShadow: string
  submenuItemActiveShadow: string
  submenuItemActiveHoverShadow: string

  // 背景颜色
  headerBg: string
  contentBg: string
  footerBg: string

  // 边框颜色
  borderColor: string
  borderColorLight: string
}

// 默认浅色主题配置
const defaultLightColors: ThemeColors = {
  primary: '#3b82f6',
  primaryLight: '#dbeafe',
  primaryDark: '#2563eb',

  sidebarBg: '#eff6ff',
  sidebarLogoBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  sidebarLogoText: '#ffffff',
  sidebarMenuHover: 'rgba(59, 130, 246, 0.1)',
  sidebarMenuActive: '#3b82f6',
  sidebarMenuActiveBorder: '#1e40af',
  sidebarMenuText: '#374151',
  sidebarMenuActiveText: '#ffffff',
  sidebarFooterBg: '#1e40af',

  submenuBg: 'rgba(255, 255, 255, 0.8)',
  submenuBorder: 'rgba(59, 130, 246, 0.2)',
  submenuItemHover: 'rgba(59, 130, 246, 0.1)',
  submenuItemActive: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  submenuItemText: '#4b5563',
  submenuItemActiveText: '#ffffff',
  submenuItemShadow: '0 2px 8px rgba(59, 130, 246, 0.12)',
  submenuItemActiveShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
  submenuItemActiveHoverShadow: '0 6px 20px rgba(59, 130, 246, 0.35)',

  headerBg: '#ffffff',
  contentBg: '#f8fafc',
  footerBg: '#ffffff',

  borderColor: '#e2e8f0',
  borderColorLight: '#f1f5f9'
}

// 默认深色主题配置
const defaultDarkColors: ThemeColors = {
  primary: '#3b82f6',
  primaryLight: '#1e3a5f',
  primaryDark: '#60a5fa',

  sidebarBg: '#1a1a2e',
  sidebarLogoBg: 'linear-gradient(135deg, #1e2a4a 0%, #171730 100%)',
  sidebarLogoText: '#94a3b8',
  sidebarMenuHover: 'rgba(59, 130, 246, 0.12)',
  sidebarMenuActive: 'rgba(59, 130, 246, 0.2)',
  sidebarMenuActiveBorder: 'rgba(59, 130, 246, 0.5)',
  sidebarMenuText: '#c9d1d9',
  sidebarMenuActiveText: '#60a5fa',
  sidebarFooterBg: '#171730',

  submenuBg: 'rgba(30, 30, 46, 0.9)',
  submenuBorder: 'rgba(59, 130, 246, 0.2)',
  submenuItemHover: 'rgba(59, 130, 246, 0.12)',
  submenuItemActive: 'rgba(59, 130, 246, 0.2)',
  submenuItemText: '#c9d1d9',
  submenuItemActiveText: '#60a5fa',
  submenuItemShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  submenuItemActiveShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
  submenuItemActiveHoverShadow: '0 6px 20px rgba(59, 130, 246, 0.3)',

  headerBg: '#252536',
  contentBg: '#1a1a2e',
  footerBg: '#252536',

  borderColor: '#3a3a4e',
  borderColorLight: '#2a2a3e'
}

// 预设主题配置
export const presetThemes = [
  {
    name: '橙色经典',
    primaryColor: '#fb923c',
    colors: {
      primary: '#fb923c',
      primaryLight: '#fed7aa',
      primaryDark: '#f97316',
      sidebarBg: '#ffedd5',
      sidebarLogoBg: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
      sidebarLogoText: '#ffffff',
      sidebarMenuHover: 'rgba(251, 146, 60, 0.1)',
      sidebarMenuActive: '#fb923c',
      sidebarMenuActiveBorder: '#c2410c',
      sidebarMenuText: '#374151',
      sidebarMenuActiveText: '#ffffff',
      sidebarFooterBg: '#ea580c',
      submenuBg: 'rgba(255, 255, 255, 0.8)',
      submenuBorder: 'rgba(251, 146, 60, 0.2)',
      submenuItemHover: 'rgba(251, 146, 60, 0.1)',
      submenuItemActive: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
      submenuItemText: '#4b5563',
      submenuItemActiveText: '#ffffff',
      submenuItemShadow: '0 2px 8px rgba(251, 146, 60, 0.15)',
      submenuItemActiveShadow: '0 4px 16px rgba(251, 146, 60, 0.3)',
      submenuItemActiveHoverShadow: '0 6px 20px rgba(251, 146, 60, 0.45)',
      headerBg: '#ffffff',
      contentBg: '#f9fafb',
      footerBg: '#ffffff',
      borderColor: '#e5e7eb',
      borderColorLight: '#f3f4f6'
    } as ThemeColors,
    darkColors: {
      primary: '#fb923c',
      primaryLight: '#3d2810',
      primaryDark: '#fdba74',
      sidebarBg: '#1a1a2e',
      sidebarLogoBg: 'linear-gradient(135deg, #2e2215 0%, #1a1a2e 100%)',
      sidebarLogoText: '#94a3b8',
      sidebarMenuHover: 'rgba(251, 146, 60, 0.12)',
      sidebarMenuActive: 'rgba(251, 146, 60, 0.2)',
      sidebarMenuActiveBorder: 'rgba(251, 146, 60, 0.5)',
      sidebarMenuText: '#c9d1d9',
      sidebarMenuActiveText: '#fdba74',
      sidebarFooterBg: '#1a1a2e',
      submenuBg: 'rgba(30, 30, 46, 0.9)',
      submenuBorder: 'rgba(251, 146, 60, 0.2)',
      submenuItemHover: 'rgba(251, 146, 60, 0.12)',
      submenuItemActive: 'rgba(251, 146, 60, 0.2)',
      submenuItemText: '#c9d1d9',
      submenuItemActiveText: '#fdba74',
      submenuItemShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      submenuItemActiveShadow: '0 4px 16px rgba(251, 146, 60, 0.2)',
      submenuItemActiveHoverShadow: '0 6px 20px rgba(251, 146, 60, 0.3)',
      headerBg: '#252536',
      contentBg: '#1a1a2e',
      footerBg: '#252536',
      borderColor: '#3a3a4e',
      borderColorLight: '#2a2a3e'
    } as ThemeColors
  },
  {
    name: '蓝色商务',
    primaryColor: '#3b82f6',
    colors: {
      primary: '#3b82f6',
      primaryLight: '#dbeafe',
      primaryDark: '#2563eb',
      sidebarBg: '#eff6ff',
      sidebarLogoBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      sidebarLogoText: '#ffffff',
      sidebarMenuHover: 'rgba(59, 130, 246, 0.1)',
      sidebarMenuActive: '#3b82f6',
      sidebarMenuActiveBorder: '#1e40af',
      sidebarMenuText: '#374151',
      sidebarMenuActiveText: '#ffffff',
      sidebarFooterBg: '#1e40af',
      submenuBg: 'rgba(255, 255, 255, 0.8)',
      submenuBorder: 'rgba(59, 130, 246, 0.2)',
      submenuItemHover: 'rgba(59, 130, 246, 0.1)',
      submenuItemActive: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      submenuItemText: '#4b5563',
      submenuItemActiveText: '#ffffff',
      submenuItemShadow: '0 2px 8px rgba(59, 130, 246, 0.12)',
      submenuItemActiveShadow: '0 4px 16px rgba(59, 130, 246, 0.25)',
      submenuItemActiveHoverShadow: '0 6px 20px rgba(59, 130, 246, 0.35)',
      headerBg: '#ffffff',
      contentBg: '#f8fafc',
      footerBg: '#ffffff',
      borderColor: '#e2e8f0',
      borderColorLight: '#f1f5f9'
    } as ThemeColors,
    darkColors: {
      primary: '#3b82f6',
      primaryLight: '#1e3a5f',
      primaryDark: '#60a5fa',
      sidebarBg: '#1a1a2e',
      sidebarLogoBg: 'linear-gradient(135deg, #1e2a4a 0%, #171730 100%)',
      sidebarLogoText: '#94a3b8',
      sidebarMenuHover: 'rgba(59, 130, 246, 0.12)',
      sidebarMenuActive: 'rgba(59, 130, 246, 0.2)',
      sidebarMenuActiveBorder: 'rgba(59, 130, 246, 0.5)',
      sidebarMenuText: '#c9d1d9',
      sidebarMenuActiveText: '#60a5fa',
      sidebarFooterBg: '#171730',
      submenuBg: 'rgba(30, 30, 46, 0.9)',
      submenuBorder: 'rgba(59, 130, 246, 0.2)',
      submenuItemHover: 'rgba(59, 130, 246, 0.12)',
      submenuItemActive: 'rgba(59, 130, 246, 0.2)',
      submenuItemText: '#c9d1d9',
      submenuItemActiveText: '#60a5fa',
      submenuItemShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      submenuItemActiveShadow: '0 4px 16px rgba(59, 130, 246, 0.2)',
      submenuItemActiveHoverShadow: '0 6px 20px rgba(59, 130, 246, 0.3)',
      headerBg: '#252536',
      contentBg: '#1a1a2e',
      footerBg: '#252536',
      borderColor: '#3a3a4e',
      borderColorLight: '#2a2a3e'
    } as ThemeColors
  },
  {
    name: '绿色自然',
    primaryColor: '#10b981',
    colors: {
      primary: '#10b981',
      primaryLight: '#d1fae5',
      primaryDark: '#059669',
      sidebarBg: '#ecfdf5',
      sidebarLogoBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      sidebarLogoText: '#ffffff',
      sidebarMenuHover: 'rgba(16, 185, 129, 0.1)',
      sidebarMenuActive: '#10b981',
      sidebarMenuActiveBorder: '#047857',
      sidebarMenuText: '#374151',
      sidebarMenuActiveText: '#ffffff',
      sidebarFooterBg: '#047857',
      submenuBg: 'rgba(255, 255, 255, 0.8)',
      submenuBorder: 'rgba(16, 185, 129, 0.2)',
      submenuItemHover: 'rgba(16, 185, 129, 0.1)',
      submenuItemActive: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      submenuItemText: '#4b5563',
      submenuItemActiveText: '#ffffff',
      submenuItemShadow: '0 2px 8px rgba(16, 185, 129, 0.12)',
      submenuItemActiveShadow: '0 4px 16px rgba(16, 185, 129, 0.25)',
      submenuItemActiveHoverShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
      headerBg: '#ffffff',
      contentBg: '#f0fdf4',
      footerBg: '#ffffff',
      borderColor: '#d1fae5',
      borderColorLight: '#d1fae5'
    } as ThemeColors,
    darkColors: {
      primary: '#10b981',
      primaryLight: '#0d3b2e',
      primaryDark: '#34d399',
      sidebarBg: '#1a1a2e',
      sidebarLogoBg: 'linear-gradient(135deg, #152e25 0%, #171730 100%)',
      sidebarLogoText: '#94a3b8',
      sidebarMenuHover: 'rgba(16, 185, 129, 0.12)',
      sidebarMenuActive: 'rgba(16, 185, 129, 0.2)',
      sidebarMenuActiveBorder: 'rgba(16, 185, 129, 0.5)',
      sidebarMenuText: '#c9d1d9',
      sidebarMenuActiveText: '#34d399',
      sidebarFooterBg: '#171730',
      submenuBg: 'rgba(30, 30, 46, 0.9)',
      submenuBorder: 'rgba(16, 185, 129, 0.2)',
      submenuItemHover: 'rgba(16, 185, 129, 0.12)',
      submenuItemActive: 'rgba(16, 185, 129, 0.2)',
      submenuItemText: '#c9d1d9',
      submenuItemActiveText: '#34d399',
      submenuItemShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      submenuItemActiveShadow: '0 4px 16px rgba(16, 185, 129, 0.2)',
      submenuItemActiveHoverShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
      headerBg: '#252536',
      contentBg: '#1a1a2e',
      footerBg: '#252536',
      borderColor: '#3a3a4e',
      borderColorLight: '#2a2a3e'
    } as ThemeColors
  },
  {
    name: '紫色优雅',
    primaryColor: '#8b5cf6',
    colors: {
      primary: '#8b5cf6',
      primaryLight: '#ede9fe',
      primaryDark: '#7c3aed',
      sidebarBg: '#f3e8ff',
      sidebarLogoBg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      sidebarLogoText: '#ffffff',
      sidebarMenuHover: 'rgba(139, 92, 246, 0.1)',
      sidebarMenuActive: '#8b5cf6',
      sidebarMenuActiveBorder: '#6d28d9',
      sidebarMenuText: '#374151',
      sidebarMenuActiveText: '#ffffff',
      sidebarFooterBg: '#6d28d9',
      submenuBg: 'rgba(255, 255, 255, 0.8)',
      submenuBorder: 'rgba(139, 92, 246, 0.2)',
      submenuItemHover: 'rgba(139, 92, 246, 0.1)',
      submenuItemActive: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      submenuItemText: '#4b5563',
      submenuItemActiveText: '#ffffff',
      submenuItemShadow: '0 2px 8px rgba(139, 92, 246, 0.12)',
      submenuItemActiveShadow: '0 4px 16px rgba(139, 92, 246, 0.25)',
      submenuItemActiveHoverShadow: '0 6px 20px rgba(139, 92, 246, 0.35)',
      headerBg: '#ffffff',
      contentBg: '#faf5ff',
      footerBg: '#ffffff',
      borderColor: '#e9d5ff',
      borderColorLight: '#f3e8ff'
    } as ThemeColors,
    darkColors: {
      primary: '#8b5cf6',
      primaryLight: '#2e1f5e',
      primaryDark: '#a78bfa',
      sidebarBg: '#1a1a2e',
      sidebarLogoBg: 'linear-gradient(135deg, #241e40 0%, #171730 100%)',
      sidebarLogoText: '#94a3b8',
      sidebarMenuHover: 'rgba(139, 92, 246, 0.12)',
      sidebarMenuActive: 'rgba(139, 92, 246, 0.2)',
      sidebarMenuActiveBorder: 'rgba(139, 92, 246, 0.5)',
      sidebarMenuText: '#c9d1d9',
      sidebarMenuActiveText: '#a78bfa',
      sidebarFooterBg: '#171730',
      submenuBg: 'rgba(30, 30, 46, 0.9)',
      submenuBorder: 'rgba(139, 92, 246, 0.2)',
      submenuItemHover: 'rgba(139, 92, 246, 0.12)',
      submenuItemActive: 'rgba(139, 92, 246, 0.2)',
      submenuItemText: '#c9d1d9',
      submenuItemActiveText: '#a78bfa',
      submenuItemShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      submenuItemActiveShadow: '0 4px 16px rgba(139, 92, 246, 0.2)',
      submenuItemActiveHoverShadow: '0 6px 20px rgba(139, 92, 246, 0.3)',
      headerBg: '#252536',
      contentBg: '#1a1a2e',
      footerBg: '#252536',
      borderColor: '#3a3a4e',
      borderColorLight: '#2a2a3e'
    } as ThemeColors
  }
]

const THEME_KEY = 'theme_mode'
const CUSTOM_LIGHT_COLORS_KEY = 'custom_light_theme_colors'
const CUSTOM_DARK_COLORS_KEY = 'custom_dark_theme_colors'
const CUSTOM_COLORS_KEY = 'custom_theme_colors' // 旧键名，用于迁移
const THEME_SIZE_KEY = 'theme_size'

export const useThemeStore = defineStore('theme', () => {
  // 迁移旧的自定义颜色数据
  const migrateOldColors = () => {
    const oldData = localStorage.getItem(CUSTOM_COLORS_KEY)
    if (oldData && !localStorage.getItem(CUSTOM_LIGHT_COLORS_KEY)) {
      try {
        const parsed = JSON.parse(oldData)
        if (parsed && typeof parsed === 'object') {
          localStorage.setItem(CUSTOM_LIGHT_COLORS_KEY, oldData)
        }
      } catch {
        // 忽略解析错误
      }
      localStorage.removeItem(CUSTOM_COLORS_KEY)
    }
  }
  migrateOldColors()

  // 主题模式
  const themeMode = ref<ThemeMode>(
    (localStorage.getItem(THEME_KEY) as ThemeMode) || 'light'
  )

  // 主题尺寸
  const themeSize = ref<ThemeSize>(
    (localStorage.getItem(THEME_SIZE_KEY) as ThemeSize) || 'default'
  )

  // 浅色模式自定义颜色配置
  const customLightColors = ref<ThemeColors>(
    JSON.parse(localStorage.getItem(CUSTOM_LIGHT_COLORS_KEY) || 'null') || defaultLightColors
  )

  // 深色模式自定义颜色配置
  const customDarkColors = ref<ThemeColors>(
    JSON.parse(localStorage.getItem(CUSTOM_DARK_COLORS_KEY) || 'null') || defaultDarkColors
  )

  // 当前是否为深色模式（实际生效）
  const isDark = computed(() => {
    return themeMode.value === 'dark' || (themeMode.value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  })

  // 当前使用的颜色
  const currentColors = computed(() => {
    return isDark.value ? customDarkColors.value : customLightColors.value
  })

  // 兼容旧属性名
  const customColors = computed(() => currentColors.value)

  // 设置主题模式
  const setThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode
    localStorage.setItem(THEME_KEY, mode)
    applyTheme()
  }

  // 更新自定义颜色
  const updateColors = (colors: Partial<ThemeColors>) => {
    if (isDark.value) {
      const newColors = { ...customDarkColors.value, ...colors }
      if (JSON.stringify(newColors) !== JSON.stringify(customDarkColors.value)) {
        customDarkColors.value = newColors
        localStorage.setItem(CUSTOM_DARK_COLORS_KEY, JSON.stringify(customDarkColors.value))
        applyTheme()
      }
    } else {
      const newColors = { ...customLightColors.value, ...colors }
      if (JSON.stringify(newColors) !== JSON.stringify(customLightColors.value)) {
        customLightColors.value = newColors
        localStorage.setItem(CUSTOM_LIGHT_COLORS_KEY, JSON.stringify(customLightColors.value))
        applyTheme()
      }
    }
  }

  // 应用预设主题（同时更新浅色和深色配色）
  const applyPresetTheme = (lightColors: ThemeColors, darkColors?: ThemeColors) => {
    customLightColors.value = { ...lightColors }
    localStorage.setItem(CUSTOM_LIGHT_COLORS_KEY, JSON.stringify(customLightColors.value))
    if (darkColors) {
      customDarkColors.value = { ...darkColors }
      localStorage.setItem(CUSTOM_DARK_COLORS_KEY, JSON.stringify(customDarkColors.value))
    }
    applyTheme()
  }

  // 重置为默认颜色
  const resetColors = () => {
    if (isDark.value) {
      customDarkColors.value = { ...defaultDarkColors }
      localStorage.setItem(CUSTOM_DARK_COLORS_KEY, JSON.stringify(customDarkColors.value))
    } else {
      customLightColors.value = { ...defaultLightColors }
      localStorage.setItem(CUSTOM_LIGHT_COLORS_KEY, JSON.stringify(customLightColors.value))
    }
    applyTheme()
  }

  // 设置主题尺寸
  const setThemeSize = (size: ThemeSize) => {
    themeSize.value = size
    localStorage.setItem(THEME_SIZE_KEY, size)
    applyThemeSize(size)
  }

  // 应用主题尺寸到DOM
  const applyThemeSize = (size: ThemeSize) => {
    const root = document.documentElement
    switch (size) {
      case 'small':
        root.style.setProperty('--theme-font-size-base', '13px')
        root.style.setProperty('--theme-border-radius', '4px')
        root.style.setProperty('--theme-spacing-base', '8px')
        // 布局尺寸
        root.style.setProperty('--theme-header-height', '48px')
        root.style.setProperty('--theme-footer-height', '32px')
        root.style.setProperty('--theme-sidebar-width', '210px')
        root.style.setProperty('--theme-sidebar-collapsed-width', '56px')
        root.style.setProperty('--theme-sidebar-logo-height', '48px')
        root.style.setProperty('--theme-sidebar-logo-icon-size', '32px')
        root.style.setProperty('--theme-sidebar-menu-item-height', '40px')
        root.style.setProperty('--theme-sidebar-menu-padding', '8px')
        root.style.setProperty('--theme-sidebar-menu-gap', '4px')
        root.style.setProperty('--theme-sidebar-menu-item-px', '8px')
        root.style.setProperty('--theme-sidebar-toggle-height', '32px')
        root.style.setProperty('--theme-subheader-height', '48px')
        root.style.setProperty('--theme-submenu-item-width', '100px')
        root.style.setProperty('--theme-submenu-item-padding-x', '12px')
        root.style.setProperty('--theme-submenu-item-padding-y', '4px')
        root.style.setProperty('--theme-content-padding', '12px')
        root.style.setProperty('--theme-panel-padding-x', '16px')
        root.style.setProperty('--theme-panel-icon-size', '32px')
        break
      case 'default':
        root.style.setProperty('--theme-font-size-base', '14px')
        root.style.setProperty('--theme-border-radius', '6px')
        root.style.setProperty('--theme-spacing-base', '12px')
        // 布局尺寸
        root.style.setProperty('--theme-header-height', '60px')
        root.style.setProperty('--theme-footer-height', '40px')
        root.style.setProperty('--theme-sidebar-width', '240px')
        root.style.setProperty('--theme-sidebar-collapsed-width', '64px')
        root.style.setProperty('--theme-sidebar-logo-height', '60px')
        root.style.setProperty('--theme-sidebar-logo-icon-size', '40px')
        root.style.setProperty('--theme-sidebar-menu-item-height', '48px')
        root.style.setProperty('--theme-sidebar-menu-padding', '12px')
        root.style.setProperty('--theme-sidebar-menu-gap', '8px')
        root.style.setProperty('--theme-sidebar-menu-item-px', '12px')
        root.style.setProperty('--theme-sidebar-toggle-height', '40px')
        root.style.setProperty('--theme-subheader-height', '60px')
        root.style.setProperty('--theme-submenu-item-width', '120px')
        root.style.setProperty('--theme-submenu-item-padding-x', '16px')
        root.style.setProperty('--theme-submenu-item-padding-y', '8px')
        root.style.setProperty('--theme-content-padding', '20px')
        root.style.setProperty('--theme-panel-padding-x', '24px')
        root.style.setProperty('--theme-panel-icon-size', '36px')
        break
      case 'large':
        root.style.setProperty('--theme-font-size-base', '16px')
        root.style.setProperty('--theme-border-radius', '8px')
        root.style.setProperty('--theme-spacing-base', '16px')
        // 布局尺寸
        root.style.setProperty('--theme-header-height', '72px')
        root.style.setProperty('--theme-footer-height', '48px')
        root.style.setProperty('--theme-sidebar-width', '270px')
        root.style.setProperty('--theme-sidebar-collapsed-width', '72px')
        root.style.setProperty('--theme-sidebar-logo-height', '72px')
        root.style.setProperty('--theme-sidebar-logo-icon-size', '48px')
        root.style.setProperty('--theme-sidebar-menu-item-height', '56px')
        root.style.setProperty('--theme-sidebar-menu-padding', '16px')
        root.style.setProperty('--theme-sidebar-menu-gap', '12px')
        root.style.setProperty('--theme-sidebar-menu-item-px', '16px')
        root.style.setProperty('--theme-sidebar-toggle-height', '48px')
        root.style.setProperty('--theme-subheader-height', '72px')
        root.style.setProperty('--theme-submenu-item-width', '140px')
        root.style.setProperty('--theme-submenu-item-padding-x', '20px')
        root.style.setProperty('--theme-submenu-item-padding-y', '12px')
        root.style.setProperty('--theme-content-padding', '28px')
        root.style.setProperty('--theme-panel-padding-x', '32px')
        root.style.setProperty('--theme-panel-icon-size', '40px')
        break
    }
  }

  // 应用主题到DOM
  const applyTheme = () => {
    const root = document.documentElement
    const colors = currentColors.value

    // 设置CSS变量
    root.style.setProperty('--theme-primary', colors.primary)
    root.style.setProperty('--theme-primary-light', colors.primaryLight)
    root.style.setProperty('--theme-primary-dark', colors.primaryDark)

    root.style.setProperty('--theme-sidebar-bg', colors.sidebarBg)
    root.style.setProperty('--theme-sidebar-logo-bg', colors.sidebarLogoBg)
    root.style.setProperty('--theme-sidebar-logo-text', colors.sidebarLogoText)
    root.style.setProperty('--theme-sidebar-menu-hover', colors.sidebarMenuHover)
    root.style.setProperty('--theme-sidebar-menu-active', colors.sidebarMenuActive)
    root.style.setProperty('--theme-sidebar-menu-active-border', colors.sidebarMenuActiveBorder)
    root.style.setProperty('--theme-sidebar-menu-text', colors.sidebarMenuText)
    root.style.setProperty('--theme-sidebar-menu-active-text', colors.sidebarMenuActiveText)
    root.style.setProperty('--theme-sidebar-footer-bg', colors.sidebarFooterBg)

    root.style.setProperty('--theme-submenu-bg', colors.submenuBg)
    root.style.setProperty('--theme-submenu-border', colors.submenuBorder)
    root.style.setProperty('--theme-submenu-item-hover', colors.submenuItemHover)
    root.style.setProperty('--theme-submenu-item-active', colors.submenuItemActive)
    root.style.setProperty('--theme-submenu-item-text', colors.submenuItemText)
    root.style.setProperty('--theme-submenu-item-active-text', colors.submenuItemActiveText)
    root.style.setProperty('--theme-submenu-item-shadow', colors.submenuItemShadow)
    root.style.setProperty('--theme-submenu-item-active-shadow', colors.submenuItemActiveShadow)
    root.style.setProperty('--theme-submenu-item-active-hover-shadow', colors.submenuItemActiveHoverShadow)

    root.style.setProperty('--theme-header-bg', colors.headerBg)
    root.style.setProperty('--theme-content-bg', colors.contentBg)
    root.style.setProperty('--theme-footer-bg', colors.footerBg)

    root.style.setProperty('--theme-border-color', colors.borderColor)
    root.style.setProperty('--theme-border-color-light', colors.borderColorLight)

    // 设置Element Plus主题
    setElementPlusTheme(colors)

    // 设置dark类名
    if (themeMode.value === 'dark' || (themeMode.value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }

  // 设置Element Plus主题
  const setElementPlusTheme = (colors: ThemeColors) => {
    let style = document.getElementById('element-plus-theme-style')
    if (!style) {
      style = document.createElement('style')
      style.id = 'element-plus-theme-style'
      document.head.appendChild(style)
    }

    if (isDark.value) {
      style.textContent = `
        html.dark {
          --el-color-primary: ${colors.primary};
          --el-color-primary-light-3: ${colors.primaryLight};
          --el-color-primary-light-5: ${colors.primaryLight};
          --el-color-primary-light-7: ${colors.primaryLight};
          --el-color-primary-light-8: ${colors.primaryLight};
          --el-color-primary-light-9: ${colors.primaryLight};
          --el-color-primary-dark-2: ${colors.primaryDark};
          --el-border-color: ${colors.borderColor};
          --el-border-color-light: ${colors.borderColorLight};
          --el-bg-color: ${colors.headerBg};
          --el-bg-color-page: ${colors.contentBg};
          --el-bg-color-overlay: ${colors.headerBg};
          --el-text-color-primary: ${colors.sidebarMenuText};
          --el-text-color-regular: ${colors.sidebarMenuText};
          --el-fill-color-blank: ${colors.headerBg};
          --el-fill-color-light: ${colors.borderColorLight};
        }
      `
    } else {
      style.textContent = `
        :root {
          --el-color-primary: ${colors.primary};
          --el-color-primary-light-3: ${colors.primaryLight};
          --el-color-primary-light-5: ${colors.primaryLight};
          --el-color-primary-light-7: ${colors.primaryLight};
          --el-color-primary-light-8: ${colors.primaryLight};
          --el-color-primary-light-9: ${colors.primaryLight};
          --el-color-primary-dark-2: ${colors.primaryDark};
          --el-border-color: ${colors.borderColor};
          --el-border-color-light: ${colors.borderColorLight};
          --el-bg-color: ${colors.headerBg};
          --el-bg-color-page: ${colors.contentBg};
        }
      `
    }
  }

  // 初始化主题
  const initTheme = () => {
    // 应用保存的主题尺寸
    applyThemeSize(themeSize.value)
    applyTheme()

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (themeMode.value === 'auto') {
        applyTheme()
      }
    })
  }

  // 切换主题
  const toggleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'auto']
    const currentIndex = modes.indexOf(themeMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    setThemeMode(modes[nextIndex]!)
  }

  return {
    themeMode,
    themeSize,
    customColors,
    customLightColors,
    customDarkColors,
    currentColors,
    isDark,
    setThemeMode,
    setThemeSize,
    updateColors,
    applyPresetTheme,
    resetColors,
    initTheme,
    toggleTheme
  }
})