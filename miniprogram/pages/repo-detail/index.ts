import { getRepoDetail, getCommits } from '../../services/api'
import { exportToCSV, shareCSV } from '../../utils/exporter'
import { formatLocalDate, formatLocalDateTime } from '../../utils/date'
import { calculateDaysLeft, formatDaysLeft, calculateVehicleAge, isDueWarning } from '../../utils/vehicle'
import { config as envConfig } from '../../config'

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
    const app = getApp<IAppOption>()
    this.setData({ themeClass: app.globalData.themeClass || '' })

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
  },

  handleExportPDF() {
    if (!this.data.commits || this.data.commits.length === 0) {
      wx.showToast({
        title: '暂无记录可导出',
        icon: 'none'
      })
      return
    }

    const token = wx.getStorageSync('autorepo_token')
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '生成PDF...' })

    const baseURL = envConfig.baseURL
    
    const repoName = this.data.repo ? this.data.repo.name : 'vehicle'
    const fileName = `车辆维护记录-${repoName}.pdf`

    wx.downloadFile({
      url: `${baseURL}/repos/${this.data.repoId}/export/pdf`,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          const fs = wx.getFileSystemManager()
          const savedPath = `${wx.env.USER_DATA_PATH}/${fileName}`
          
          fs.saveFile({
            tempFilePath: res.tempFilePath,
            filePath: savedPath,
            success: () => {
              wx.openDocument({
                filePath: savedPath,
                fileType: 'pdf',
                showMenu: true,
                fail: (err) => {
                  console.error('Failed to open PDF:', err)
                  wx.showToast({ title: '打开PDF失败', icon: 'none' })
                }
              })
            },
            fail: () => {
              wx.openDocument({
                filePath: res.tempFilePath,
                fileType: 'pdf',
                showMenu: true
              })
            }
          })
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('autorepo_token')
          wx.removeStorageSync('autorepo_openid')
          wx.showToast({ title: '登录已过期', icon: 'none' })
        } else {
          wx.showToast({ title: `导出失败 (${res.statusCode})`, icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('Download failed:', err)
        wx.showToast({ title: '下载失败，请检查网络', icon: 'none' })
      }
    })
  }
})
