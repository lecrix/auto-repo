Page({
  data: {
    themeClass: ''
  },

  onShow() {
    const app = getApp<IAppOption>()
    this.setData({
      themeClass: app.globalData.themeClass || ''
    })
  },

  onLoad() {
  },

  goBack() {
    wx.navigateBack()
  }
})
