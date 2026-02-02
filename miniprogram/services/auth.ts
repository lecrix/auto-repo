import { config as envConfig, CLOUD_ENV_ID } from '../config'

interface LoginResponse {
  token: string
  openid: string
}

const TOKEN_KEY = 'autorepo_token'
const OPENID_KEY = 'autorepo_openid'

export async function wxLogin(): Promise<LoginResponse> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (res.code) {
          try {
            // 支持云托管模式
            const response: any = await new Promise((resolve, reject) => {
              const url = '/auth/login';
              const method = 'POST';
              const data = { code: res.code };
              
              if (envConfig.useCloudRun || envConfig.environment === 'prod') {
                wx.cloud.callContainer({
                  config: { env: CLOUD_ENV_ID },
                  path: `${envConfig.baseURL}${url}`,
                  method,
                  header: {
                    'content-type': 'application/json',
                    'X-WX-SERVICE': 'autorepo-backend'
                  },
                  data,
                  success: (res) => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                      resolve(res.data)
                    } else {
                      reject(new Error(`Login failed: ${res.statusCode} - ${JSON.stringify(res.data)}`))
                    }
                  },
                  fail: (err) => {
                    console.error('[Auth] Cloud Login Failed:', err)
                    reject(new Error(`Cloud Login failed: ${JSON.stringify(err)}`))
                  }
                })
              } else {
                // 本地开发模式
                wx.request({
                  url: `${envConfig.baseURL}${url}`,
                  method,
                  data,
                  success: (res) => {
                    if (res.statusCode === 200) {
                      resolve(res.data)
                    } else {
                      reject(new Error(`Login failed: ${res.statusCode}`))
                    }
                  },
                  fail: reject
                })
              }
            })

            const { token, openid } = response
            wx.setStorageSync(TOKEN_KEY, token)
            wx.setStorageSync(OPENID_KEY, openid)

            resolve({ token, openid })
          } catch (err) {
            reject(err)
          }
        } else {
          reject(new Error('Failed to get WeChat login code'))
        }
      },
      fail: reject
    })
  })
}


export function getToken(): string | null {
  try {
    return wx.getStorageSync(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getOpenId(): string | null {
  try {
    return wx.getStorageSync(OPENID_KEY)
  } catch {
    return null
  }
}

export function clearAuth(): void {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(OPENID_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
