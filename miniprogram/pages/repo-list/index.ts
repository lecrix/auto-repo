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
    
    this.setData({ loading: true })
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
      repos.forEach((r: any) => { r.offsetX = 0 })
      this.setData({ repos })
    } catch (err: any) {
      console.error('Failed to load repos:', err)
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2500
      })
      this.setData({ repos: [] })
    } finally {
      this.setData({ loading: false })
    }
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
      const helpContent = `📚 快速入门

🚗 车辆管理
• 点击「+」按钮创建车辆档案
• 填写车型、车牌、购车日期、购车费用等基础信息
• 「购车时里程」记录提车时的里程数（用于计算实际行驶里程）
• 向左滑动车辆卡片可以编辑或删除


📝 记录维保
• 进入车辆详情页，点击「新建Commit」
• 选择记录类型：
  - 常规保养（换机油、滤芯等）
  - 维修（故障修理）
  - 改装（加装配件）
  - 加油（油费记录）
  - 停车（停车费）
  - 购车费用（自动生成，也可手动添加）
• 填写日期、里程、费用、备注等信息
• 可使用快捷模板快速填写常见项目


📊 数据统计
车辆详情页的「数据统计」栏目包含：
• 总花费 = 购车费用 + 所有维保记录费用
• 每公里成本 = 总花费 ÷ 行驶里程
• 每公里油费 = 所有加油费用 ÷ 行驶里程
• 月度花费趋势图（可查看历史支出变化）


🕐 时间线
• 按时间倒序展示所有维保记录
• 每条记录显示：类型、日期、费用
• 点击记录查看详细信息
• 长按可编辑或删除记录


💾 导出功能
• 在车辆详情页点击「导出」按钮
• 生成Excel格式数据报告
• 可通过微信发送给好友或保存备份


💡 小贴士
• 购车费用会自动计入总花费统计
• 每次新建记录，当前里程会自动更新
• 行驶里程 = 当前里程 - 购车时里程`

      wx.showModal({
        title: '📖 使用帮助',
        content: helpContent,
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#2c3e50',
        success: () => {}
      })
    },

    goToSettings() {
      wx.navigateTo({ url: '/pages/settings/index' })
    }
})
