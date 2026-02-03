import { getRepoDetail, getCommits } from '../../services/api'
import { exportToCSV, shareCSV } from '../../utils/exporter'
import { formatLocalDate, formatLocalDateTime } from '../../utils/date'
import { calculateDaysLeft, formatDaysLeft, calculateVehicleAge, isDueWarning } from '../../utils/vehicle'
import { config as envConfig, CLOUD_ENV_ID } from '../../config'

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

      wx.showActionSheet({
        itemList: ['打开', '分享'],
        success: async (res) => {
          if (res.tapIndex === 0) {
            wx.openDocument({
              filePath: filePath,
              showMenu: true,
              fail: () => {
                wx.showToast({ title: '打开失败', icon: 'none' })
              }
            })
          } else if (res.tapIndex === 1) {
            try {
              await shareCSV(filePath)
            } catch (err: any) {
              wx.showToast({
                title: err.message || '分享失败',
                icon: 'none'
              })
            }
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

    const repoName = this.data.repo ? this.data.repo.name : 'vehicle'
    const fileName = `车辆维护记录-${repoName}.pdf`
    const savedPath = `${wx.env.USER_DATA_PATH}/${fileName}`

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-WX-SERVICE': 'autorepo-backend'
    }

    const showPDFActions = (filePath: string) => {
      wx.showActionSheet({
        itemList: ['打开', '分享'],
        success: (res) => {
          if (res.tapIndex === 0) {
            wx.openDocument({
              filePath: filePath,
              fileType: 'pdf',
              showMenu: true,
              fail: (err) => {
                console.error('Failed to open PDF:', err)
                wx.showToast({ title: '打开PDF失败', icon: 'none' })
              }
            })
          } else if (res.tapIndex === 1) {
            wx.shareFileMessage({
              filePath: filePath,
              fileName: fileName,
              fail: () => {
                wx.openDocument({
                  filePath: filePath,
                  fileType: 'pdf',
                  showMenu: true
                })
              }
            })
          }
        }
      })
    }

    if (envConfig.useCloudRun || envConfig.environment === 'prod') {
      wx.cloud.callContainer({
        config: { env: CLOUD_ENV_ID },
        path: `${envConfig.baseURL}/repos/${this.data.repoId}/export/pdf`,
        method: 'GET',
        header: headers,
        responseType: 'arraybuffer',
        success: (res: any) => {
          wx.hideLoading()
          if (res.statusCode === 200) {
            const fs = wx.getFileSystemManager()
            fs.writeFile({
              filePath: savedPath,
              data: res.data,
              encoding: 'binary',
              success: () => {
                showPDFActions(savedPath)
              },
              fail: (err) => {
                console.error('Failed to save PDF:', err)
                wx.showToast({ title: '保存PDF失败', icon: 'none' })
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
        fail: (err: any) => {
          wx.hideLoading()
          console.error('Cloud container call failed:', err)
          wx.showToast({ title: '导出失败，请稍后重试', icon: 'none' })
        }
      })
    } else {
      wx.downloadFile({
        url: `${envConfig.baseURL}/repos/${this.data.repoId}/export/pdf`,
        header: { 'Authorization': `Bearer ${token}` },
        success: (res) => {
          wx.hideLoading()
          if (res.statusCode === 200) {
            const fs = wx.getFileSystemManager()
            fs.saveFile({
              tempFilePath: res.tempFilePath,
              filePath: savedPath,
              success: () => {
                showPDFActions(savedPath)
              },
              fail: () => {
                showPDFActions(res.tempFilePath)
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
  }
})
