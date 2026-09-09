<template>
  <div class="doc-info-form">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" v-loading="loading" :disabled="readonly">
      <el-form-item label="试卷名称" prop="title">
        <el-input v-model="form.title" placeholder="请输入试卷名称" />
      </el-form-item>

      <el-form-item label="学段" prop="stepId">
        <el-select v-model="form.stepId" placeholder="请选择学段" style="width: 100%">
          <el-option label="小学" value="1" />
          <el-option label="初中" value="2" />
          <el-option label="高中" value="3" />
        </el-select>
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

      <el-form-item label="所属省/市" prop="provinceId">
        <el-select v-model="form.provinceId" placeholder="请选择省份" style="width: 100%" filterable>
          <el-option v-for="item in provinceList.filter(item => item.level === 1 && item.id)" :key="item.id" :label="item.name"
            :value="item.id!" />
        </el-select>
      </el-form-item>

      <el-form-item label="所属市/区" prop="cityDistrict">
        <el-cascader
          v-model="form.cityDistrict"
          :options="cityCascaderOptions"
          :props="{ checkStrictly: true, emitPath: true }"
          placeholder="请选择市/区"
          style="width: 100%"
          filterable
          clearable
          :disabled="!form.provinceId"
        />
      </el-form-item>

      <el-form-item label="年份" prop="year">
        <el-input-number v-model="form.year" :min="1900" :max="2100" controls-position="right" />
      </el-form-item>

      <el-form-item label="学期" prop="term">
        <el-radio-group v-model="form.term">
          <el-radio :value="1">上学期</el-radio>
          <el-radio :value="2">下学期</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="试卷类型" prop="paperType">
        <el-select v-model="form.paperType" placeholder="请选择试卷类型" style="width: 100%">
          <el-option label="期中" :value="1" />
          <el-option label="期末" :value="2" />
          <el-option label="单元测试" :value="3" />
          <el-option label="月考" :value="4" />
          <el-option label="竞赛" :value="5" />
          <el-option label="开学考" :value="6" />
          <el-option label="高考真题" :value="7" />
          <el-option label="高考模拟" :value="8" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="!readonly">
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getDocInfoDetailsApi, putDocInfoUpdateApi, type DocUpdateCmd } from '@/api/gen/docController'
import {
  getDicGradeListApi,
  getDicSubjectListApi,
  getDicAdministrativeDivisionListApi
} from '@/api/gen/dicController'

