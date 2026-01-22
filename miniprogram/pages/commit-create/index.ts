import { createCommit } from '../../services/api'

Page({
  data: {
    repoId: '',
    title: '',
    message: '',
    mileage: '',
    cost_parts: '',
    cost_labor: '',
    type: 'maintenance',
    typeKeys: ['maintenance', 'repair', 'modification'],
    typeLabels: ['常规保养', '故障维修', '改装升级'],
    typeIndex: 0
  },

  onLoad(options: any) {
    this.data.repoId = options.repoId
  },

  onInput(e: any) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value
    })
  },

  onTypeChange(e: any) {
    this.setData({
      typeIndex: e.detail.value,
      type: this.data.typeKeys[e.detail.value]
    })
  },

  async onSubmit() {
    const { repoId, title, message, mileage, cost_parts, cost_labor, type } = this.data
    
    if (!title || !mileage) {
        wx.showToast({ title: '请填写标题和里程', icon: 'none' })
        return
    }

    wx.showLoading({ title: '提交 Commit...' })
    
    await createCommit({
        repo_id: repoId,
        title,
        message,
        mileage: Number(mileage),
        type,
        cost: {
            parts: Number(cost_parts) || 0,
            labor: Number(cost_labor) || 0,
            currency: 'CNY'
        }
    })

    wx.hideLoading()
    wx.showToast({ title: '提交成功', icon: 'success' })

    setTimeout(() => {
        wx.navigateBack()
    }, 1500)
  },

  onCancel() {
    wx.navigateBack()
  }
})
