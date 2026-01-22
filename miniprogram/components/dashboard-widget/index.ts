import { getIssues } from '../../services/api'

Component({
    properties: {
        repoId: {
            type: String,
            value: '',
            observer(newVal) {
                if (newVal) {
                    this.loadIssues(newVal)
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
        }
    }
})
