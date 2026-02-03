import { deleteIssue, updateIssue } from '../../services/api'

Page({
  data: {
    issue: null as any,
    issueId: '',
    repoId: '',
    priorityMap: {
      high: '紧急',
      medium: '普通',
      low: '低优先级'
    } as Record<string, string>,
    themeClass: ''
  },

  onLoad(options: any) {
    const issueData = options.issue ? JSON.parse(decodeURIComponent(options.issue)) : null
    this.setData({
      issue: issueData,
      issueId: options.issueId || (issueData ? issueData._id : ''),
      repoId: options.repoId || ''
    })
  },

  onShow() {
    const app = getApp<IAppOption>()
    this.setData({ themeClass: app.globalData.themeClass || '' })
  },

  onLater() {
    wx.navigateBack()
  },

  async onComplete() {
    const { issue, issueId } = this.data
    if (!issue || !issueId) return

    wx.showModal({
      title: '确认完成',
      content: `确定已完成「${issue.title}」？`,
      confirmText: '完成',
      confirmColor: '#2ecc71',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          try {
            await updateIssue(issueId, {
              status: 'closed',
              closed_at: Date.now()
            })
            wx.hideLoading()
            wx.showToast({ title: '已标记完成', icon: 'success' })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } catch (err) {
            wx.hideLoading()
            console.error('Complete issue failed:', err)
            wx.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  async onReopen() {
    const { issue, issueId } = this.data
    if (!issue || !issueId) return

    wx.showLoading({ title: '处理中...' })
    try {
      await updateIssue(issueId, {
        status: 'open',
        closed_at: null
      })
      wx.hideLoading()
      this.setData({
        issue: { ...issue, status: 'open', closed_at: null }
      })
      wx.showToast({ title: '已重新打开', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      console.error('Reopen issue failed:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  async onDelete() {
    const { issue, issueId } = this.data
    if (!issue || !issueId) return

    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${issue.title}」？`,
      confirmText: '删除',
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          try {
            await deleteIssue(issueId)
            wx.hideLoading()
            wx.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } catch (err) {
            wx.hideLoading()
            console.error('Delete issue failed:', err)
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }
})
