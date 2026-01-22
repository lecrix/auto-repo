import { createRepo } from '../../services/api'

Page({
  data: {
    name: '',
    vin: '',
    current_mileage: ''
  },

  onInput(e: any) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value
    })
  },

  async onSubmit() {
    const { name, vin, current_mileage } = this.data
    if (!name) {
        wx.showToast({ title: '请输入车辆名称', icon: 'none' })
        return
    }

    wx.showLoading({ title: '创建中...' })
    await createRepo({
        name,
        vin,
        current_mileage: Number(current_mileage) || 0,
        branch: 'main'
    })
    wx.hideLoading()
    wx.showToast({ title: '创建成功', icon: 'success' })
    
    setTimeout(() => {
        wx.navigateBack()
    }, 1500)
  },

  goBack() {
    wx.navigateBack()
  }
})
