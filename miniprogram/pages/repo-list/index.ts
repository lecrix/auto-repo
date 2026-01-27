import { getRepos, deleteRepo } from '../../services/api'

Page({
  data: {
    repos: [] as any[],
    loading: true,
    startX: 0,
    startY: 0,
    // Nav Bar Data
    navHeight: 60,
    menuTop: 24,
    menuHeight: 32
  },

  async onShow() {
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
      const repos = await getRepos()
      // Calculate vehicle age and initialize offsetX for each repo
      const formattedRepos = (repos as any[]).map(r => {
        let vehicle_age = ''
        if (r.register_date) {
          const now = new Date()
          const regDate = new Date(r.register_date)
          let years = now.getFullYear() - regDate.getFullYear()
          let months = now.getMonth() - regDate.getMonth()
          if (months < 0) {
            years--
            months += 12
          }
          if (years > 0) {
            vehicle_age = months > 0 ? `${years}年${months}个月` : `${years}年`
          } else if (months > 0) {
            vehicle_age = `${months}个月`
          }
        }
        return {
          ...r,
          vehicle_age,
          offsetX: 0
        }
      })
      this.setData({
        repos: formattedRepos,
        loading: false
      })
    } catch (e) {
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
            const repos = this.data.repos
            repos.splice(index, 1)
            this.setData({ repos })
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
      const index = e.currentTarget.dataset.index
      const moveX = e.touches[0].clientX
      const disX = this.data.startX - moveX

      // Basic vertical scroll check
      const moveY = e.touches[0].clientY
      const disY = Math.abs(this.data.startY - moveY)
      if (disY > 20) return // Vertical scroll, ignore horizontal

      let offsetX = 0
      if (disX > 0) { // Sliding Left
        offsetX = -Math.min(disX, 140) // Max width of buttons (70*2)
      } else {
        offsetX = 0
      }

      const key = `repos[${index}].offsetX`
      this.setData({ [key]: offsetX })
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
     const helpContent = `1. 创建车辆
点击"+"按钮，输入车型、年份等信息，建立你的第一个爱车档案。

2. 记录维保
进入车辆详情页面，点击"新建Commit"按钮记录每次保养、维修、改装或零件更换。每条记录都会自动更新车辆的当前里程。

3. 使用模板
常见维保项目（如换机油、轮胎保养等）已有模板，选择模板可快速填写，大幅节省时间。

4. 查看历史
车辆详情页展示所有维保记录的时间线，一目了然查看爱车的成长历程。

5. 导出与分享
在车辆详情页点击"导出"按钮，生成数据报告便于备份或分享给朋友。

6. 数据管理
向左滑动车辆卡片，可快速编辑或删除车辆记录。所有数据都自动保存到云端。`

     wx.showModal({
       title: '📖 使用帮助',
       content: helpContent,
       showCancel: false,
       confirmText: '知道了',
       confirmColor: '#2c3e50',
       success: () => {}
     })
   }
})
