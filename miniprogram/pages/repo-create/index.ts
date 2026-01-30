import { createRepo, updateRepo, getRepo } from '../../services/api'

// Helper: Add years to date string YYYY-MM-DD
const addYears = (dateStr: string, years: number) => {
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().split('T')[0]
}

// Helper: Format timestamp to YYYY-MM-DD
const formatTs = (ts: number) => {
  if (!ts) return ''
  return new Date(ts).toISOString().split('T')[0]
}

// Helper: Calculate Inspection Expiry based on Register Date
// Rule: <10 years old: +2 years. >=10 years old: +1 year.
const calcInspectionExpiry = (inspectDateStr: string, registerDateStr: string) => {
  if (!inspectDateStr || !registerDateStr) return ''

  const regDate = new Date(registerDateStr)
  const now = new Date()

  // Calculate Age (Simple year diff for regulation tiers)
  let age = now.getFullYear() - regDate.getFullYear()

  let interval = 1 // Default for old cars (>10 years)

  if (age < 10) {
    interval = 2
  }

  return addYears(inspectDateStr, interval)
}

Page({
  data: {
    repoId: '',
    name: '',
    vin: '',
    current_mileage: '',
    initial_mileage: '',
    purchase_cost: '',

    // Color
    color: '#2c3e50', // Default
    presetColors: [
      '#2c3e50', // Midnight Blue
      '#c0392b', // Pomegranate
      '#27ae60', // Nephritis
      '#8e44ad', // Wisteria
      '#7f8c8d', // Asbestos
      '#2980b9'  // Belize Hole
    ],

    // Date fields (Strings YYYY-MM-DD for picker)
    register_date: '',
    purchase_date: '',
    compulsory_start: '',
    compulsory_insurance_expiry: '',
    commercial_start: '',
    commercial_insurance_expiry: '',
    inspection_start: '',
    inspection_expiry: '',

    image: '',

    // Manual date edit
    showManualExpiry: false,
    editingField: ''
  },

  onShow() {
    const app = getApp<IAppOption>()
    this.setData({ themeClass: app.globalData.themeClass || '' })
  },

  async onLoad(options: any) {
    if (options.repoId) {
      wx.setNavigationBarTitle({ title: '编辑车辆档案' })
      this.setData({ repoId: options.repoId })
      await this.loadRepoData(options.repoId)
    }
  },

  async loadRepoData(id: string) {
    wx.showLoading({ title: 'Loading...' })
    try {
      const repo = await getRepo(id)
      this.setData({
        name: repo.name,
        vin: repo.vin || '',
        image: repo.image || '',
        current_mileage: repo.current_mileage,
        initial_mileage: repo.initial_mileage || 0,
        purchase_cost: repo.purchase_cost || '',
        color: repo.color || '#2c3e50',
        register_date: formatTs(repo.register_date),
        purchase_date: formatTs(repo.purchase_date),
        compulsory_insurance_expiry: formatTs(repo.compulsory_insurance_expiry),
        compulsory_start: formatTs(repo.compulsory_start),
        commercial_insurance_expiry: formatTs(repo.commercial_insurance_expiry),
        commercial_start: formatTs(repo.commercial_start),
        inspection_expiry: formatTs(repo.inspection_expiry),
        inspection_start: formatTs(repo.inspection_start)
      })
    } catch (e) {
      console.error(e)
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

  onColorSelect(e: any) {
    const color = e.currentTarget.dataset.color
    this.setData({ color })
  },

  onDateChange(e: any) {
    const field = e.currentTarget.dataset.field
    const val = e.detail.value

    this.setData({
      [field]: val,
      showManualExpiry: false
    })

    // Recalc Inspection Expiry if Register Date changes
    if (field === 'register_date') {
      const { inspection_start } = this.data
      if (inspection_start) {
        const expiry = calcInspectionExpiry(inspection_start, val)
        this.setData({ inspection_expiry: expiry })
      }
    }
  },

  onCompulsoryStart(e: any) {
    const start = e.detail.value
    const expiry = addYears(start, 1)
    this.setData({
      compulsory_start: start,
      compulsory_insurance_expiry: expiry
    })
  },

  onCommercialStart(e: any) {
    const start = e.detail.value
    const expiry = addYears(start, 1)
    this.setData({
      commercial_start: start,
      commercial_insurance_expiry: expiry
    })
  },

  onInspectionStart(e: any) {
    const start = e.detail.value
    const { register_date } = this.data

    let expiry = ''
    if (register_date) {
      expiry = calcInspectionExpiry(start, register_date)
    } else {
      // Fallback if no register date: Defaults to +1 year for safety
      expiry = addYears(start, 1)
      wx.showToast({ title: '请先填写注册日期以获得准确推算', icon: 'none' })
    }

    this.setData({
      inspection_start: start,
      inspection_expiry: expiry
    })
  },

  editDate(e: any) {
    const field = e.currentTarget.dataset.field
    this.setData({
      showManualExpiry: true,
      editingField: field
    })
    wx.showToast({ title: '请在下方选择新日期', icon: 'none' })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath
        this.uploadImage(filePath)
      }
    })
  },

  async uploadImage(filePath: string) {
    wx.showLoading({ title: '上传图片...' })
    try {
      const result = await wx.cloud.uploadFile({
        cloudPath: `repos/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
        filePath
      })
      this.setData({ image: result.fileID })
      wx.showToast({ title: '上传成功', icon: 'success' })
    } catch (err) {
      console.error('Image upload failed:', err)
      wx.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  deleteImage() {
    this.setData({ image: '' })
  },

  previewImage() {
    if (this.data.image) {
      wx.previewImage({
        urls: [this.data.image],
        current: this.data.image
      })
    }
  },

   async onSubmit() {
     const { repoId, name, vin, image, current_mileage, initial_mileage, purchase_cost, color, register_date, purchase_date, compulsory_insurance_expiry, compulsory_start, commercial_insurance_expiry, commercial_start, inspection_expiry, inspection_start } = this.data

     if (!name) {
       wx.showToast({ title: '请输入车辆名称', icon: 'none' })
       return
     }

     const payload = {
       name,
       vin,
       image,
       color,
       current_mileage: Number(current_mileage) || 0,
       initial_mileage: Number(initial_mileage) || 0,
       purchase_cost: purchase_cost ? Number(purchase_cost) : undefined,
       // Convert dates to Timestamps (ms)
       register_date: register_date ? new Date(register_date).getTime() : null,
       purchase_date: purchase_date ? new Date(purchase_date).getTime() : null,
       compulsory_insurance_expiry: compulsory_insurance_expiry ? new Date(compulsory_insurance_expiry).getTime() : null,
       compulsory_start: compulsory_start ? new Date(compulsory_start).getTime() : null,
       commercial_insurance_expiry: commercial_insurance_expiry ? new Date(commercial_insurance_expiry).getTime() : null,
       commercial_start: commercial_start ? new Date(commercial_start).getTime() : null,
       inspection_expiry: inspection_expiry ? new Date(inspection_expiry).getTime() : null,
       inspection_start: inspection_start ? new Date(inspection_start).getTime() : null
     }

     wx.showLoading({ title: 'Saving...' })

     try {
       if (repoId) {
         await updateRepo(repoId, payload)
       } else {
         await createRepo({ ...payload, branch: 'main' })
       }

       wx.hideLoading()
       wx.showToast({ title: '保存成功', icon: 'success' })

       setTimeout(() => {
         wx.navigateBack()
         // Optional: Notify prev page to refresh
       }, 1500)
     } catch (e) {
       wx.hideLoading()
       console.error(e)
       wx.showToast({ title: '保存失败', icon: 'none' })
     }
   },

  goBack() {
    wx.navigateBack()
  }
})
