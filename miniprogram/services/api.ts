import { wxLogin, clearAuth } from './auth'
import { config as envConfig } from '../config'

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

async function handleUnauthorized(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
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

const request = (url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any, retries = requestConfig.retryCount): Promise<any> => {
  return new Promise((resolve, reject) => {
    // 调试日志：检查当前环境配置 (现在使用 envConfig)
    console.log('[API] Request:', { 
      url, 
      method, 
      env: envConfig.environment, 
      useCloudRun: envConfig.useCloudRun,
      baseURL: envConfig.baseURL 
    })

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'X-WX-SERVICE': 'autorepo-backend' // 显式指定服务名为 backend
    }
    
    const token = wx.getStorageSync('autorepo_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // 处理云托管调用 (生产环境)
    // 强制检查：如果是 prod 模式，必须走 cloud
    if (envConfig.useCloudRun || envConfig.environment === 'prod') {
      if (!wx.cloud) {
        reject(new RequestError('SYSTEM_ERROR', '当前基础库不支持云能力', undefined))
        return
      }

      wx.cloud.callContainer({
        config: {
          env: 'autorepo-backend-8faokd7f798030e' // 显式指定环境 ID，防止未初始化错误
        },
        path: `${envConfig.baseURL}${url}`, // e.g., /api/repos
        method,
        header: headers,
        data,
        success: async (res: any) => {
          console.log('[API] Cloud Success:', res)
          // 云托管返回的 res.data 才是实际的响应体
          // res.statusCode 是 HTTP 状态码
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
             reject(new RequestError('RATE_LIMITED', '请求过于频繁，请稍后重试', res.statusCode))
          } else if (res.statusCode >= 500) {
             reject(new RequestError('SERVER_ERROR', '服务器错误，请稍后重试', res.statusCode))
          } else {
             // 错误处理逻辑复用
             const detail = res.data && res.data.detail
             let errorMsg = '请求失败'
             if (typeof detail === 'string') {
               errorMsg = detail
             } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
               errorMsg = detail[0].msg
             }
             reject(new RequestError('REQUEST_FAILED', errorMsg, res.statusCode, res.data))
          }
        },
        fail: (err: any) => {
           console.error('[API] Cloud Error:', err)
           reject(new RequestError('NETWORK_ERROR', `云服务连接失败: ${err.errMsg || JSON.stringify(err)}`, undefined, err))
        }
      })
      return // 结束执行，不运行下方的 wx.request
    }
    
    // 防御性检查：非云托管模式下，URL 必须是完整的 HTTP 地址
    const fullUrl = `${envConfig.baseURL}${url}`
    if (fullUrl.startsWith('/')) {
      console.error('[API] Critical Config Error: Relative URL used in non-cloud mode', fullUrl)
      reject(new RequestError('CONFIG_ERROR', '环境配置错误：非云托管模式下 URL 无效', undefined))
      return
    }

    // 处理本地/普通 HTTP 请求 (开发环境)
    wx.request({
      url: fullUrl,
      method,
      data,
      timeout: requestConfig.timeout,
      header: headers,
      success: async (res: any) => {

          console.log('[API] Cloud Success:', res)
          // 云托管返回的 res.data 才是实际的响应体
          // res.statusCode 是 HTTP 状态码
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
          } else if (res.statusCode >= 500) {
             reject(new RequestError('SERVER_ERROR', '服务器错误，请稍后重试', res.statusCode))
          } else {
             // 错误处理逻辑复用
             const detail = res.data && res.data.detail
             let errorMsg = '请求失败'
             if (typeof detail === 'string') {
               errorMsg = detail
             } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
               errorMsg = detail[0].msg
             }
             reject(new RequestError('REQUEST_FAILED', errorMsg, res.statusCode, res.data))
          }
        },
        fail: (err: any) => {
           console.error('[API] Cloud Error:', err)
           reject(new RequestError('NETWORK_ERROR', `云服务连接失败: ${err.errMsg || JSON.stringify(err)}`, undefined, err))
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

export const getRepoTrends = (repoId: string, months: number = 12) => {
    return request(`/repos/${repoId}/trends?months=${months}`, 'GET');
};
