import { createCommit, getCommitDetail, updateCommit } from '../../services/api'
import { MAINTENANCE_TEMPLATES } from '../../data/templates'

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}



const now = new Date()

Page({
  data: {
    repoId: '',
    title: '',
    message: '',
    mileage: '',
    cost_total: '',
    
    // Insurance specific fields
    insurance_company: '',
    commercial_insurance: '',
    compulsory_insurance: '',
    insurance_total: '',

    type: 'maintenance',
    typeKeys: ['maintenance', 'repair', 'modification', 'fuel', 'parking', 'inspection', 'other', 'insurance'],
    typeLabels: ['常规保养', '故障维修', '改装升级', '加油费用', '停车费用', '年检费用', '其他费用', '车辆保险'],
    typeIndex: 0,
    templates: MAINTENANCE_TEMPLATES,
    selectedTemplateId: '',
    selectedDate: formatDate(now),
    isEditMode: false,
    editCommitId: ''
  },

  async onLoad(options: any) {
    this.data.repoId = options.repoId
    
    if (options.mode === 'edit' && options.id) {
      this.setData({
        isEditMode: true,
        editCommitId: options.id
      })
      wx.setNavigationBarTitle({ title: '编辑记录' })
      await this.loadCommitDetail(options.id)
    } else {
      wx.setNavigationBarTitle({ title: '新建记录' })
    }
  },

  async loadCommitDetail(id: string) {
    wx.showLoading({ title: '加载中...' })
    try {
      const commit = await getCommitDetail(id)
      const typeIndex = this.data.typeKeys.indexOf(commit.type)
      
      let message = commit.message
      let insuranceData: any = {}

      if (commit.type === 'insurance') {
        // Parse insurance info
        const companyMatch = message.match(/公司: (.+)/)
        const commercialMatch = message.match(/商业险: ¥(.+)/)
        const compulsoryMatch = message.match(/交强险: ¥(.+)/)
        const totalMatch = message.match(/总费用: ¥(.+)/)

        if (companyMatch) insuranceData['insurance_company'] = companyMatch[1]
        if (commercialMatch) insuranceData['commercial_insurance'] = commercialMatch[1]
        if (compulsoryMatch) insuranceData['compulsory_insurance'] = compulsoryMatch[1]
        if (totalMatch) insuranceData['insurance_total'] = totalMatch[1]

        // Strip insurance info from message for display
        const splitMsg = message.split('\n\n【保险信息】')
        if (splitMsg.length > 0) {
            message = splitMsg[0]
        }
      }

      this.setData({
        title: commit.title,
        message: message,
        mileage: commit.mileage ? String(commit.mileage) : '',
        cost_total: commit.cost && commit.cost.parts ? String(commit.cost.parts) : '',
        type: commit.type,
        typeIndex: typeIndex >= 0 ? typeIndex : 0,
        selectedDate: formatDate(new Date(commit.timestamp)),
        ...insuranceData
      })
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  onInput(e: any) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value
    })
  },

  bindDateChange(e: any) {
    const field = e.currentTarget.dataset.field || 'selectedDate'
    this.setData({
      [field]: e.detail.value
    })
  },

  selectTemplate(e: any) {
    const template = e.currentTarget.dataset.template
    const typeIndex = this.data.typeKeys.indexOf(template.type)
    
    this.setData({
      title: template.title,
      message: template.description || '',
      type: template.type,
      typeIndex: typeIndex >= 0 ? typeIndex : 0,
      cost_total: String(template.suggestedCost),
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
    const { repoId, title, message, mileage, cost_total, type, selectedDate,
            insurance_company, commercial_insurance, compulsory_insurance, insurance_total,
            isEditMode, editCommitId } = this.data
    
    if (!title) {
        wx.showToast({ title: '请填写标题', icon: 'none' })
        return
    }

    wx.showLoading({ title: isEditMode ? '更新中...' : '提交 Commit...' })
    
    try {
      const timestamp = new Date((selectedDate + ' 00:00:00').replace(/-/g, '/')).getTime()

      let finalMessage = message
      if (type === 'insurance') {
          finalMessage += `\n\n【保险信息】\n公司: ${insurance_company}\n商业险: ¥${commercial_insurance}\n交强险: ¥${compulsory_insurance}\n总费用: ¥${insurance_total}`
      }

      const commitData = {
          repo_id: repoId,
          title,
          message: finalMessage,
          mileage: mileage ? Number(mileage) : undefined,
          type,
          timestamp,
          cost: {
              parts: Number(cost_total) || 0,
              labor: 0,
              currency: 'CNY'
          }
      }

      if (isEditMode) {
        await updateCommit(editCommitId, commitData)
        wx.showToast({ title: '更新成功', icon: 'success' })
      } else {
        await createCommit(commitData)
        wx.showToast({ title: '提交成功', icon: 'success' })
      }

      setTimeout(() => {
          wx.navigateBack()
      }, 1500)
    } catch (err: any) {
      console.error('Failed to save commit:', err)
      wx.showToast({
        title: err.message || (isEditMode ? '更新失败' : '创建失败'),
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
