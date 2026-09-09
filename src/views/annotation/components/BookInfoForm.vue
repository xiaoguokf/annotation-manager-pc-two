<template>
  <div class="book-info-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" v-loading="loading" :disabled="readonly">
      <el-form-item label="书籍名称" prop="title">
        <el-input v-model="form.title" placeholder="请输入书籍名称" />
      </el-form-item>

      <el-form-item label="ISBN" prop="isbn">
        <el-input v-model="form.isbn" placeholder="请输入ISBN（13位）" maxlength="13" @input="form.isbn = (form.isbn ?? '').replace(/\D/g, '')" />
      </el-form-item>

      <el-form-item label="丛书名" prop="seriesTitle">
        <el-input v-model="form.seriesTitle" placeholder="请输入丛书名" />
      </el-form-item>

      <el-form-item label="出版年份" prop="year">
        <el-input-number v-model="form.year" :min="1900" :max="2100" controls-position="right" />
      </el-form-item>

      <el-form-item label="年级" prop="gradeId">
        <el-select v-model="form.gradeId" placeholder="请选择年级" style="width: 100%" filterable>
          <el-option v-for="item in gradeList.filter(i => i.id)" :key="item.id" :label="item.gradeName" :value="item.id!" />
        </el-select>
      </el-form-item>

      <el-form-item label="学科" prop="subjectId">
        <el-select v-model="form.subjectId" placeholder="请选择学科" style="width: 100%" filterable>
          <el-option v-for="item in subjectList.filter(i => i.id)" :key="item.id" :label="item.subjectName" :value="item.id!" />
        </el-select>
      </el-form-item>

      <el-form-item label="册别" prop="volumeId">
        <el-select v-model="form.volumeId" placeholder="请选择册别" style="width: 100%" filterable>
          <el-option v-for="item in volumeList.filter(i => i.id)" :key="item.id" :label="item.name" :value="item.id!" />
        </el-select>
      </el-form-item>

      <el-form-item label="版本" prop="bookVersionId">
        <el-select v-model="form.bookVersionId" placeholder="请选择版本" style="width: 100%" filterable>
          <el-option v-for="item in versionList.filter(i => i.id)" :key="item.id" :label="item.name" :value="item.id!" />
        </el-select>
      </el-form-item>

      <el-form-item label="出版社" prop="publisherId">
        <el-select v-model="form.publisherId" placeholder="请选择出版社" style="width: 100%" filterable>
          <el-option v-for="item in publisherList.filter(i => i.id)" :key="item.id" :label="item.name" :value="item.id!" />
        </el-select>
      </el-form-item>

      <el-form-item label="定价" prop="price">
        <el-input-number v-model="form.price" :min="0" :precision="2" :step="0.01" controls-position="right" placeholder="请输入定价" />
      </el-form-item>

      <el-form-item label="教辅内容标签" prop="bookLabelId">
        <el-select v-model="form.bookLabelId" placeholder="请选择教辅内容标签" style="width: 100%" filterable clearable>
          <el-option
            v-for="item in bookLabelList.filter(i => i.id)"
            :key="item.id"
            :label="item.name"
            :value="String(item.id)"
          >
            <span class="option-name">{{ item.name }}</span>
            <span v-if="item.remark" class="option-remark">{{ item.remark }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="是否有专版" prop="hasSpecialVersion">
        <el-radio-group v-model="form.hasSpecialVersion">
          <el-radio :value="1">是</el-radio>
          <el-radio :value="0">否</el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="form.hasSpecialVersion === 1">
        <el-form-item label="专版省份" prop="provinceId">
          <el-select v-model="form.provinceId" placeholder="请选择省份" style="width: 100%" filterable multiple>
            <el-option v-for="item in provinceList.filter(item => item.level === 1 && item.id)" :key="item.id" :label="item.name"
              :value="item.id!" />
          </el-select>
        </el-form-item>

        <el-form-item label="专版城市" prop="cityId">
          <el-select v-model="form.cityId" placeholder="请选择城市" style="width: 100%" :disabled="!form.provinceId || form.provinceId.length === 0"
            filterable multiple>
            <el-option v-for="item in cityList.filter(i => i.id)" :key="item.id" :label="item.name" :value="item.id!" />
          </el-select>
        </el-form-item>
      </template>

      <el-form-item v-if="!readonly">
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getBookInfoDetailsApi, putBookInfoUpdateApi, type BookUpdateCmd } from '@/api/gen/bookController'
import {
  getDicGradeListApi,
  getDicSubjectListApi,
  getDicVolumeListApi,
  getDicVersionListApi,
  getDicPublisherListApi,
  getDicAdministrativeDivisionListApi,
  getDicBookLabelListApi,
  type DicBookLabelVO
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

const currentYear = new Date().getFullYear()

const gradeList = ref<{ id?: string; gradeName?: string }[]>([])
const subjectList = ref<{ id?: string; subjectName?: string }[]>([])
const volumeList = ref<{ id?: string; name?: string }[]>([])
const versionList = ref<{ id?: string; name?: string }[]>([])
const publisherList = ref<{ id?: string; name?: string }[]>([])
const provinceList = ref<{ id?: string; name?: string; code?: string; level?: number; parentCode?: string }[]>([])
const bookLabelList = ref<DicBookLabelVO[]>([])

const form = reactive<Omit<BookUpdateCmd, 'provinceId' | 'cityId'> & { provinceId: string[]; cityId: string[] }>({
  title: '',
  isbn: '',
  seriesTitle: '',
  year: currentYear,
  gradeId: undefined,
  subjectId: undefined,
  volumeId: undefined,
  bookVersionId: undefined,
  publisherId: undefined,
  price: undefined,
  bookLabelId: undefined,
  hasSpecialVersion: 0,
  provinceId: [],
  cityId: []
})

const cityList = computed(() => {
  if (!form.provinceId || form.provinceId.length === 0) return []
  const provinceCodes = form.provinceId
    .map(provinceId => provinceList.value.find(p => p.id === provinceId))
    .filter(p => p)
    .map(p => p!.code)
  return provinceList.value.filter(item => provinceCodes.includes(item.parentCode!))
})

const rules = {
  title: [{ required: true, message: '请输入书籍名称', trigger: 'blur' }],
  seriesTitle: [{ required: true, message: '请输入丛书名', trigger: 'blur' }],
  isbn: [
    { required: true, message: '请输入ISBN', trigger: 'blur' },
    { pattern: /^\d{13}$/, message: 'ISBN必须是13位数字', trigger: 'blur' }
  ],
  year: [
    { required: true, message: '请输入出版年份', trigger: 'blur' },
    { pattern: /^\d{4}$/, message: '出版年份必须是4位数字', trigger: 'blur' }
  ],
  gradeId: [{ required: true, message: '请选择年级', trigger: 'change' }],
  subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
  volumeId: [{ required: true, message: '请选择册别', trigger: 'change' }],
  bookVersionId: [{ required: true, message: '请选择版本', trigger: 'change' }],
  publisherId: [{ required: true, message: '请选择出版社', trigger: 'change' }],
  hasSpecialVersion: [{ required: true, message: '请选择是否有专版', trigger: 'change' }],
  provinceId: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (form.hasSpecialVersion === 1 && (!value || value.length === 0) && (!form.cityId || form.cityId.length === 0)) {
          callback(new Error('专版省份和城市至少提供一个'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  cityId: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (form.hasSpecialVersion === 1 && (!value || value.length === 0) && (!form.provinceId || form.provinceId.length === 0)) {
          callback(new Error('专版省份和城市至少提供一个'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 获取字典数据
const fetchDictData = async () => {
  try {
    const [gradeRes, subjectRes, volumeRes, versionRes, publisherRes, provinceRes, bookLabelRes] = await Promise.all([
      getDicGradeListApi(),
      getDicSubjectListApi({ type: 1 }),
      getDicVolumeListApi(),
      getDicVersionListApi(),
      getDicPublisherListApi(),
      getDicAdministrativeDivisionListApi(),
      getDicBookLabelListApi()
    ])
    if (gradeRes.data.code === 200) gradeList.value = gradeRes.data.data || []
    if (subjectRes.data.code === 200) subjectList.value = subjectRes.data.data || []
    if (volumeRes.data.code === 200) volumeList.value = volumeRes.data.data || []
    if (versionRes.data.code === 200) versionList.value = versionRes.data.data || []
    if (publisherRes.data.code === 200) publisherList.value = publisherRes.data.data || []
    if (provinceRes.data.code === 200) provinceList.value = provinceRes.data.data || []
    if (bookLabelRes.data.code === 200) bookLabelList.value = bookLabelRes.data.data || []
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
        isbn: data.isbn,
        seriesTitle: data.seriesTitle,
        year: data.year,
        gradeId: data.gradeId != null ? String(data.gradeId) : undefined,
        subjectId: data.subjectId != null ? String(data.subjectId) : undefined,
        volumeId: data.volumeId != null ? String(data.volumeId) : undefined,
        bookVersionId: data.bookVersionId != null ? String(data.bookVersionId) : undefined,
        publisherId: data.publisherId != null ? String(data.publisherId) : undefined,
        price: data.price,
        bookLabelId: data.bookLabelId != null ? String(data.bookLabelId) : undefined,
        hasSpecialVersion: data.hasSpecialVersion || 0,
        provinceId: data.provinceId ? data.provinceId.split(',').filter(id => id) : [],
        cityId: data.cityId ? data.cityId.split(',').filter(id => id) : []
      })
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
        const finalProvinceIds: string[] = [...form.provinceId]
        const finalCityIds: string[] = [...form.cityId]

        if (form.hasSpecialVersion === 1) {
          // 只提供市：自动填补市所在的省
          if (finalCityIds.length > 0 && finalProvinceIds.length === 0) {
            const cityItems = provinceList.value.filter(item => finalCityIds.includes(item.id!))
            const provinceCodes = [...new Set(cityItems.map(city => city.parentCode ?? ''))]
            const provinces = provinceList.value.filter(item => provinceCodes.includes(item.code ?? '') && item.level === 1)
            finalProvinceIds.push(...provinces.map(p => p.id!))
          }

          // 既提供省，又提供市：过滤掉没有对应城市的省份
          if (finalProvinceIds.length > 0 && finalCityIds.length > 0) {
            const cityItems = provinceList.value.filter(item => finalCityIds.includes(item.id!))
            const usedProvinceCodes = [...new Set(cityItems.map(city => city.parentCode ?? ''))]
            const usedProvinces = provinceList.value.filter(item => usedProvinceCodes.includes(item.code ?? '') && item.level === 1)
            const filteredProvinceIds = usedProvinces.map(p => p.id!)
            const removedProvinceIds = finalProvinceIds.filter(id => !filteredProvinceIds.includes(id))

            if (removedProvinceIds.length > 0) {
              const removedProvinceNames = removedProvinceIds
                .map(id => provinceList.value.find(p => p.id === id)?.name)
                .filter(name => name)
                .join('、')
              ElMessage.warning(`已过滤掉没有对应城市选择的省份：${removedProvinceNames}`)
            }

            finalProvinceIds.splice(0, finalProvinceIds.length, ...filteredProvinceIds)
            // 更新表单中的省份选项
            form.provinceId = [...finalProvinceIds]
          }

          // 只提供省：市为当前省的所有市
          if (finalProvinceIds.length > 0 && finalCityIds.length === 0) {
            const provinceCodes = finalProvinceIds
              .map(id => provinceList.value.find(p => p.id === id))
              .filter(p => p)
              .map(p => p!.code)
            const cities = provinceList.value
              .filter(item => provinceCodes.includes(item.parentCode!) && item.level === 2)
              .map(c => c.id!)
            finalCityIds.push(...cities)
          }
        }

        // 将省份和城市数组转换为逗号分隔的字符串
        const submitData = {
          ...form,
          provinceId: finalProvinceIds.join(','),
          cityId: finalCityIds.join(',')
        }
        const response = await putBookInfoUpdateApi(submitData, { id: props.bookId })
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

defineExpose({
  getIsbn: () => form.isbn || ''
})
</script>

<style scoped>
.option-name {
  flex: 1;
}

.option-remark {
  color: #909399;
  margin-left: 8px;
}
</style>
