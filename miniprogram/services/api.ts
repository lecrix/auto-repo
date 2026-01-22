// services/api.ts

const BASE_URL = 'http://localhost:8000/api';

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

export const getRepoDetail = (id: string) => {
    return request(`/repos/${id}`, 'GET');
};

export const getCommits = (repoId: string) => {
    return request(`/commits?repo_id=${repoId}`, 'GET');
};

export const createCommit = (commit: any) => {
    return request('/commits', 'POST', commit);
};

export const getCommitDetail = (id: string) => {
    return request(`/commits/${id}`, 'GET');
};
