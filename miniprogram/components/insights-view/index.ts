import { getRepoStats, getIssues, getRepoTrends, deleteIssue, updateIssue } from '../../services/api'

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

            const translateComposition = (stats: any) => {
                if (stats && stats.composition) {
                    stats.composition = stats.composition.map((item: any) => ({
                        ...item,
                        name: typeMap[item.name] || item.name
                    }))
                }
                return stats
            }

            this.setData({ loading: true })

            const results = await Promise.allSettled([
                getRepoStats(id),
                getIssues(id, 'open'),
                getRepoTrends(id, 6)
            ])

            const [statsResult, issuesResult, trendsResult] = results

            const stats = statsResult.status === 'fulfilled' ? statsResult.value : null
            const issues = issuesResult.status === 'fulfilled' ? issuesResult.value : []
            const trends = trendsResult.status === 'fulfilled' ? trendsResult.value : null

            if (stats) {
                translateComposition(stats)
            }

            const failedRequests = results.filter(r => r.status === 'rejected')
            if (failedRequests.length > 0) {
                console.warn('Some insights requests failed:', failedRequests)
            }

            if (!stats) {
                wx.showToast({
                    title: '统计数据加载失败',
                    icon: 'none'
                })
                this.setData({ loading: false })
                return
            }

            if (trends && trends.months && trends.months.length > 0) {
                const maxCost = Math.max(...trends.months.map((m: any) => m.cost || 0))
                const maxMileage = Math.max(...trends.months.map((m: any) => m.mileage || 0))
                const maxFuelCost = Math.max(...trends.months.map((m: any) => m.fuel_cost || 0))
                this.setData({
                    stats,
                    issues,
                    trends: { ...trends, maxCost, maxMileage, maxFuelCost },
                    loading: false
                })
            } else {
                this.setData({ stats, issues, trends, loading: false })
            }
        },

        goToAddIssue() {
            wx.navigateTo({
                url: `/pages/issue-create/index?repoId=${this.properties.repoId}`
            })
        },

        onIssueClick(e: any) {
            const issue = e.currentTarget.dataset.issue
            const repoId = this.properties.repoId
            if (issue && repoId) {
                const issueData = encodeURIComponent(JSON.stringify(issue))
                wx.navigateTo({
                    url: `/pages/issue-detail/index?issueId=${issue._id}&repoId=${repoId}&issue=${issueData}`
                })
            }
        },

        onActionTap() {},

        onCompleteIssue(e: any) {
            const issue = e.currentTarget.dataset.issue
            const repoId = this.properties.repoId
            if (!issue || !repoId) return

            wx.showActionSheet({
                itemList: ['稍后处理', '处理完成'],
                success: async (res) => {
                    if (res.tapIndex === 0) {
                        const issueData = encodeURIComponent(JSON.stringify(issue))
                        wx.navigateTo({
                            url: `/pages/issue-detail/index?issueId=${issue._id}&repoId=${repoId}&issue=${issueData}`
                        })
                    } else if (res.tapIndex === 1) {
                        wx.showLoading({ title: '处理中...' })
                        try {
                            await updateIssue(issue._id, {
                                status: 'closed',
                                closed_at: Date.now()
                            })
                            wx.hideLoading()
                            wx.showToast({ title: '已完成', icon: 'success' })
                            this.loadData(this.properties.repoId)
                        } catch (err) {
                            wx.hideLoading()
                            console.error('Complete issue failed:', err)
                            wx.showToast({ title: '操作失败', icon: 'none' })
                        }
                    }
                }
            })
        },

        // 阻止 action 区域的点击冒泡
        onActionTap() {
            // 空方法，用于 catchtap 阻止冒泡
        },

        onCompleteIssue(e: any) {
            const issue = e.currentTarget.dataset.issue
            const repoId = this.properties.repoId
            if (!issue || !repoId) return

            wx.showActionSheet({
                itemList: ['稍后处理', '处理完成'],
                success: async (res) => {
                    if (res.tapIndex === 0) {
                        // 稍后处理 - 跳转到详情页
                        const issueData = encodeURIComponent(JSON.stringify(issue))
                        wx.navigateTo({
                            url: `/pages/issue-detail/index?issueId=${issue._id}&repoId=${repoId}&issue=${issueData}`
                        })
                    } else if (res.tapIndex === 1) {
                        // 处理完成 - 调用 API 标记为已完成
                        wx.showLoading({ title: '处理中...' })
                        try {
                            await updateIssue(issue._id, {
                                status: 'closed',
                                closed_at: Date.now()
                            })
                            wx.hideLoading()
                            wx.showToast({ title: '已完成', icon: 'success' })
                            // 刷新列表
                            this.loadData(this.properties.repoId)
                        } catch (err) {
                            wx.hideLoading()
                            console.error('Complete issue failed:', err)
                            wx.showToast({ title: '操作失败', icon: 'none' })
                        }
                    }
                }
            })
        },

        onDeleteIssue(e: any) {
            const issue = e.currentTarget.dataset.issue
            if (!issue || !issue._id) return

            wx.showModal({
                title: '确认删除',
                content: `确定要删除待办事项「${issue.title}」吗？`,
                confirmText: '删除',
                confirmColor: '#e74c3c',
                success: async (res) => {
                    if (res.confirm) {
                        wx.showLoading({ title: '删除中...' })
                        try {
                            await deleteIssue(issue._id)
                            wx.hideLoading()
                            wx.showToast({ title: '已删除', icon: 'success' })
                            this.loadData(this.properties.repoId)
                        } catch (err) {
                            wx.hideLoading()
                            console.error('Delete issue failed:', err)
                            wx.showToast({ title: '删除失败', icon: 'none' })
                        }
                    }
                }
            })
        }
    }
})
