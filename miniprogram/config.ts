/**
 * AutoRepo 环境配置
 * 
 * 使用方法：
 * - 开发工具调试：USE_DEVICE_DEBUG = false (使用 localhost)
 * - 真机调试：USE_DEVICE_DEBUG = true (使用局域网IP)
 */

// ==================== 配置开关 ====================
// 模式选择: 'dev' (开发工具), 'device' (真机调试), 'prod' (云托管-生产环境)
// ⚠️ 重要: 上线前必须改为 'prod'
const CURRENT_MODE: 'dev' | 'device' | 'prod' = 'prod'

// ==================== 环境配置 ====================
const ENV_CONFIG = {
  // 开发工具模式 (模拟器) - 本地 Docker 或直接运行
  dev: {
    baseURL: 'http://localhost:8000/api',
    useCloudRun: false,
    description: '开发工具模拟器 (localhost)'
  },

  // 真机调试模式 (需要使用局域网IP)
  device: {
    baseURL: 'http://192.168.1.196:8000/api', // 请修改为您电脑的局域网IP
    useCloudRun: false,
    description: '真机调试 (局域网IP)'
  },

  // 生产环境 (微信云托管) - 免域名访问
  prod: {
    baseURL: '/api', // 云托管内部路径前缀
    useCloudRun: true,
    description: '生产环境 (微信云托管)'
  }
}

// ==================== 导出配置 ====================
export const config = {
  baseURL: ENV_CONFIG[CURRENT_MODE].baseURL,
  useCloudRun: ENV_CONFIG[CURRENT_MODE].useCloudRun,
  environment: CURRENT_MODE,
  description: ENV_CONFIG[CURRENT_MODE].description
}

// 强制输出配置日志，确保真机也能看到
const logConfig = () => {
  const info = `[AutoRepo Config] 
  Mode: ${CURRENT_MODE}
  Env: ${config.environment}
  CloudRun: ${config.useCloudRun}
  BaseURL: ${config.baseURL}`;
  console.warn(info); // 使用 warn 级别，更显眼
}
logConfig();

