<template>
  <el-dialog
    v-model="dialogVisible"
    title="解析设置"
    width="600px"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
  >
    <el-form :model="form" label-width="120px">
      <!-- OCR模型选择 -->
      <el-form-item label="OCR模型">
        <div class="w-full">
          <el-select
            v-model="form.selectedModelId"
            placeholder="请选择模型"
            clearable
            class="w-full"
            :loading="loadingModels"
            @focus="loadModels"
          >
            <el-option
              v-for="model in modelList"
              :key="model.id"
              :label="model.name || model.id"
              :value="model.id"
            >
              <div class="flex items-center justify-between">
                <span>{{ model.name || model.id }}</span>
                <el-tag v-if="model.isDefault" type="success" size="small">默认</el-tag>
              </div>
            </el-option>
          </el-select>
          <!-- 模型描述显示 -->
          <div class="mt-1">
            <span v-if="isSelectedModelDefault" class="text-xs text-green-500 mr-2">默认</span>
            <span class="text-xs text-gray-500">{{ selectedModelDescription }}</span>
          </div>
        </div>
      </el-form-item>

      <!-- 自动智能封装 -->
      <el-form-item label="自动智能封装">
        <el-tooltip
          content="当题目page字段为空时，自动将标注信息拼接成题目内容"
          placement="top"
        >
          <el-switch v-model="form.autoParse" />
        </el-tooltip>
      </el-form-item>

      <!-- 自动去除题号 -->
      <el-form-item label="自动去除题号">
        <el-tooltip
          content="去除题目、选项、解析、答案中的题号，如'4.计算1+1=？'去掉'4.'"
          placement="top"
        >
          <el-switch v-model="form.autoRemoveQuestionNum" />
        </el-tooltip>
      </el-form-item>

      <!-- 补题模式 -->
      <el-form-item label="补题模式">
        <el-tooltip
          content="用于补充答案和解析（题目内容不更新），保存答案、解析、选项时自动包裹 supplement 标记"
          placement="top"
        >
          <el-switch v-model="form.supplementMode" />
        </el-tooltip>
      </el-form-item>
    </el-form>

    <!-- 智能封装规则说明 -->
    <div class="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
      <div class="flex items-center text-sm text-blue-700">
        <Icon icon="ep:info-filled" class="mr-2" />
        <span class="font-medium">智能封装规则：</span>
      </div>
      <ul class="text-sm text-gray-600 mt-2 ml-6 list-disc">
        <li>题干、题干图按顺序拼接成题目标题</li>
        <li>选项：若只有一个选项，该内容应包含四个选项，按换行解析；若有四个选项则一对一对应</li>
        <li>解析、解析图按顺序拼接成解析内容</li>
        <li>答案、答案图按顺序拼接成答案内容</li>
      </ul>
    </div>

    <!-- 自动去除题号规则说明 -->
    <div class="mt-4 p-4 bg-green-50 rounded border border-green-200">
      <div class="flex items-center text-sm text-green-700">
        <Icon icon="ep:info-filled" class="mr-2" />
        <span class="font-medium">自动去除题号规则：</span>
      </div>
      <ul class="text-sm text-gray-600 mt-2 ml-6 list-disc">
        <li>去除题目、选项、解析、答案中的题号</li>
        <li>例如："4.计算1+1=？" 去掉 "4." 后变为 "计算1+1=？"</li>
        <li>支持中文大题号，例如："一、选择题" 去掉 "一、" 后变为 "选择题"</li>
        <li>支持大题号连着小题号，例如："一、1.题目内容" 去掉 "一、1." 后变为 "题目内容"</li>
      </ul>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button @click="handleReset">恢复默认</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useParseSettingsStore } from '@/stores/parseSettings'
import { getModelListApi, type ModelVO } from '@/api/gen/modelController'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'model-changed': [model: ModelVO | null]
}>()

const parseSettingsStore = useParseSettingsStore()

const dialogVisible = ref(false)
const form = ref({
  autoParse: true,
  autoRemoveQuestionNum: true,
  supplementMode: false,
  selectedModelId: null as string | null
})

// 模型列表
const modelList = ref<ModelVO[]>([])
const loadingModels = ref(false)

// 默认模型ID
const defaultModelId = ref<string | null>(null)

// 当前选中模型的描述
const selectedModelDescription = computed(() => {
  const model = modelList.value.find(m => m.id === form.value.selectedModelId)
  return model?.description || ''
})

// 当前选中模型是否是默认模型
const isSelectedModelDefault = computed(() => {
  const model = modelList.value.find(m => m.id === form.value.selectedModelId)
  return model?.isDefault || false
})

