import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getConfigApi, type AtdNode } from '@/api/gen/configController'

// 重新导出AtdNode类型
export type { AtdNode }

// 节点切换模式
export type NodeSwitchMode = 'auto' | 'manual'

// 节点状态
export interface NodeStatus {
  url: string
  isOnline: boolean
  lastCheckTime?: number
}

const NODE_MODE_KEY = 'node_switch_mode'
const SELECTED_NODE_KEY = 'selected_node_code'
const NODE_STATUSES_KEY = 'node_statuses'

export const useNodeStore = defineStore('node', () => {
  // 节点切换模式
  const switchMode = ref<NodeSwitchMode>(
    (localStorage.getItem(NODE_MODE_KEY) as NodeSwitchMode) || 'auto'
  )

  // 选中的节点（手动模式下使用）
  const selectedNodeCode = ref<string | null>(
    localStorage.getItem(SELECTED_NODE_KEY)
  )

  // 可用节点列表
  const nodes = ref<AtdNode[]>([])

  // 节点状态缓存
  const nodeStatuses = ref<Map<string, NodeStatus>>(new Map())

  // 当前使用的节点URL
  const currentNodeUrl = ref<string>('')
  const isMainNode = ref<boolean>(true)

  // 初始化节点列表
  const initNodes = async () => {
    try {
      const res = await getConfigApi()
      if (res.data.code === 200 && res.data.data?.workers) {
        const newNodes = res.data.data.workers
        const mainNodeUrl = import.meta.env.VITE_API_URL || '/api'

        // 更新节点列表
        nodes.value = newNodes

        // 根据模式和选中的节点，更新当前节点URL
        if (switchMode.value === 'manual' && selectedNodeCode.value) {
          // 手动模式且已选中节点，使用选中节点的URL
          const selectedNode = newNodes.find(n => n.code === selectedNodeCode.value)
          if (selectedNode?.url) {
            setCurrentNodeInfo(selectedNode.url, false)
          } else {
            // 选中的节点不存在，使用主节点
            setCurrentNodeInfo(mainNodeUrl, true)
          }
        } else if (!currentNodeUrl.value) {
          // 自动模式或未选中节点且当前节点URL为空，使用主节点
          setCurrentNodeInfo(mainNodeUrl, true)
        }

        // 同步节点状态缓存
        const newStatuses = new Map<string, NodeStatus>()
        
        // 保留仍然存在的节点的状态
        for (const node of newNodes) {
          const nodeCode = node.code || ''
          const oldStatus = nodeStatuses.value.get(nodeCode)
          if (oldStatus) {
            // 节点存在，保留状态但更新URL（如果URL有变化）
            newStatuses.set(nodeCode, {
              ...oldStatus,
              url: node.url || oldStatus.url
            })
          } else {
            // 新节点，初始化状态为未知
            newStatuses.set(nodeCode, {
              url: node.url || '',
              isOnline: false,
              lastCheckTime: undefined
            })
          }
        }
        
        // 更新状态缓存
        nodeStatuses.value = newStatuses
        
        // 持久化状态
        localStorage.setItem(
          NODE_STATUSES_KEY,
          JSON.stringify(Array.from(nodeStatuses.value.entries()))
        )

        // 检查当前使用的节点是否还在
        if (!isMainNode.value) {
          // 当前使用备用节点，检查该节点是否还在列表中
          const currentNode = newNodes.find(n => n.url === currentNodeUrl.value)
          if (!currentNode) {
            // 当前使用的节点不存在了
            if (switchMode.value === 'manual') {
              // 手动模式：切换回主节点
              setSelectedNode(null)
              setCurrentNodeInfo(mainNodeUrl, true)
            } else {
              // 自动模式：尝试切换到下一个可用节点
              // 先检查所有节点状态
              await checkAllNodesStatus()
              // 查找第一个在线的节点
              const onlineNode = newNodes.find(node => 
                getNodeStatus(node.code || '')?.isOnline
              )
              if (onlineNode) {
                setSelectedNode(onlineNode.code || null)
                setCurrentNodeInfo(onlineNode.url || '', false)
              } else {
                // 没有在线节点，切换回主节点
                setSelectedNode(null)
                setCurrentNodeInfo(mainNodeUrl, true)
              }
            }
          }
        }

        // 检查当前选中的节点是否还在（额外检查）
        if (selectedNodeCode.value) {
          const nodeExists = newNodes.some(n => n.code === selectedNodeCode.value)
          if (!nodeExists) {
            // 选中的节点不存在了，清除选中状态
            setSelectedNode(null)
          }
        }

        // 异步触发节点状态检查（不阻塞初始化）
        setTimeout(() => {
          checkAllNodesStatus()
        }, 1000)
      }
    } catch (error) {
      console.error('获取节点列表失败:', error)
    }
  }

  // 设置切换模式
  const setSwitchMode = (mode: NodeSwitchMode) => {
    switchMode.value = mode
    localStorage.setItem(NODE_MODE_KEY, mode)
  }

  // 设置选中的节点
  const setSelectedNode = (nodeCode: string | null) => {
    selectedNodeCode.value = nodeCode
    if (nodeCode) {
      localStorage.setItem(SELECTED_NODE_KEY, nodeCode)
    } else {
      localStorage.removeItem(SELECTED_NODE_KEY)
    }
  }

  // 获取当前应该使用的节点URL
  const getCurrentNodeUrl = (defaultUrl: string): string => {
    if (switchMode.value === 'auto') {
      // 自动模式：返回当前使用的节点URL，如果未设置则返回主节点
      return currentNodeUrl.value || defaultUrl
    } else {
      // 手动模式：返回选中的节点URL
      if (selectedNodeCode.value) {
        const node = nodes.value.find(n => n.code === selectedNodeCode.value)
        const url = node?.url || defaultUrl
        // 如果当前节点URL与选中的节点URL不一致，更新它
        if (currentNodeUrl.value !== url) {
          currentNodeUrl.value = url
        }
        return url
      }
      return defaultUrl
    }
  }

  // 设置当前节点信息
  const setCurrentNodeInfo = (url: string, isMain: boolean) => {
    currentNodeUrl.value = url
    isMainNode.value = isMain
  }

  // 更新节点状态
  const updateNodeStatus = (nodeCode: string, status: NodeStatus) => {
    nodeStatuses.value.set(nodeCode, {
      ...status,
      lastCheckTime: Date.now()
    })
    // 持久化状态
    localStorage.setItem(
      NODE_STATUSES_KEY,
      JSON.stringify(Array.from(nodeStatuses.value.entries()))
    )
  }

  // 获取节点状态
  const getNodeStatus = (nodeCode: string): NodeStatus | undefined => {
    return nodeStatuses.value.get(nodeCode)
  }

  // 检查节点是否在线
  const checkNodeOnline = async (node: AtdNode): Promise<boolean> => {
    if (!node.url) return false

    try {
      // 使用一个轻量级的健康检查请求
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      await fetch(`${node.url}/config`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors'
      })

      clearTimeout(timeoutId)
      updateNodeStatus(node.code || '', {
        url: node.url || '',
        isOnline: true
      })
      return true
    } catch (error) {
      updateNodeStatus(node.code || '', {
        url: node.url || '',
        isOnline: false
      })
      return false
    }
  }

  // 检查所有节点状态
  const checkAllNodesStatus = async () => {
    const checkPromises = nodes.value.map(node => checkNodeOnline(node))
    await Promise.all(checkPromises)
  }

  // 获取当前选中的节点对象
  const getSelectedNode = (): AtdNode | undefined => {
    if (!selectedNodeCode.value) return undefined
    return nodes.value.find(n => n.code === selectedNodeCode.value)
  }

  return {
    switchMode,
    selectedNodeCode,
    nodes,
    currentNodeUrl,
    isMainNode,
    initNodes,
    setSwitchMode,
    setSelectedNode,
    getCurrentNodeUrl,
    setCurrentNodeInfo,
    updateNodeStatus,
    getNodeStatus,
    checkNodeOnline,
    checkAllNodesStatus,
    getSelectedNode
  }
})
