import { getCommitDetail } from '../../services/api'
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

  goBack() {
    wx.navigateBack()
  }
})
