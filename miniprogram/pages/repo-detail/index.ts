import { getRepoDetail, getCommits } from '../../services/api'
import { formatTime } from '../../utils/util'

Page({
  data: {
    repo: null as any,
    commits: [] as any[],
    loading: true,
    repoId: '',
    currentTab: 0
  },

  async onLoad(options: any) {
    this.setData({ repoId: options.id })
  },

  async onShow() {
    this.setData({ loading: true })
    const [repo, commits] = await Promise.all([
      getRepoDetail(this.data.repoId),
      getCommits(this.data.repoId)
    ])

    // Format timestamps
    const formattedCommits = (commits as any[]).map(c => ({
      ...c,
      date: formatTime(new Date(c.timestamp))
    }))

    this.setData({
      repo,
      commits: formattedCommits,
      loading: false
    })
  },

  goToCommitCreate() {
    wx.navigateTo({
      url: `/pages/commit-create/index?repoId=${this.data.repoId}`
    })
  },

  goBack() {
    wx.navigateBack()
  },

  goToCommitDetail(e: any) {
    const commitId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/commit-detail/index?commitId=${commitId}`
    })
  },

  switchTab(e: any) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentTab: index })
  }
})
