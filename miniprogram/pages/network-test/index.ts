import { config as envConfig } from '../../config'

Page({
  data: {
    baseURL: envConfig.baseURL,
    environment: envConfig.description,
    testing: false,
    result: null as any
  },

  testConnection() {
    this.setData({ testing: true, result: null })

    const testURL = envConfig.baseURL.replace('/api', '')
    
    wx.request({
      url: testURL,
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200) {
          this.setData({
            testing: false,
            result: {
              success: true,
              message: '连接成功！✅',
              details: JSON.stringify(res.data, null, 2)
            }
          })
        } else {
          this.setData({
            testing: false,
            result: {
              success: false,
              message: `连接失败 (状态码: ${res.statusCode})`,
              details: JSON.stringify(res, null, 2)
            }
          })
        }
      },
      fail: (err) => {
        this.setData({
          testing: false,
          result: {
            success: false,
            message: '网络请求失败 ❌',
            details: `错误信息: ${err.errMsg}\n错误码: ${err.errno || 'N/A'}`
          }
        })
      }
    })
  }
})
