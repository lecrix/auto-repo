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
                    const detail = res.data && res.data.detail;
                    let errorMsg = '请求失败';
                    if (typeof detail === 'string') {
                        errorMsg = detail;
                    } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
                        errorMsg = detail[0].msg;
                    }
                    reject(new Error(errorMsg));
                }
            },
            fail: (err) => {
                console.error('API Error:', err);
                reject(new Error('网络错误'));
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

export const getCommits = (repoId: string, filters?: {
  type?: string,
  mileageMin?: number,
  mileageMax?: number,
  dateStart?: number,
  dateEnd?: number,
  search?: string
}) => {
  let url = `/commits?repo_id=${repoId}`;
  if (filters) {
    if (filters.type) url += `&type=${filters.type}`;
    if (filters.mileageMin !== undefined) url += `&mileage_min=${filters.mileageMin}`;
    if (filters.mileageMax !== undefined) url += `&mileage_max=${filters.mileageMax}`;
    if (filters.dateStart) url += `&date_start=${filters.dateStart}`;
    if (filters.dateEnd) url += `&date_end=${filters.dateEnd}`;
    if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
  }
  return request(url, 'GET');
};

export const createCommit = (commit: any) => {
    return request('/commits', 'POST', commit);
};

export const getCommitDetail = (id: string) => {
    return request(`/commits/${id}`, 'GET');
};

export const updateCommit = (id: string, commit: any) => {
    return request(`/commits/${id}`, 'PUT', commit);
};

export const deleteCommit = (id: string) => {
    return request(`/commits/${id}`, 'DELETE');
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

export const getRepoTrends = (repoId: string, months: number = 12) => {
    return request(`/repos/${repoId}/trends?months=${months}`, 'GET');
};

