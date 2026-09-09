/**
 * 项目状态常量定义
 * 根据书籍项目状态流转说明 v3.0 定义
 */

// 项目状态枚举
export const ProjectStatus = {
  UNPARSED: 0,                    // 未解析
  PENDING_PUBLISH: 1,             // 待发布
  PENDING_CLAIM: 2,               // 待领取
  CLAIMED: 3,                     // 已领取
  PENDING_REVIEW: 4,              // 待审核
  REVIEW_FAILED: 5,               // 审核失败
  REVIEW_SUCCESS: 6,              // 审核成功
  RETURNED: 7,                    // 已回传
  PARSING: 8,                     // 解析中
  PARSE_FAILED: 9,                // 解析失败
  PROBLEM_SUBMITTED: 10,          // 问题提交
  RETURN_FAILED: 11,              // 回传失败
  ADMIN_REJECTED: 12,             // 管理员打回
  RETURNING: 13,                  // 回传中
  MATERIAL_PENDING_REVIEW: 14,    // 待资料审核
  MATERIAL_REVIEW_FAILED: 15,     // 资料审核失败
  MATERIAL_REVIEW_SUCCESS: 16,    // 资料审核通过
  DOING: 17,                      // 做题中
  ADMIN_MATERIAL_REJECTED: 18,    // 管理员资料打回
  MATERIAL_PROBLEM_SUBMITTED: 19, // 资料问题提交
} as const

// 项目状态文本映射
export const ProjectStatusText: Record<number, string> = {
  0: '未解析',
  1: '待发布',
  2: '待领取',
  3: '已领取',
  4: '待审核',
  5: '审核失败',
  6: '审核成功',
  7: '已回传',
  8: '解析中',
  9: '解析失败',
  10: '问题提交',
  11: '回传失败',
  12: '管理员打回',
  13: '回传中',
  14: '待资料审核',
  15: '资料审核失败',
  16: '资料审核通过',
  17: '做题中',
  18: '管理员资料打回',
  19: '资料问题提交',
}

// 项目状态颜色配置 - 返回 el-tag 的 type 或自定义 color
export interface StatusColorConfig {
  type?: 'primary' | 'success' | 'warning' | 'info' | 'danger'
  color?: string
}

export function getProjectStatusColor(status: number): StatusColorConfig {
  switch (status) {
    case ProjectStatus.UNPARSED:
      return { type: 'info' }
    case ProjectStatus.PENDING_PUBLISH:
      return { type: 'warning' }
    case ProjectStatus.PENDING_CLAIM:
      return { type: 'warning' }
    case ProjectStatus.CLAIMED:
      return { type: 'primary' }
    case ProjectStatus.PENDING_REVIEW:
      return { type: 'primary' }
    case ProjectStatus.REVIEW_FAILED:
      return { type: 'danger' }
    case ProjectStatus.REVIEW_SUCCESS:
      return { type: 'success' }
    case ProjectStatus.RETURNED:
      return { type: 'success' }
    case ProjectStatus.PARSING:
      return { type: 'primary' }
    case ProjectStatus.PARSE_FAILED:
      return { type: 'danger' }
    case ProjectStatus.PROBLEM_SUBMITTED:
      return { type: 'warning' }
    case ProjectStatus.RETURN_FAILED:
      return { type: 'danger' }
    case ProjectStatus.ADMIN_REJECTED:
      return { type: 'danger' }
    case ProjectStatus.RETURNING:
      return { type: 'primary' }
    // 资料审核相关状态 - 使用自定义颜色
    case ProjectStatus.MATERIAL_PENDING_REVIEW:
      return { color: '#7C4DFF' }   // 紫色 - 待资料审核
    case ProjectStatus.MATERIAL_REVIEW_FAILED:
      return { color: '#E65100' }    // 深橙色 - 资料审核失败
    case ProjectStatus.MATERIAL_REVIEW_SUCCESS:
      return { color: '#00897B' }    // 青色 - 资料审核通过
    case ProjectStatus.DOING:
      return { color: '#1565C0' }    // 深蓝色 - 做题中
    case ProjectStatus.ADMIN_MATERIAL_REJECTED:
      return { type: 'danger' }      // 管理员资料打回
    case ProjectStatus.MATERIAL_PROBLEM_SUBMITTED:
      return { color: '#D32F2F' }    // 红色 - 资料问题提交
    default:
      return { type: 'info' }
  }
}

// 用户项目状态枚举（atd_project_user.status）
export const TaskStatus = {
  CLAIMED: 1,                    // 已领取
  SUBMITTED: 2,                  // 已提交(审核中)
  INCOMPLETE_SUBMIT: 3,          // 中途提交
  REVIEW_FAILED: 4,              // 审核失败
  REVIEW_PASSED: 5,              // 审核通过
  PROBLEM_SUBMITTED: 6,          // 问题提交
  ADMIN_RECLAIMED: 7,            // 管理员回收
  MATERIAL_SUBMITTED: 8,         // 资料待审核
  DOING: 9,                      // 做题中
  MATERIAL_REVIEW_FAILED: 10,    // 资料审核失败
} as const

// 用户项目状态文本映射
export const TaskStatusText: Record<number, string> = {
  1: '已领取',
  2: '审核中',
  3: '中途提交',
  4: '审核失败',
  5: '审核通过',
  6: '问题提交',
  7: '管理员回收',
  8: '资料待审核',
  9: '做题中',
  10: '资料审核失败',
}

// 用户项目状态颜色配置
export function getTaskStatusColor(taskStatus: number): StatusColorConfig {
  switch (taskStatus) {
    case TaskStatus.CLAIMED:
      return { type: 'primary' }
    case TaskStatus.SUBMITTED:
      return { type: 'info' }
    case TaskStatus.INCOMPLETE_SUBMIT:
      return { type: 'warning' }
    case TaskStatus.REVIEW_FAILED:
      return { type: 'danger' }
    case TaskStatus.REVIEW_PASSED:
      return { type: 'success' }
    case TaskStatus.PROBLEM_SUBMITTED:
      return { type: 'warning' }
    case TaskStatus.ADMIN_RECLAIMED:
      return { type: 'danger' }
    case TaskStatus.MATERIAL_SUBMITTED:
      return { color: '#7C4DFF' }    // 紫色 - 资料已提交
    case TaskStatus.DOING:
      return { color: '#1565C0' }    // 深蓝色 - 做题中
    case TaskStatus.MATERIAL_REVIEW_FAILED:
      return { color: '#E65100' }    // 深橙色 - 资料审核失败
    default:
      return { type: 'info' }
  }
}

// 问题类型映射
export const ProblemTypeOptions = [
  { label: '无答案', value: 'no_answer' },
  { label: '缺页', value: 'missing_page' },
  { label: '整本无题', value: 'no_questions' },
  { label: '听力相关', value: 'listening' },
  { label: '其他', value: 'other' },
] as const

export const ProblemTypeText: Record<string, string> = {
  no_answer: '无答案',
  missing_page: '缺页',
  no_questions: '整本无题',
  listening: '听力相关',
  other: '其他',
}
