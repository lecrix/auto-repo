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
        env: 'cloud1-5g2vgpovd2d7461b',
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
  },

  initTheme() {
    const theme = wx.getStorageSync('autorepo_theme') || 'auto'
    this.updateTheme(theme)
  },

  updateTheme(theme: 'auto' | 'light' | 'dark') {
    this.globalData.theme = theme
    
    const isDark = theme === 'dark' || (theme === 'auto' && wx.getSystemInfoSync().theme === 'dark')
    const themeClass = isDark ? 'theme-dark' : ''
    this.globalData.themeClass = themeClass

    const pages = getCurrentPages()
    pages.forEach(page => {
      page.setData({ themeClass })
      
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff',
        animation: { duration: 200, timingFunc: 'easeIn' }
      })
    })
  }
})