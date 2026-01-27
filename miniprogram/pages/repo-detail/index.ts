import { getRepoDetail, getCommits } from '../../services/api'
import { formatTime } from '../../utils/util'
import { exportToCSV, shareCSV } from '../../utils/exporter'

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

      // Format timestamps
      const formatDate = (ts: number) => ts ? new Date(ts).toISOString().split('T')[0] : '--';

      // Calculate days until expiry (negative = overdue)
      const calcDaysLeft = (ts: number): number | null => {
        if (!ts) return null;
        const now = Date.now();
        return Math.ceil((ts - now) / (24 * 60 * 60 * 1000));
      };

      // Calculate vehicle age in years and months
      const calcVehicleAge = (registerTs: number): string => {
        if (!registerTs) return '--';
        const now = new Date();
        const regDate = new Date(registerTs);
        let years = now.getFullYear() - regDate.getFullYear();
        let months = now.getMonth() - regDate.getMonth();
        if (months < 0) {
          years--;
          months += 12;
        }
        if (years > 0) {
          return months > 0 ? `${years}年${months}个月` : `${years}年`;
        }
        return `${months}个月`;
      };

      // Format days left for display
      const formatDaysLeft = (days: number | null): string => {
        if (days === null) return '--';
        if (days < 0) return `已过期${Math.abs(days)}天`;
        if (days === 0) return '今天到期';
        return `${days}天`;
      };

      // Inject formatted dates into repo object for view
      if (repo) {
        repo.formatted_register_date = formatDate(repo.register_date);
        repo.vehicle_age = calcVehicleAge(repo.register_date);
        
        // Calculate driven distance
        const drivenDistance = repo.current_mileage - (repo.initial_mileage || 0);
        repo.driven_distance = drivenDistance;

        // Calculate days left for each expiry
        const inspectionDays = calcDaysLeft(repo.inspection_expiry);
        const compulsoryDays = calcDaysLeft(repo.compulsory_insurance_expiry);
        const commercialDays = calcDaysLeft(repo.commercial_insurance_expiry);

        repo.inspection_days_left = formatDaysLeft(inspectionDays);
        repo.compulsory_days_left = formatDaysLeft(compulsoryDays);
        repo.commercial_days_left = formatDaysLeft(commercialDays);

        // Warning flags (< 30 days or overdue)
        repo.inspection_warning = inspectionDays !== null && inspectionDays < 30;
        repo.compulsory_warning = compulsoryDays !== null && compulsoryDays < 30;
        repo.commercial_warning = commercialDays !== null && commercialDays < 30;
      }

      const formattedCommits = (commits as any[]).map(c => ({
        ...c,
        date: formatTime(new Date(c.timestamp))
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
    if (this.data.commits.length === 0) {
      wx.showToast({
        title: '暂无记录可导出',
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
