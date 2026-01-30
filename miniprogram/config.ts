/**
 * AutoRepo 环境配置
 * 
 * 使用方法：
 * - 开发工具调试：USE_DEVICE_DEBUG = false (使用 localhost)
 * - 真机调试：USE_DEVICE_DEBUG = true (使用局域网IP)
 */

// ==================== 配置开关 ====================
// 设置为 true 启用真机调试模式，false 使用开发工具模式
const USE_DEVICE_DEBUG = true

// ==================== 环境配置 ====================
const ENV_CONFIG = {
  // 开发工具模式 (模拟器)
  development: {
    baseURL: 'http://localhost:8000/api',
    description: '开发工具模拟器 (localhost)'
  },

  // 真机调试模式 (需要使用局域网IP)
  device: {
    baseURL: 'http://192.168.1.196:8000/api',
    description: '真机调试 (局域网IP)'
  }
}

// ==================== 导出配置 ====================
const currentEnv = USE_DEVICE_DEBUG ? 'device' : 'development'

export const config = {
  baseURL: ENV_CONFIG[currentEnv].baseURL,
  environment: currentEnv,
  description: ENV_CONFIG[currentEnv].description
}

// 方便调试时查看当前配置
console.log(`[AutoRepo Config] 当前环境: ${config.description}`)
console.log(`[AutoRepo Config] API地址: ${config.baseURL}`)
