import type { SystemThemeState, ThemeMode } from '@/composables/types/theme'
import { defineStore } from 'pinia'
import { themeColorOptions } from '@/composables/types/theme'
import { getSystemTheme } from '@/utils/systemTheme'

/**
 * 简化版系统主题状态管理
 * 仅支持跟随系统主题，不提供手动切换功能
 * 导航栏颜色通过 theme.json 自动处理
 */
export const useThemeStore = defineStore('theme', {
  state: (): SystemThemeState => ({
    theme: 'light',
    themeVars: {
      ...themeColorOptions[0].primaryShades,
    },
  }),

  getters: {
    isDark: state => state.theme === 'dark',
  },

  actions: {
    /**
     * 获取系统主题
     * @returns 系统主题模式
     */
    getSystemTheme(): ThemeMode {
      return getSystemTheme()
    },

    /**
     * 设置主题（仅内部使用）
     * @param theme 主题模式
     */
    setTheme(theme: ThemeMode) {
      this.theme = theme
    },

    /**
     * 初始化系统主题
     */
    initSystemTheme() {
      const systemTheme = this.getSystemTheme()
      this.theme = systemTheme
      this.themeVars = {
        ...themeColorOptions[0].primaryShades,
      }
      console.log('初始化系统主题:', this.theme)
    },
  },
})
