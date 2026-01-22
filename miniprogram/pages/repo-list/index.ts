import {getRepos} from '../../services/api'

Page({
  data: {
    repos: [] as any[],
    loading: true
  },

  async onShow() {
    this.setData({ loading: true })
    const repos = await getRepos()
    this.setData({
      repos: repos as any[],
      loading: false
    })
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/repo-create/index' })
  },

  goToDetail(e: any) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/repo-detail/index?id=${id}`
    })
  }
})
