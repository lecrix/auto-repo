import { getRepoStats, getIssues, getRepoTrends } from '../../services/api'

Component({
    properties: {
        repoId: {
            type: String,
            value: '',
            observer(newVal) {
                if (newVal) {
                    this.loadData(newVal)
                }
            }
        }
    },

    data: {
        stats: null as any,
        issues: [] as any[],
        trends: null as any,
        loading: false
    },

    lifetimes: {
        attached() {
            if (this.properties.repoId) {
                this.loadData(this.properties.repoId)
            }
        }
    },

    methods: {
        async loadData(id: string) {
            if (!id) return

            this.setData({ loading: true })
            try {
                const [stats, issues, trends] = await Promise.all([
                    getRepoStats(id),
                    getIssues(id, 'open'),
                    getRepoTrends(id, 6)
                ])

                const typeMap: { [key: string]: string } = {
                    maintenance: '保养',
                    repair: '维修',
                    modification: '改装',
                    fuel: '加油',
                    parking: '停车',
                    inspection: '年检',
                    other: '其他',
                    insurance: '保险',
                    purchase: '购车'
                }

                if (stats && stats.composition) {
                    stats.composition = stats.composition.map((item: any) => ({
                        ...item,
                        name: typeMap[item.name] || item.name
                    }))
                }

                if (trends && trends.months && trends.months.length > 0) {
                    const maxCost = Math.max(...trends.months.map((m: any) => m.cost || 0))
                    const maxMileage = Math.max(...trends.months.map((m: any) => m.mileage || 0))
                    const maxFuelCost = Math.max(...trends.months.map((m: any) => m.fuel_cost || 0))
                    this.setData({
                        stats,
                        issues,
                        trends: { ...trends, maxCost, maxMileage, maxFuelCost }
                    })
                } else {
                    this.setData({ stats, issues, trends })
                }
            } catch (e) {
                console.error('Failed to load insights data', e)
                try {
                    const stats = await getRepoStats(id)
                    this.setData({ stats })
                } catch (ex) { }
            } finally {
                this.setData({ loading: false })
            }
        },

        goToAddIssue() {
            wx.navigateTo({
                url: `/pages/issue-create/index?repoId=${this.properties.repoId}`
            })
        },

        onCompleteIssue(e: any) {
            const issue = e.currentTarget.dataset.issue
            const repoId = this.properties.repoId
            if (issue && repoId) {
                wx.navigateTo({
                    url: `/pages/commit-create/index?repoId=${repoId}&closeIssueId=${issue._id}&closeIssueTitle=${encodeURIComponent(issue.title)}`
                })
            }
        }
    }
})
