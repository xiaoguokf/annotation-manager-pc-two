import {
  getAdminAnnouncementListApi,
  postAdminAnnouncementApi,
  putAdminAnnouncementApi,
  type AnnouncementQuery,
  type AnnouncementSaveCmd,
  type AnnouncementVO,
  type PageVOAnnouncementVO,
  type ResultAnnouncementVO,
  type ResultVoid
} from '@/api/gen/announcementAdminController'
import { getAnnouncementListApi, type PageQuery } from '@/api/gen/announcementController'
import http from '@/utils/http'
import { ElMessage } from 'element-plus'

/**
 * 公告管理 API 服务
 *
 * 说明：生成器中带路径参数 {id} 的接口（详情/删除/状态切换/批量删除）
 * 未正确接收 id，直接使用 http 实例拼接路径以保证可用。
 */
export class AnnouncementService {
  /**
   * 分页查询公告列表
   */
  static async getAnnouncementList(params: AnnouncementQuery): Promise<PageVOAnnouncementVO | null> {
    const res = await getAdminAnnouncementListApi(params)
    const { data } = res

    if (data.code === 200) {
      return data.data || null
    } else {
      ElMessage.error(data.msg || '获取公告列表失败')
      return null
    }
  }

  /**
   * 新增公告
   */
  static async createAnnouncement(data: AnnouncementSaveCmd): Promise<boolean> {
    const res = await postAdminAnnouncementApi(data)
    const { data: d } = res

    if (d.code === 200) {
      return true
    } else {
      ElMessage.error(d.msg || '新增公告失败')
      return false
    }
  }

  /**
   * 修改公告
   */
  static async updateAnnouncement(data: AnnouncementSaveCmd): Promise<boolean> {
    const res = await putAdminAnnouncementApi(data)
    const { data: d } = res

    if (d.code === 200) {
      return true
    } else {
      ElMessage.error(d.msg || '更新公告失败')
      return false
    }
  }

  /**
   * 根据 ID 获取公告详情
   */
  static async getAnnouncementDetail(id: string): Promise<AnnouncementVO | null> {
    const res = await http.get<ResultAnnouncementVO>(`/admin/announcement/${id}`)
    const { data } = res

    if (data.code === 200) {
      return data.data || null
    } else {
      ElMessage.error(data.msg || '获取公告详情失败')
      return null
    }
  }

  /**
   * 删除公告
   */
  static async deleteAnnouncement(id: string): Promise<boolean> {
    const res = await http.delete<ResultVoid>(`/admin/announcement/${id}`)
    const { data } = res

    if (data.code === 200) {
      return true
    } else {
      ElMessage.error(data.msg || '删除公告失败')
      return false
    }
  }

  /**
   * 切换公告状态（启用/禁用）
   */
  static async toggleAnnouncementStatus(id: string): Promise<boolean> {
    const res = await http.put<ResultVoid>(`/admin/announcement/${id}/status`, null)
    const { data } = res

    if (data.code === 200) {
      return true
    } else {
      ElMessage.error(data.msg || '切换公告状态失败')
      return false
    }
  }

  /**
   * 批量删除公告
   */
  static async batchDeleteAnnouncement(ids: string[]): Promise<boolean> {
    const res = await http.delete<ResultVoid>('/admin/announcement/batch', { data: ids })
    const { data } = res

    if (data.code === 200) {
      return true
    } else {
      ElMessage.error(data.msg || '批量删除公告失败')
      return false
    }
  }

  /**
   * 获取启用的公告列表（前台展示，无需管理员权限）
   */
  static async getUserAnnouncementList(params: PageQuery): Promise<PageVOAnnouncementVO | null> {
    const res = await getAnnouncementListApi(params)
    const { data } = res

    if (data.code === 200) {
      return data.data || null
    } else {
      ElMessage.error(data.msg || '获取公告列表失败')
      return null
    }
  }

  /**
   * 获取公告详情（前台展示，路径参数需手动拼接）
   */
  static async getUserAnnouncementDetail(id: string): Promise<AnnouncementVO | null> {
    const res = await http.get<ResultAnnouncementVO>(`/announcement/${id}`)
    const { data } = res

    if (data.code === 200) {
      return data.data || null
    } else {
      ElMessage.error(data.msg || '获取公告详情失败')
      return null
    }
  }
}
