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
                this.setData({ stats, issues, trends })
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
