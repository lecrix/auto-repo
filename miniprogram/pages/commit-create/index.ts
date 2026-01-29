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
    images: [] as string[],
    
    insurance_company: '',
    compulsory_insurance: '',
    commercial_insurance: '',

    type: 'maintenance',
    typeKeys: ['maintenance', 'repair', 'modification', 'fuel', 'parking', 'inspection', 'other', 'insurance', 'purchase'],
    typeLabels: ['常规保养', '故障维修', '改装升级', '加油费用', '停车费用', '年检费用', '其他费用', '车辆保险', '购车费用'],
    typeIndex: 0,
    templates: MAINTENANCE_TEMPLATES,
    selectedTemplateId: '',
    selectedDate: formatDate(now),
    isEditMode: false,
    editCommitId: ''
  },

  async onLoad(options: any) {
    const app = getApp<IAppOption>()
    this.setData({ themeClass: app.globalData.themeClass || '' })

    this.setData({ repoId: options.repoId })
    
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
        const compulsoryMatch = message.match(/交强险: ¥(.+)/)
        const commercialMatch = message.match(/商业险: ¥(.+)/)

        if (companyMatch) insuranceData['insurance_company'] = companyMatch[1]
        if (compulsoryMatch) insuranceData['compulsory_insurance'] = compulsoryMatch[1]
        if (commercialMatch) insuranceData['commercial_insurance'] = commercialMatch[1]

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
        images: commit.images || [],
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
    const value = e.detail.value
    this.setData({
      [field]: value
    })

    // Auto-calculate total for insurance
    if (this.data.type === 'insurance' && (field === 'compulsory_insurance' || field === 'commercial_insurance')) {
      const compulsory = Number(field === 'compulsory_insurance' ? value : this.data.compulsory_insurance) || 0
      const commercial = Number(field === 'commercial_insurance' ? value : this.data.commercial_insurance) || 0
      this.setData({
        cost_total: String(compulsory + commercial)
      })
    }
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
    const { repoId, title, message, mileage, cost_total, type, selectedDate, images,
            insurance_company, commercial_insurance, compulsory_insurance,
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
          finalMessage += `\n\n【保险信息】\n公司: ${insurance_company}\n交强险: ¥${compulsory_insurance}\n商业险: ¥${commercial_insurance}`
      }

      const commitData: any = {
          repo_id: repoId,
          title,
          message: finalMessage,
          mileage: mileage ? Number(mileage) : undefined,
          type,
          timestamp,
          images,
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

  chooseImage() {
    wx.chooseMedia({
      count: 9 - this.data.images.length,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePaths = res.tempFiles.map(file => file.tempFilePath)
        this.uploadImages(filePaths)
      }
    })
  },

  async uploadImages(filePaths: string[]) {
    wx.showLoading({ title: '上传图片...' })
    
    try {
      const uploadedUrls: string[] = []
      
      for (const filePath of filePaths) {
        const result = await wx.cloud.uploadFile({
          cloudPath: `commits/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
          filePath
        })
        uploadedUrls.push(result.fileID)
      }
      
      this.setData({
        images: [...this.data.images, ...uploadedUrls]
      })
      
      wx.showToast({ title: '上传成功', icon: 'success' })
    } catch (err) {
      console.error('Image upload failed:', err)
      wx.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  deleteImage(e: any) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images.filter((_, i) => i !== index)
    this.setData({ images })
  },

  previewImage(e: any) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: this.data.images,
      current: url
    })
  },

  onCancel() {
    wx.navigateBack()
  }
})
