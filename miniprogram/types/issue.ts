export type IssueStatus = 'open' | 'closed';
export type IssuePriority = 'high' | 'medium' | 'low';

export interface Issue {
    _id?: string;
    repo_id: string;
    title: string;
    description?: string;
    status: IssueStatus;
    priority: IssuePriority;
    labels: string[];

    // Triggers
    due_date?: number;     // Timestamp
    due_mileage?: number;  // Target Km

    // Closing info
    created_at: number;
    closed_at?: number;
    closed_by_commit_id?: string;
}
