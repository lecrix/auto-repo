import { wxLogin, clearAuth } from './auth'
import { config as envConfig, CLOUD_ENV_ID } from '../config'

interface ApiConfig {
  baseURL: string
  timeout: number
  retryCount: number
}

interface ApiError {
  code: string
  message: string
  statusCode?: number
  originalError?: any
}

// 重命名局部配置，避免与 config 模块混淆
const requestConfig: ApiConfig = {
  baseURL: envConfig.baseURL,
  timeout: 10000,
  retryCount: 1
}

let isReloginInProgress = false

export function setBaseURL(url: string) {
  requestConfig.baseURL = url
}

class RequestError extends Error implements ApiError {
  code: string
  statusCode?: number
  originalError?: any

  constructor(code: string, message: string, statusCode?: number, originalError?: any) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.originalError = originalError
    this.name = 'RequestError'
  }
}

type ResponseHandler = {
  resolve: (value: any) => void
  reject: (reason?: any) => void
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
}

async function handleResponse(res: any, handler: ResponseHandler): Promise<void> {
  const { resolve, reject, url, method, data } = handler
  
  if (res.statusCode >= 200 && res.statusCode < 300) {
    resolve(res.data)
  } else if (res.statusCode === 401) {
    try {
      const result = await handleUnauthorized(url, method, data)
      resolve(result)
    } catch (err) {
      reject(err)
    }
  } else if (res.statusCode === 403) {
    reject(new RequestError('FORBIDDEN', '无权限访问', res.statusCode))
  } else if (res.statusCode === 404) {
    reject(new RequestError('NOT_FOUND', '资源不存在', res.statusCode))
  } else if (res.statusCode === 429) {
    reject(new RequestError('RATE_LIMITED', '请求过于频繁，请稀后重试', res.statusCode))
  } else if (res.statusCode >= 500) {
    reject(new RequestError('SERVER_ERROR', '服务器错误，请稍后重试', res.statusCode))
  } else {
    const detail = res.data && res.data.detail
    let errorMsg = '请求失败'
    if (typeof detail === 'string') {
      errorMsg = detail
    } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
      errorMsg = detail[0].msg
    }
    reject(new RequestError('REQUEST_FAILED', errorMsg, res.statusCode, res.data))
  }
}

function handleNetworkError(err: any, reject: (reason?: any) => void): void {
  console.error('[API] Network Error:', err)
  reject(new RequestError('NETWORK_ERROR', `网络连接失败: ${err.errMsg || JSON.stringify(err)}`, undefined, err))
}

async function handleUnauthorized(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  data?: any
): Promise<any> {
  if (isReloginInProgress) {
    return Promise.reject(new RequestError('UNAUTHORIZED', '正在重新登录...', 401))
  }

  isReloginInProgress = true
  clearAuth()

  return new Promise((resolve, reject) => {
    wx.showModal({
      title: '登录已过期',
      content: '是否重新登录？',
      confirmText: '重新登录',
      cancelText: '取消',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          try {
            wx.showLoading({ title: '登录中...' })
            await wxLogin()
            wx.hideLoading()
            wx.showToast({ title: '登录成功', icon: 'success' })
            isReloginInProgress = false
            
            const result = await request(url, method, data)
            resolve(result)
          } catch (err) {
            wx.hideLoading()
            isReloginInProgress = false
            wx.showToast({ title: '登录失败', icon: 'none' })
            reject(new RequestError('UNAUTHORIZED', '重新登录失败', 401))
          }
        } else {
          isReloginInProgress = false
          wx.reLaunch({ url: '/pages/repo-list/index' })
          reject(new RequestError('UNAUTHORIZED', '用户取消登录', 401))
        }
      },
      fail: () => {
        isReloginInProgress = false
        reject(new RequestError('UNAUTHORIZED', '登录已过期', 401))
      }
    })
  })
}

const request = (url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', data?: any, retries = requestConfig.retryCount): Promise<any> => {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'X-WX-SERVICE': 'autorepo-backend'
    }
    
    const token = wx.getStorageSync('autorepo_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (envConfig.useCloudRun || envConfig.environment === 'prod') {
      if (!wx.cloud) {
        reject(new RequestError('SYSTEM_ERROR', '当前基础库不支持云能力', undefined))
        return
      }

      wx.cloud.callContainer({
        config: {
          env: CLOUD_ENV_ID
        },
        path: `${envConfig.baseURL}${url}`,
        method,
        header: headers,
        data,
        success: (res: any) => {
          handleResponse(res, { resolve, reject, url, method, data })
        },
        fail: (err: any) => {
          handleNetworkError(err, reject)
        }
      })
      return
    }
    
    const fullUrl = `${envConfig.baseURL}${url}`
    if (fullUrl.startsWith('/')) {
      console.error('[API] Config Error: Relative URL in non-cloud mode', fullUrl)
      reject(new RequestError('CONFIG_ERROR', '环境配置错误：非云托管模式下 URL 无效', undefined))
      return
    }

    wx.request({
      url: fullUrl,
      method,
      data,
      timeout: requestConfig.timeout,
      header: headers,
      success: (res: any) => {
        handleResponse(res, { resolve, reject, url, method, data })
      },
      fail: (err: any) => {
        handleNetworkError(err, reject)
      }
    })
  })
}

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

export const deleteIssue = (issueId: string) => {
    return request(`/issues/${issueId}`, 'DELETE');
};

export const updateIssue = (issueId: string, data: any) => {
    return request(`/issues/${issueId}`, 'PATCH', data);
};

export const getRepoTrends = (repoId: string, months: number = 12) => {
    return request(`/repos/${repoId}/trends?months=${months}`, 'GET');
};
