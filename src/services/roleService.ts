import { 
  getAdminRoleAllApi,
  getAdminRoleListApi,
  putAdminRoleUpdateApi,
  type RoleInfoVO,
  type RoleQuery,
  type RoleUpdateCmd
} from '@/api/gen/roleAdminController'
import { ElMessage } from 'element-plus'

/**
 * 角色管理 API 服务
 */
export class RoleService {
  /**
   * 获取所有角色（不分页）
   */
  static async getAllRoles(): Promise<RoleInfoVO[] | null> {
    const res = await getAdminRoleAllApi()
    const { data } = res
    
    if (data.code === 200) {
      return data.data || []
    } else {
      ElMessage.error(data.msg || '获取角色列表失败')
      return null
    }
  }

  /**
   * 获取角色列表（分页）
   */
  static async getRoleList(params: RoleQuery): Promise<any | null> {
    const res = await getAdminRoleListApi(params)
    const { data } = res
    
    if (data.code === 200) {
      return data.data || null
    } else {
      ElMessage.error(data.msg || '获取角色列表失败')
      return null
    }
  }

  /**
   * 更新角色信息
   */
  static async updateRole(roleInfo: RoleUpdateCmd): Promise<boolean> {
    const res = await putAdminRoleUpdateApi(roleInfo)
    const { data } = res
    
    if (data.code === 200) {
      return true
    } else {
      ElMessage.error(data.msg || '更新角色信息失败')
      return false
    }
  }


}