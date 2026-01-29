import { getCommitDetail, deleteCommit } from '../../services/api'
import { formatTime } from '../../utils/util'
import { formatLocalDateTime } from '../../utils/date'

Page({
  data: {
    commit: null as any,
    typeMap: {
      maintenance: '常规保养',
      repair: '维修',
      modification: '改装',
      fuel: '加油',
      parking: '停车',
      inspection: '年检',
      other: '其他',
      insurance: '保险',
      purchase: '购车费用'
    }
  },

  onShow() {
    const app = getApp<IAppOption>()
    this.setData({ themeClass: app.globalData.themeClass || '' })
  },

  async onLoad(options: any) {
    if (options.commitId) {
        const commit: any = await getCommitDetail(options.commitId)
        if (commit) {
            commit.date = formatLocalDateTime(commit.timestamp)
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
  },

  previewImage(e: any) {
    const index = e.currentTarget.dataset.index
    const { commit } = this.data
    if (!commit || !commit.images) return

    wx.previewImage({
      current: commit.images[index],
      urls: commit.images
    })
  }
})
