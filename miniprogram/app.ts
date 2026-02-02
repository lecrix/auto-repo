import { wxLogin, isAuthenticated } from './services/auth'
import { CLOUD_ENV_ID } from './config'

App<IAppOption>({
  globalData: {},
  async onLaunch() {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true,
      })
    }

    if (!isAuthenticated()) {
      try {
        await wxLogin()
      } catch (err) {
        console.error('Auto-login failed:', err)
      }
    }

    this.initTheme()
    this.watchSystemTheme()
  },

  onShow() {
    const currentTheme = this.globalData.theme
    if (currentTheme === 'auto') {
      this.updateTheme('auto')
    }
  },

  initTheme() {
    const theme = wx.getStorageSync('autorepo_theme') || 'auto'
    this.updateTheme(theme)
  },

  watchSystemTheme() {
    wx.onThemeChange((res: { theme: 'light' | 'dark' }) => {
      if (this.globalData.theme === 'auto') {
        this.updateTheme('auto')
      }
    })
  },

  updateTheme(theme: 'auto' | 'light' | 'dark') {
    this.globalData.theme = theme
    
    const systemTheme = wx.getSystemInfoSync().theme
    const isDark = theme === 'dark' || (theme === 'auto' && systemTheme === 'dark')
    const themeClass = isDark ? 'theme-dark' : ''
    this.globalData.themeClass = themeClass

    const pages = getCurrentPages()
    
    pages.forEach((page, index) => {
      try {
        page.setData({ themeClass })
      } catch (err) {
        console.error(`[Theme] Failed to update page ${index}:`, err)
      }
    })

    const navConfig = isDark 
      ? { frontColor: '#ffffff' as '#ffffff', backgroundColor: '#1e293b' }
      : { frontColor: '#000000' as '#000000', backgroundColor: '#ffffff' }

    wx.setNavigationBarColor({
      ...navConfig,
      animation: { duration: 200, timingFunc: 'easeIn' }
    })
  }
})