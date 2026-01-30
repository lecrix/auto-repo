import { getIssues } from '../../services/api'

Component({
    properties: {
        repoId: {
            type: String,
            value: '',
            async observer(newVal) {
                if (newVal) {
                    await this.loadIssues(newVal).catch(err => {
                        console.error('Failed to load issues in observer:', err)
                    })
                }
            }
        }
    },

    data: {
        topIssue: null as any,
        loading: false
    },

    methods: {
        async loadIssues(id: string) {
            this.setData({ loading: true })
            try {
                const issues: any[] = await getIssues(id, 'open')
                if (issues && issues.length > 0) {
                    this.setData({ topIssue: issues[0] })
                } else {
                    this.setData({ topIssue: null })
                }
            } catch (e) {
                console.error(e)
            } finally {
                this.setData({ loading: false })
            }
        },

        onResolve() {
            const { topIssue } = this.data
            const repoId = this.properties.repoId
            if (topIssue && repoId) {
                // Navigate to commit-create with issue info pre-filled
                wx.navigateTo({
                    url: `/pages/commit-create/index?repoId=${repoId}&closeIssueId=${topIssue._id}&closeIssueTitle=${encodeURIComponent(topIssue.title)}`
                })
            }
        }
    }
})
