import { 
  getAdminUserListApi, 
  postAdminUserAddApi, 
  putAdminUserUpdateInfoApi, 
  putAdminUserDisableApi, 
  putAdminUserChangePasswordApi, 
  putAdminUserAssignRoleApi, 
  deleteAdminUserApi,
  type UserQuery,
  type UserInfoUpdateCmd,
  type ChangePwdCmd,
  type UserRoleAssignCmd,
  type PageVOUserInfoVO
} from '@/api/gen/userAdminController'

// 自定义用户添加命令接口
interface CustomUserAddCmd {
  username: string
  password?: string
  nickname?: string
  enable: boolean
  remark?: string
}
import { ElMessage } from 'element-plus'

/**
 * 用户管理 API 服务
 */
export class UserService {
  /**
   * 获取用户列表
   */
  static async getUserList(params: UserQuery): Promise<PageVOUserInfoVO | null> {
    const res = await getAdminUserListApi(params)
    const { data } = res
    
    if (data.code === 200) {
      // 调试信息：打印实际返回的数据结构
      console.log('用户列表数据:', data.data)
      return data.data || null
    } else {
      ElMessage.error(data.msg || '获取用户列表失败')
      return null
    }
  }

  /**
   * 添加用户
   */
  static async addUser(userData: CustomUserAddCmd): Promise<boolean> {
    const res = await postAdminUserAddApi(userData as any)
    const { data } = res
    
    if (data.code === 200) {
      return true
    } else {
      ElMessage.error(data.msg || '添加用户失败')
      return false
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUser(userInfo: UserInfoUpdateCmd): Promise<boolean> {
    const res = await putAdminUserUpdateInfoApi(userInfo)
    const { data } = res
    
    if (data.code === 200) {
      return true
    } else {
      ElMessage.error(data.msg || '更新用户信息失败')
      return false
    }
  }

  /**
   * 启用/禁用用户
   */
  static async toggleUserStatus(userId: string, enable: boolean): Promise<boolean> {
    const res = await putAdminUserDisableApi({ id: userId, enable })
    const { data } = res

    if (data.code === 200) {
      return true
    } else {
      ElMessage.error(data.msg || '更新用户状态失败')
      return false
    }
  }

  /**
   * 修改用户密码
   */
  static async changeUserPassword(pwdInfo: ChangePwdCmd): Promise<boolean> {
    const res = await putAdminUserChangePasswordApi(pwdInfo)
    const { data } = res

    if (data.code === 200) {
      return true
    } else {
      ElMessage.error(data.msg || '修改用户密码失败')
      return false
    }
  }

  /**
   * 分配用户角色
   */
  static async assignUserRole(assignInfo: UserRoleAssignCmd): Promise<boolean> {
    const res = await putAdminUserAssignRoleApi(assignInfo)
    const { data } = res

    if (data.code === 200) {
      return true
    } else {
      ElMessage.error(data.msg || '分配用户角色失败')
      return false
    }
  }

  /**
   * 删除用户
   */
  static async deleteUsers(userIds: string[]): Promise<boolean> {
    const res = await deleteAdminUserApi({ id: userIds as any })
    const { data } = res

    if (data.code === 200) {
      return true
    } else {
      ElMessage.error(data.msg || '删除用户失败')
      return false
    }
  }
}