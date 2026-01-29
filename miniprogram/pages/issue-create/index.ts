import { createIssue } from '../../services/api'

Page({
    data: {
        repoId: '',
        title: '',
        due_mileage: '',
        priority: 'medium',
        pKeys: ['low', 'medium', 'high'],
        pLabels: ['低 (Low)', '中 (Medium)', '高 (Urgent)'],
        pIndex: 1
    },

    onShow() {
    const app = getApp<IAppOption>()
    this.setData({ themeClass: app.globalData.themeClass || '' })
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

    onPriorityChange(e: any) {
        this.setData({
            pIndex: e.detail.value,
            priority: this.data.pKeys[e.detail.value]
        })
    },

    async onSubmit() {
        const { repoId, title, due_mileage, priority } = this.data

        if (!title) {
            wx.showToast({ title: '请输入标题', icon: 'none' })
            return
        }

        wx.showLoading({ title: 'Creating...' })

        try {
            await createIssue(repoId, {
                repo_id: repoId,
                title,
                priority,
                due_mileage: due_mileage ? Number(due_mileage) : null
            })
            wx.hideLoading()
            wx.showToast({ title: 'Success', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 1500)
        } catch (e) {
            wx.hideLoading()
            console.error(e)
            wx.showToast({ title: 'Failed', icon: 'none' })
        }
    },

    onCancel() {
        wx.navigateBack()
    }
})
