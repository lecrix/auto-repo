import { getCommitDetail, deleteCommit } from '../../services/api'
import { formatTime } from '../../utils/util'

Page({
  data: {
    commit: null as any
  },

  async onLoad(options: any) {
    if (options.commitId) {
        const commit: any = await getCommitDetail(options.commitId)
        if (commit) {
            commit.date = formatTime(new Date(commit.timestamp))
            this.setData({ commit })
        }
    }
  },

  onEdit() {
    const { commit } = this.data
    if (!commit) return
    
    wx.navigateTo({
      url: `/pages/commit-create/index?mode=edit&id=${commit._id}`
    })
  },

  onDelete() {
    const { commit } = this.data
    if (!commit) return

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定删除此记录？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' })
            await deleteCommit(commit._id)
            wx.hideLoading()
            wx.showToast({ title: '删除成功', icon: 'success' })
            
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: '删除失败', icon: 'none' })
            console.error(err)
          }
        }
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
