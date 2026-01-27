import { createCommit } from '../../services/api'
import { MAINTENANCE_TEMPLATES } from '../../data/templates'

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
    typeIndex: 0,
    templates: MAINTENANCE_TEMPLATES,
    selectedTemplateId: ''
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

  selectTemplate(e: any) {
    const template = e.currentTarget.dataset.template
    const typeIndex = this.data.typeKeys.indexOf(template.type)
    
    this.setData({
      title: template.title,
      type: template.type,
      typeIndex: typeIndex >= 0 ? typeIndex : 0,
      cost_parts: String(template.suggestedCost.parts),
      cost_labor: String(template.suggestedCost.labor),
      selectedTemplateId: template.id
    })

    wx.showToast({ title: '已应用模板', icon: 'success' })
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
    
    try {
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

      wx.showToast({ title: '提交成功', icon: 'success' })

      setTimeout(() => {
          wx.navigateBack()
      }, 1500)
    } catch (err: any) {
      console.error('Failed to create commit:', err)
      wx.showToast({
        title: err.message || '创建失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      wx.hideLoading()
    }
  },

  onCancel() {
    wx.navigateBack()
  }
})
