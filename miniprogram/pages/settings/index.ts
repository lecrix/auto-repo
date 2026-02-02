import { clearAuth } from '../../services/auth'

const THEME_KEY = 'autorepo_theme'

Page({
  data: {
    currentTheme: 'auto' as 'auto' | 'light' | 'dark',
    themeClass: ''
  },

  onLoad() {
    this.initTheme()
  },

  onShow() {
    this.initTheme()
  },

  initTheme() {
    const savedTheme = wx.getStorageSync('autorepo_theme') || 'auto'
    const app = getApp<IAppOption>()
    
    this.setData({ 
      currentTheme: savedTheme,
      themeClass: app.globalData.themeClass || ''
    })
    
    if (app.updateTheme) {
      app.updateTheme(savedTheme)
    }
  },

  selectTheme(e: any) {
    const theme = e.currentTarget.dataset.theme as 'auto' | 'light' | 'dark'
    
    this.setData({ currentTheme: theme })
    wx.setStorageSync('autorepo_theme', theme)
    
    const app = getApp<IAppOption>()
    if (app.updateTheme) {
      app.updateTheme(theme)
      
      setTimeout(() => {
        this.setData({ themeClass: app.globalData.themeClass || '' })
      }, 100)
    }
    
    wx.showToast({
      title: '主题已更新',
      icon: 'success',
      duration: 1500
    })
  },

  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？退出后需要重新登录才能使用。',
      confirmText: '退出',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          clearAuth()
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          })
          
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/repo-list/index' })
          }, 1500)
        }
      }
    })
  }
})