// 加载模型列表
const loadModels = async () => {
  if (modelList.value.length > 0) {
    return // 已有数据，不需要重复加载
  }

  loadingModels.value = true
  try {
    const res = await getModelListApi()
    if (res.data.code === 200 && res.data.data) {
      modelList.value = res.data.data
      console.log('[ParseSettings] 模型列表加载成功:', modelList.value)

      // 找出默认模型
      const defaultModel = modelList.value.find(m => m.isDefault)
      if (defaultModel) {
        defaultModelId.value = defaultModel.id
        console.log('[ParseSettings] 默认模型ID:', defaultModelId.value)
      }

      // 打印每个模型的详细信息
      console.log('[ParseSettings] 模型详情:', JSON.stringify(modelList.value, null, 2))

      // 设置默认选中：优先使用用户保存的选择，否则使用默认模型
      const savedModelId = parseSettingsStore.getSelectedModelId()
      if (savedModelId && modelList.value.some(m => m.id === savedModelId)) {
        form.value.selectedModelId = savedModelId
      } else if (defaultModel) {
        form.value.selectedModelId = defaultModel.id
      }
      console.log('[ParseSettings] 当前选中模型:', form.value.selectedModelId)
    }
  } catch (error) {
    console.error('[ParseSettings] 加载模型列表失败:', error)
    ElMessage.error('加载模型列表失败')
  } finally {
    loadingModels.value = false
  }
}

// 监听 visible 变化
watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    // 加载当前设置
    form.value = {
      autoParse: parseSettingsStore.getAutoParse(),
      autoRemoveQuestionNum: parseSettingsStore.getAutoRemoveQuestionNum(),
      supplementMode: parseSettingsStore.getSupplementMode(),
      selectedModelId: parseSettingsStore.getSelectedModelId()
    }
    // 清空模型列表，以便重新加载
    modelList.value = []
    defaultModelId.value = null
    // 打开对话框时立即加载模型列表
    loadModels()
  }
})

// 监听 dialogVisible 变化
watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

// 判断设置是否有修改
const hasChanges = () => {
  const savedModelId = parseSettingsStore.getSelectedModelId()
  const formModelId = form.value.selectedModelId && form.value.selectedModelId !== defaultModelId.value
    ? form.value.selectedModelId
    : null
  return (
    form.value.autoParse !== parseSettingsStore.getAutoParse()
    || form.value.autoRemoveQuestionNum !== parseSettingsStore.getAutoRemoveQuestionNum()
    || form.value.supplementMode !== parseSettingsStore.getSupplementMode()
    || formModelId !== savedModelId
  )
}

// 执行保存
const doSave = () => {
  parseSettingsStore.setAutoParse(form.value.autoParse)
  parseSettingsStore.setAutoRemoveQuestionNum(form.value.autoRemoveQuestionNum)
  parseSettingsStore.setSupplementMode(form.value.supplementMode)

  // 只有当选择的模型不是默认模型时才永久保存，否则清空选择（使用默认模型）
  if (form.value.selectedModelId && form.value.selectedModelId !== defaultModelId.value) {
    parseSettingsStore.setSelectedModelId(form.value.selectedModelId)
  } else {
    // 选中默认模型或未选择时，清空保存的值
    parseSettingsStore.setSelectedModelId(null)
  }

  // 触发模型变更事件
  const selectedModel = modelList.value.find(m => m.id === form.value.selectedModelId)
  emit('model-changed', selectedModel || null)
}

// 关闭前确认：有修改时询问用户是否保存
const confirmAndClose = (done: () => void) => {
  if (!hasChanges()) {
    done()
    return
  }
  ElMessageBox.confirm('设置已修改，是否保存修改？', '提示', {
    confirmButtonText: '保存',
    cancelButtonText: '不保存',
    distinguishCancelAndClose: true,
    type: 'warning'
  })
    .then(() => {
      // 用户选择保存
      doSave()
      ElMessage.success('保存成功')
      done()
    })
    .catch((action: string) => {
      // action === 'cancel'：用户选择不保存，直接关闭
      // action === 'close'：用户关闭了提示框，留在当前对话框
      if (action === 'cancel') {
        done()
      }
    })
}

// 点击右上角 X、ESC 等关闭时触发
const handleBeforeClose = (done: () => void) => {
  confirmAndClose(done)
}

// 保存设置
const handleSave = () => {
  doSave()
  ElMessage.success('保存成功')
  dialogVisible.value = false
}

// 取消按钮：有修改时同样询问是否保存
const handleClose = () => {
  confirmAndClose(() => {
    dialogVisible.value = false
  })
}

// 恢复默认设置
const handleReset = () => {
  // 清除 localStorage 中的存储
  parseSettingsStore.setAutoParse(true)
  parseSettingsStore.setAutoRemoveQuestionNum(true)
  parseSettingsStore.setSupplementMode(false)
  parseSettingsStore.setSelectedModelId(null)

  // 更新表单
  form.value.autoParse = true
  form.value.autoRemoveQuestionNum = true
  form.value.supplementMode = false
  form.value.selectedModelId = defaultModelId.value
  ElMessage.success('已恢复默认设置')
}
</script>
