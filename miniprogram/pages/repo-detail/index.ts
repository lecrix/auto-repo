import { getRepoDetail, getCommits } from '../../services/api'
import { exportToCSV, shareCSV } from '../../utils/exporter'
import { formatLocalDate, formatLocalDateTime } from '../../utils/date'
import { calculateDaysLeft, formatDaysLeft, calculateVehicleAge, isDueWarning } from '../../utils/vehicle'

Page({
  data: {
    repo: null as any,
    commits: [] as any[],
    loading: true,
    repoId: '',
    currentTab: 0,
    filters: {} as any
  },

  async onLoad(options: any) {
    this.setData({ repoId: options.id })
  },

  async onShow() {
    this.setData({ loading: true })
    await this.loadData()
  },

  async onPullDownRefresh() {
    await this.loadData()
    wx.stopPullDownRefresh()
    wx.vibrateShort({ type: 'light' })
  },

  async loadData() {
    try {
      const [repo, commits] = await Promise.all([
        getRepoDetail(this.data.repoId),
        getCommits(this.data.repoId, this.data.filters)
      ])

      const formatDate = (ts: number) => ts ? formatLocalDate(ts) : '--'

      if (repo) {
        repo.formatted_register_date = formatDate(repo.register_date)
        repo.vehicle_age = calculateVehicleAge(repo.register_date)
        
        const drivenMileage = repo.current_mileage - (repo.initial_mileage || 0)
        repo.driven_mileage = drivenMileage

        const inspectionDays = calculateDaysLeft(repo.inspection_expiry)
        const compulsoryDays = calculateDaysLeft(repo.compulsory_insurance_expiry)
        const commercialDays = calculateDaysLeft(repo.commercial_insurance_expiry)

        repo.inspection_days_left = formatDaysLeft(inspectionDays)
        repo.compulsory_days_left = formatDaysLeft(compulsoryDays)
        repo.commercial_days_left = formatDaysLeft(commercialDays)

        repo.inspection_warning = isDueWarning(inspectionDays)
        repo.compulsory_warning = isDueWarning(compulsoryDays)
        repo.commercial_warning = isDueWarning(commercialDays)
      }

      const formattedCommits = (commits as any[]).map(c => ({
        ...c,
        date: formatLocalDateTime(c.timestamp)
      }))

      this.setData({
        repo,
        commits: formattedCommits
      })
    } catch (err: any) {
      console.error('Failed to load repo detail:', err)
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  goToCommitCreate() {
    wx.navigateTo({
      url: `/pages/commit-create/index?repoId=${this.data.repoId}`
    })
  },

  goBack() {
    wx.navigateBack()
  },

  goToEdit() {
    wx.navigateTo({
      url: `/pages/repo-create/index?repoId=${this.data.repoId}`
    })
  },

  goToCommitDetail(e: any) {
    const commitId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/commit-detail/index?commitId=${commitId}`
    })
  },

  switchTab(e: any) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentTab: index })
  },

  onFilterChange(e: any) {
    this.setData({ filters: e.detail })
    this.loadData()
  },

  async handleExport() {
    if (!this.data.commits || this.data.commits.length === 0) {
      wx.showToast({
        title: '暂无记录可导出',
        icon: 'none'
      })
      return
    }

    if (!this.data.repo || !this.data.repo.name) {
      wx.showToast({
        title: '车辆信息缺失',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '生成中...' })

    try {
      const filePath = await exportToCSV(this.data.commits, this.data.repo.name)
      wx.hideLoading()

      wx.showModal({
        title: '导出成功',
        content: '是否分享CSV文件?',
        confirmText: '分享',
        cancelText: '稍后',
        success: async (res) => {
          if (res.confirm) {
            try {
              await shareCSV(filePath)
            } catch (err: any) {
              wx.showToast({
                title: err.message || '分享失败',
                icon: 'none'
              })
            }
          } else {
            wx.showToast({
              title: '已保存到本地',
              icon: 'success'
            })
          }
        }
      })
    } catch (err: any) {
      wx.hideLoading()
      wx.showToast({
        title: err.message || '导出失败',
        icon: 'none'
      })
    }
  }
})
