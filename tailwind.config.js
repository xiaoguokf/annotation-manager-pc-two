/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          primary: 'var(--theme-primary)',
          'primary-light': 'var(--theme-primary-light)',
          'primary-dark': 'var(--theme-primary-dark)',
          'sidebar-bg': 'var(--theme-sidebar-bg)',
          'sidebar-logo-bg': 'var(--theme-sidebar-logo-bg)',
          'sidebar-logo-text': 'var(--theme-sidebar-logo-text)',
          'sidebar-menu-hover': 'var(--theme-sidebar-menu-hover)',
          'sidebar-menu-active': 'var(--theme-sidebar-menu-active)',
          'sidebar-menu-text': 'var(--theme-sidebar-menu-text)',
          'sidebar-menu-active-text': 'var(--theme-sidebar-menu-active-text)',
          'sidebar-footer-bg': 'var(--theme-sidebar-footer-bg)',
          'submenu-bg': 'var(--theme-submenu-bg)',
          'submenu-border': 'var(--theme-submenu-border)',
          'submenu-item-hover': 'var(--theme-submenu-item-hover)',
          'submenu-item-active': 'var(--theme-submenu-item-active)',
          'submenu-item-text': 'var(--theme-submenu-item-text)',
          'submenu-item-active-text': 'var(--theme-submenu-item-active-text)',
          'header-bg': 'var(--theme-header-bg)',
          'content-bg': 'var(--theme-content-bg)',
          'footer-bg': 'var(--theme-footer-bg)',
          'border-color': 'var(--theme-border-color)',
          'border-color-light': 'var(--theme-border-color-light)',
        }
      },
      backgroundImage: {
        'theme-sidebar-logo': 'var(--theme-sidebar-logo-bg)',
        'theme-submenu-item-active': 'var(--theme-submenu-item-active)',
      }
    },
  },
  plugins: [],
}
