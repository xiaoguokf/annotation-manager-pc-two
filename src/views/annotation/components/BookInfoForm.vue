<template>
  <div class="book-info-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" v-loading="loading" :disabled="readonly">
      <el-form-item label="书籍名称" prop="title">
        <el-input v-model="form.title" placeholder="请输入书籍名称" />
      </el-form-item>

      <el-form-item label="学科" prop="subjectId">
        <el-select v-model="form.subjectId" placeholder="请选择学科" style="width: 100%" filterable @change="handleSubjectChange">
          <el-option v-for="item in subjectList.filter(i => i.id)" :key="item.id" :label="item.subjectName" :value="item.id!" />
        </el-select>
      </el-form-item>

      <el-form-item label="学段" prop="phase">
        <el-radio-group v-model="form.phase">
          <el-radio :value="1">小学</el-radio>
          <el-radio :value="2">初中</el-radio>
          <el-radio :value="3">高中</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="册别" prop="volumeId">
        <el-select v-model="form.volumeId" placeholder="请选择册别" style="width: 100%" filterable @change="handleVolumeChange">
          <el-option v-for="item in volumeList.filter(i => i.id)" :key="item.id" :label="item.name" :value="item.id!" />
        </el-select>
      </el-form-item>

      <el-form-item label="版本" prop="bookVersionId">
        <el-select v-model="form.bookVersionId" placeholder="请选择版本" style="width: 100%" filterable @change="handleVersionChange">
          <el-option v-for="item in versionList.filter(i => i.id)" :key="item.id" :label="item.name" :value="item.id!" />
        </el-select>
      </el-form-item>

      <el-form-item label="教辅版本号" prop="supTreeVersion">
        <el-input v-model="form.supTreeVersion" placeholder="请输入教辅版本号（选填）" />
      </el-form-item>

      <el-form-item label="原始学校名称" prop="originSchoolName">
        <el-input v-model="form.originSchoolName" placeholder="请输入原始学校名称（选填）" />
      </el-form-item>

      <el-form-item v-if="!readonly">
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getBookInfoDetailsApi, putBookInfoUpdateApi, type BookUpdateCmd } from '@/api/gen/bookController'
import {
  getDicSubjectListApi,
  getDicVolumeListApi,
  getDicVersionListApi
} from '@/api/gen/dicController'

interface Props {
  bookId: string
  readonly?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits(['refresh'])

const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

const subjectList = ref<{ id?: string; subjectName?: string; docxCode?: number }[]>([])
const volumeList = ref<{ id?: string; name?: string }[]>([])
const versionList = ref<{ id?: string; name?: string }[]>([])

const form = reactive<BookUpdateCmd>({
  title: '',
  subjectId: undefined,
  volumeId: undefined,
  bookVersionId: undefined,
  phase: undefined,
  subjectCode: undefined,
  volume: undefined,
  edition: undefined,
  supTreeVersion: '',
  originSchoolName: ''
})

// 学科选择 → 双写 docx 学科枚举（subjectCode），后端组装器可直接使用
const handleSubjectChange = () => {
  const subject = subjectList.value.find(s => s.id === form.subjectId)
  form.subjectCode = subject?.docxCode ?? undefined
}

// 册别选择 → 双写册次中文（volume），如"上册"
const handleVolumeChange = () => {
  const volume = volumeList.value.find(v => v.id === form.volumeId)
  form.volume = volume?.name ?? undefined
}

// 版本选择 → 双写版本中文（edition），如"人教版"
const handleVersionChange = () => {
  const version = versionList.value.find(v => v.id === form.bookVersionId)
  form.edition = version?.name ?? undefined
}

// 按已选字典 ID 反填派生字段（详情回显 / 重置时调用，兼容存量数据）
const deriveDerivedFields = () => {
  const subject = subjectList.value.find(s => s.id === form.subjectId)
  if (subject && subject.docxCode != null) {
    form.subjectCode = subject.docxCode
  }
  const volume = volumeList.value.find(v => v.id === form.volumeId)
  if (volume && volume.name) {
    form.volume = volume.name
  }
  const version = versionList.value.find(v => v.id === form.bookVersionId)
  if (version && version.name) {
    form.edition = version.name
  }
}

const rules = {
  title: [{ required: true, message: '请输入书籍名称', trigger: 'blur' }],
  subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
  volumeId: [{ required: true, message: '请选择册别', trigger: 'change' }],
  bookVersionId: [{ required: true, message: '请选择版本', trigger: 'change' }],
  phase: [{ required: true, message: '请选择学段', trigger: 'change' }]
}

// 获取字典数据
const fetchDictData = async () => {
  try {
    const [subjectRes, volumeRes, versionRes] = await Promise.all([
      getDicSubjectListApi({ type: 1 }),
      getDicVolumeListApi(),
      getDicVersionListApi()
    ])
    if (subjectRes.data.code === 200) subjectList.value = subjectRes.data.data || []
    if (volumeRes.data.code === 200) volumeList.value = volumeRes.data.data || []
    if (versionRes.data.code === 200) versionList.value = versionRes.data.data || []
  } catch (error) {
    console.error('获取字典数据失败', error)
  }
}

// 获取书籍详情
const fetchBookDetail = async () => {
  loading.value = true
  try {
    const response = await getBookInfoDetailsApi({ id: props.bookId })
    if (response.data.code === 200 && response.data.data) {
      const data = response.data.data
      Object.assign(form, {
        title: data.title,
        subjectId: data.subjectId != null ? String(data.subjectId) : undefined,
        volumeId: data.volumeId != null ? String(data.volumeId) : undefined,
        bookVersionId: data.bookVersionId != null ? String(data.bookVersionId) : undefined,
        phase: data.phase != null ? data.phase : undefined,
        subjectCode: data.subjectCode != null ? data.subjectCode : undefined,
        volume: data.volume || undefined,
        edition: data.edition || undefined,
        supTreeVersion: data.supTreeVersion || '',
        originSchoolName: data.originSchoolName || ''
      })
      // 字典已加载时，按已选字典 ID 反填派生字段（兼容服务端未存 volume/edition/subjectCode 的存量数据）
      deriveDerivedFields()
    }
  } catch (error) {
    ElMessage.error('获取书籍详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        const response = await putBookInfoUpdateApi({ ...form }, { id: props.bookId })
        if (response.data.code === 200) {
          ElMessage.success('保存成功')
          emit('refresh')
        } else {
          ElMessage.error(response.data.msg || '保存失败')
        }
      } catch (error) {
        ElMessage.error('保存失败')
        console.error(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

// 重置
const handleReset = () => {
  fetchBookDetail()
}

watch(() => props.bookId, (newVal) => {
  if (newVal && newVal !== 'undefined') {
    fetchBookDetail()
  }
})

onMounted(() => {
  fetchDictData()
  fetchBookDetail()
})
</script>
