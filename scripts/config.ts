// API 生成器配置文件

/**
 * REST 风格检测规则名。
 * 与 scripts/generator/lint.ts 中的 RestRule 保持一致。
 */
export type RestLintRule =
  | 'verb-in-uri'
  | 'post-for-query'
  | 'get-with-body'
  | 'put-without-body'
  | 'id-in-query'
  | 'camel-case-in-uri'
  | 'duplicate-resource'

export interface RestLintConfig {
  // 总开关，关闭后不做任何检测
  enabled: boolean
  // 细粒度规则开关，未列出的规则视为开启
  rules?: Partial<Record<RestLintRule, boolean>>
  // 不参与检测的路径（支持通配符）
  ignore?: string[]
}

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
  // REST 风格检测（仅打印提示，不影响生成结果）
  restLint?: RestLintConfig
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
  // REST 风格检测：只打印提示，不会影响生成结果。
  // 当前项目接口为 RPC 风格，默认关闭以免刷屏；需要时改为 true 即可。
  restLint: {
    enabled: false,
    // 关闭单条规则（未列出的规则视为开启）
    // rules: {
    //   'camel-case-in-uri': false,
    // },
    // 不参与检测的路径（支持通配符）
    // ignore: ['/admin/**'],
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
