// services/api.ts

const BASE_URL = 'http://localhost:8001/api';

const request = (url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any) => {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${BASE_URL}${url}`,
            method,
            data,
            header: {
                'content-type': 'application/json'
            },
            success: (res: any) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                } else {
                    wx.showToast({ title: '请求失败', icon: 'none' });
                    reject(res);
                }
            },
            fail: (err) => {
                wx.showToast({ title: '网络错误', icon: 'none' });
                console.error('API Error:', err);
                reject(err);
            }
        });
    });
};

export const getRepos = () => {
    return request('/repos', 'GET');
};

export const createRepo = (repo: any) => {
    return request('/repos', 'POST', repo);
};

export const updateRepo = (id: string, data: any) => {
    return request(`/repos/${id}`, 'PUT', data);
};

export const deleteRepo = (id: string) => {
    return request(`/repos/${id}`, 'DELETE');
};

export const getRepoDetail = (id: string) => {
    return request(`/repos/${id}`, 'GET');
};

// Alias for compatibility
export const getRepo = getRepoDetail;

export const getCommits = (repoId: string) => {
    return request(`/commits?repo_id=${repoId}`, 'GET');
};

export const createCommit = (commit: any) => {
    return request('/commits', 'POST', commit);
};

export const getCommitDetail = (id: string) => {
    return request(`/commits/${id}`, 'GET');
};

export const getRepoStats = (repoId: string) => {
    return request(`/repos/${repoId}/stats`, 'GET');
};

export const getIssues = (repoId: string, status?: string) => {
    let url = `/repos/${repoId}/issues`;
    if (status) {
        url += `?status=${status}`;
    }
    return request(url, 'GET');
};

export const createIssue = (repoId: string, issue: any) => {
    return request(`/repos/${repoId}/issues`, 'POST', issue);
};
