// API 生成器配置文件
export interface ApiGeneratorConfig {
  // URL 过滤规则
  urlFilters: {
    // 排除的 URL 模式（支持通配符）
    exclude: string[]
    // 包含的 URL 模式（如果设置了，只有匹配的才会生成）
    include?: string[]
  }
  // 自定义 API 方法映射
  customMethods: Record<
    string,
    {
      // 自定义方法名
      name: string
      // 方法描述
      description?: string
      // 是否生成
      generate?: boolean
    }
  >
}

export const config: ApiGeneratorConfig = {
  urlFilters: {
    exclude: [
      '/health', // 健康检查
      '/actuator/**', // Spring Boot Actuator
      '/error', // 错误页面
      '/favicon.ico', // 图标
      '/swagger-ui/**', // Swagger UI
      '/v3/api-docs/**', // OpenAPI 文档本身
      '/webjars/**', // WebJars 资源
    ],
    // 如果需要只生成特定路径，取消下面的注释
    // include: [
    //   '/api/**',
    //   '/admin/**'
    // ]
  },
  customMethods: {
    // '/test/tt': {
    //   name: 'getTestInfo',
    //   description: '获取测试信息',
    //   generate: false // 设置为 false 则不生成此方法
    // },
    // 更多自定义配置...
    // '/user/login': {
    //   name: 'userLogin',
    //   description: '用户登录',
    //   generate: true
    // }
  },
}
