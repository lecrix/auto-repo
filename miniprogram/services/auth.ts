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
            const baseURL = wx.getStorageSync('api_base_url') || 'http://localhost:8001/api'
            const response: any = await new Promise((resolve, reject) => {
              wx.request({
                url: `${baseURL}/auth/login`,
                method: 'POST',
                data: { code: res.code },
                success: (res) => {
                  if (res.statusCode === 200) {
                    resolve(res.data)
                  } else {
                    reject(new Error(`Login failed: ${res.statusCode}`))
                  }
                },
                fail: reject
              })
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
