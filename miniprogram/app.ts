import { wxLogin, isAuthenticated } from './services/auth'

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
        env: 'autorepo-backend-8faokd7f798030e', // 替换为您的真实云环境ID
        traceUser: true,
      })
    }

    if (!isAuthenticated()) {
      try {
        await wxLogin()
        console.log('Auto-login successful')
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
      console.log('[Theme] System theme changed to:', res.theme)
      if (this.globalData.theme === 'auto') {
        this.updateTheme('auto')
      }
    })
  },

  updateTheme(theme: 'auto' | 'light' | 'dark') {
    console.log('[Theme] updateTheme called:', theme)
    this.globalData.theme = theme
    
    const systemTheme = wx.getSystemInfoSync().theme
    const isDark = theme === 'dark' || (theme === 'auto' && systemTheme === 'dark')
    const themeClass = isDark ? 'theme-dark' : ''
    this.globalData.themeClass = themeClass

    console.log('[Theme] Calculated:', { theme, systemTheme, isDark, themeClass })

    const pages = getCurrentPages()
    console.log('[Theme] Page count:', pages.length)
    
    pages.forEach((page, index) => {
      try {
        console.log(`[Theme] Updating page ${index}:`, page.route)
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