interface Props {
  docId: string
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
const provinceList = ref<{ id?: string; name?: string; code?: string; level?: number; parentCode?: string }[]>([])
const dictDataLoaded = ref(false)

const form = reactive<DocUpdateCmd & { cityDistrict: (string | number)[] }>({
  title: '',
  provinceId: undefined,
  cityId: undefined,
  gradeId: undefined,
  subjectId: undefined,
  year: currentYear,
  term: 1,
  paperType: 1,
  stepId: '1',
  cityDistrict: []
})

const isUpdatingFromFetch = ref(false)

const cityCascaderOptions = computed(() => {
  if (!form.provinceId) return []
  const province = provinceList.value.find(p => p.id === form.provinceId)
  if (!province) return []
  const cities = provinceList.value.filter(item => item.parentCode === province.code)
  return cities.map(city => ({
    value: city.id,
    label: city.name,
    children: provinceList.value
      .filter(item => item.parentCode === city.code)
      .map(district => ({
        value: district.id,
        label: district.name
      }))
  }))
})

const rules: any = {
  title: [{ required: true, message: '请输入试卷名称', trigger: 'blur' }],
  stepId: [{ required: true, message: '请选择学段', trigger: 'change' }],
  gradeId: [{ required: true, message: '请选择年级', trigger: 'change' }],
  subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
  provinceId: [{ required: true, message: '请选择省份', trigger: 'change' }],
  cityDistrict: [{ required: true, message: '请选择市/区', trigger: 'change' }],
  year: [{ required: true, type: 'number', message: '请选择年份', trigger: 'change' }],
  term: [{ required: true, message: '请选择学期', trigger: 'change' }],
  paperType: [{ required: true, message: '请选择试卷类型', trigger: 'change' }]
}

// 获取字典数据
const fetchDictData = async () => {
  try {
    const [gradeRes, subjectRes, provinceRes] = await Promise.all([
      getDicGradeListApi(),
      getDicSubjectListApi({ type: 2 }),
      getDicAdministrativeDivisionListApi()
    ])
    if (gradeRes.data.code === 200) gradeList.value = gradeRes.data.data || []
    if (subjectRes.data.code === 200) subjectList.value = subjectRes.data.data || []
    if (provinceRes.data.code === 200) provinceList.value = provinceRes.data.data || []
    console.log('fetchDictData 完成，设置 dictDataLoaded = true')
    dictDataLoaded.value = true
    console.log('fetchDictData dictDataLoaded:', dictDataLoaded.value)
    console.log('fetchDictData props.docId:', props.docId)
    if (props.docId) {
      fetchDocDetail()
    }
  } catch (error) {
    console.error('获取字典数据失败', error)
  }
}

// 获取试卷详情
const fetchDocDetail = async () => {
  loading.value = true
  isUpdatingFromFetch.value = true
  try {
    const response = await getDocInfoDetailsApi({ id: props.docId })
    if (response.data.code === 200 && response.data.data) {
      const data = response.data.data
      console.log('fetchDocDetail data.cityId:', data.cityId)

      // 先清空 cityDistrict
      form.cityDistrict = []

      const cityDistrict: (string | number)[] = []

      if (data.cityId) {
        console.log('fetchDocDetail 查找前 data.cityId:', data.cityId, 'type:', typeof data.cityId)
        console.log('fetchDocDetail provinceList.ids:', provinceList.value.slice(0, 5).map(i => ({ id: i.id, type: typeof i.id })))
        const cityItem = provinceList.value.find(item => item.id == data.cityId)
        console.log('fetchDocDetail cityItem:', cityItem)
        if (cityItem) {
          if (cityItem.level === 3) {
            // 区级，需要找到父级市级
            const parentCity = provinceList.value.find(item => item.code === cityItem.parentCode)
            console.log('fetchDocDetail parentCity:', parentCity)
            if (parentCity) {
              cityDistrict.push(parentCity.id!)
            }
          }
          cityDistrict.push(data.cityId)
        }
      }

      console.log('fetchDocDetail cityDistrict:', cityDistrict)

      Object.assign(form, {
        title: data.title,
        gradeId: data.gradeId != null ? String(data.gradeId) : undefined,
        subjectId: data.subjectId != null ? String(data.subjectId) : undefined,
        year: data.year,
        term: data.term,
        paperType: data.paperType,
        stepId: data.stepId
      })

      // 先设置 provinceId
      form.provinceId = data.provinceId

      // 使用 nextTick 确保 provinceId 更新后再设置 cityDistrict
      await nextTick()

      // 再设置 cityDistrict
      form.cityDistrict = cityDistrict
      console.log('fetchDocDetail 设置后 form.cityDistrict:', form.cityDistrict)
      console.log('fetchDocDetail 设置后 form.cityId:', form.cityId)

      // 最后设置 cityId
      form.cityId = data.cityId
      console.log('fetchDocDetail 最终 cityId:', form.cityId)
    }
  } catch (error) {
    ElMessage.error('获取试卷详情失败')
    console.error(error)
  } finally {
    loading.value = false
    await nextTick()
    isUpdatingFromFetch.value = false
  }
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        // 取 cityDistrict 数组最后一个元素（最低一级）
        const cityId = form.cityDistrict.length > 0
          ? form.cityDistrict[form.cityDistrict.length - 1] as string
          : undefined

        const submitData: DocUpdateCmd = {
          title: form.title,
          provinceId: form.provinceId,
          cityId,
          gradeId: form.gradeId,
          subjectId: form.subjectId,
          year: form.year,
          term: form.term,
          paperType: form.paperType,
          stepId: form.stepId
        }
        const response = await putDocInfoUpdateApi(submitData, { id: props.docId })
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
  fetchDocDetail()
}

watch(() => props.docId, (newVal) => {
  if (newVal && newVal !== 'undefined') {
    fetchDocDetail()
  }
})

watch(() => form.cityDistrict, (newVal) => {
  console.log('cityDistrict watch:', newVal, 'isUpdatingFromFetch:', isUpdatingFromFetch.value)
  if (isUpdatingFromFetch.value) return
  if (newVal && newVal.length > 0) {
    form.cityId = newVal[newVal.length - 1] as string
  }
})

watch(() => form.provinceId, (newVal, oldVal) => {
  console.log('provinceId watch:', { newVal, oldVal, isUpdatingFromFetch: isUpdatingFromFetch.value })
  // 只在用户手动切换省份时清空，不是从接口获取数据时
  if (oldVal !== undefined && !isUpdatingFromFetch.value) {
    form.cityDistrict = []
    form.cityId = undefined
  }
})

watch(() => dictDataLoaded, (newVal) => {
  console.log('dictDataLoaded watch:', newVal, 'props.docId:', props.docId)
  if (newVal && props.docId) {
    fetchDocDetail()
  }
})

onMounted(() => {
  fetchDictData()
})
</script>
<style scoped></style>
