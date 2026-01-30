import { getRepos, deleteRepo } from '../../services/api'

Page({
  data: {
    repos: [] as any[],
    loading: true,
    startX: 0,
    startY: 0,
    lastThrottleTime: 0,
    // Nav Bar Data
    navHeight: 60,
    menuTop: 24,
    menuHeight: 32
  },

  async onShow() {
    const app = getApp<IAppOption>()
    this.setData({ themeClass: app.globalData.themeClass || '' })
    
    if (this.data.repos.length === 0) {
      this.setData({ loading: true })
    }
    this.initNavBar()
    await this.loadRepos()
  },

  async onPullDownRefresh() {
    await this.loadRepos()
    wx.stopPullDownRefresh()
    wx.vibrateShort({ type: 'light' })
  },

  initNavBar() {

    const menu = wx.getMenuButtonBoundingClientRect()
    const system = wx.getSystemInfoSync()
    const navHeight = menu.bottom + 8 // Slightly more padding
    this.setData({
      navHeight,
      menuTop: menu.top,
      menuHeight: menu.height
    })
  },

  async loadRepos() {
    try {
      const repos: any[] = await getRepos()
      const existingRepos = this.data.repos
      repos.forEach((r: any) => {
        const existing = existingRepos.find((e: any) => e._id === r._id)
        r.offsetX = existing?.offsetX || 0
      })
      this.setData({ repos })
    } catch (err: any) {
      console.error('Failed to load repos:', err)
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2500
      })
      if (this.data.repos.length === 0) {
        this.setData({ repos: [] })
      }
    } finally {
      this.setData({ loading: false })
    }
  },

  onImageError(e: any) {
    const index = e.currentTarget.dataset.index
    this.setData({ [`repos[${index}].image`]: '' })
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/repo-create/index' })
  },

  goToDetail(e: any) {
    // Prevent navigation if swiping
    const index = e.currentTarget.dataset.index
    const repo = this.data.repos[index]
    if (repo.offsetX < -20) return // If menu is open, don't navigate

    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/repo-detail/index?id=${id}`
    })
  },

  editRepo(e: any) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/repo-create/index?repoId=${id}`
    })
  },

  async deleteRepo(e: any) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，且会连同相关记录一起删除。',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: 'Deleting...' })
          try {
            await deleteRepo(id)
            const newRepos = this.data.repos.filter((_, i) => i !== index)
            this.setData({ repos: newRepos })
            wx.showToast({ title: '已删除', icon: 'success' })
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' })
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  // Swipe Logic
  touchStart(e: any) {
    if (e.touches.length === 1) {
      this.setData({
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY
      })
    }
  },

  touchMove(e: any) {
    if (e.touches.length === 1) {
      const now = Date.now()
      if (now - this.data.lastThrottleTime < 16) return
      
      const index = e.currentTarget.dataset.index
      const moveX = e.touches[0].clientX
      const disX = this.data.startX - moveX

      const moveY = e.touches[0].clientY
      const disY = Math.abs(this.data.startY - moveY)
      if (disY > 20) return

      let offsetX = 0
      if (disX > 0) {
        offsetX = -Math.min(disX, 140)
      } else {
        offsetX = 0
      }

      const currentOffsetX = this.data.repos[index]?.offsetX || 0
      if (currentOffsetX === offsetX) return

      this.setData({ 
        [`repos[${index}].offsetX`]: offsetX,
        lastThrottleTime: now
      })
    }
  },

   touchEnd(e: any) {
     if (e.changedTouches.length === 1) {
       const index = e.currentTarget.dataset.index
       const endX = e.changedTouches[0].clientX
       const disX = this.data.startX - endX
 
       let offsetX = 0
       // Threshold to snap open
       if (disX > 35) {
         offsetX = -140
       } else {
         offsetX = 0
       }
 
       const key = `repos[${index}].offsetX`
       this.setData({ [key]: offsetX })
     }
   },

    onShowHelp() {
      wx.navigateTo({ url: '/pages/help/index' })
    },

    goToSettings() {
      wx.navigateTo({ url: '/pages/settings/index' })
    }
})
