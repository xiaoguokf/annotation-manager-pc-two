<template>
  <div class="annotation-text-editor">
    <!-- 标注基本信息 -->
    <div class="detail-section mb-4">
      <div class="section-title mb-2">标注信息</div>
      <div class="detail-item">
        <span class="label">类型:</span>
        <span class="value">{{ getAnnotationTypeName(selectedAnnotation.type, selectedAnnotation.inputType) }}</span>
      </div>
      <div class="detail-item">
        <span class="label">页码:</span>
        <span class="value">{{ selectedAnnotation.page }}</span>
      </div>
    </div>

    <!-- 解析状态 -->
    <div v-if="selectedAnnotation.result !== undefined && selectedAnnotation.result !== 1" class="detail-section mb-4">
      <div class="section-title mb-2">解析状态</div>
      <div class="status-box" :class="`status-${selectedAnnotation.result}`">
        <Icon :icon="selectedAnnotation.result === 0 ? 'ep:loading' : 'ep:close'" :width="20" :height="20"
          :class="{ 'is-spinning': selectedAnnotation.result === 0 }" />
        <span class="ml-2">
          {{ selectedAnnotation.result === 0 ? '后台正在解析中，数据已上传到系统，您可以先继续往下做' : '解析失败' }}
        </span>
        <!-- 重试按钮：解析中和解析失败都显示 -->
        <el-button type="primary" size="small" link :loading="retrying" :disabled="cooldown" @click="handleRetry"
          class="ml-auto">
          重新生成
        </el-button>
      </div>
    </div>

    <!-- 解析结果 -->
    <div v-if="selectedAnnotation.result === 1" class="detail-section mb-4">
      <div class="section-title mb-2 flex items-center justify-between">
        <span>解析内容</span>
        <div class="flex gap-2">
          <!-- 文本类型的重试按钮 -->
          <el-button v-if="selectedAnnotation.result === 1" type="primary" size="small" link :disabled="cooldown"
            @click="handleRetryParse">
            <Icon icon="ep:refresh" class="mr-1" />
            重新生成
          </el-button>
        </div>
      </div>


      <!-- 编辑框 -->
      <div class="detail-section mb-4">
        <div class="section-title mb-2 flex items-center justify-between">
          <span>编辑{{ selectedAnnotation.type === 3 ? '-(选择题一行一个选项)' : '' }}</span>
          <div class="latex-toolbar">
            <!-- 常用格式按钮 -->
            <button class="format-btn" @click="toggleFormat('bold')" :title="'加粗 (Ctrl+B)'"
              :class="{ active: isActiveFormat('bold') }">
              <Icon icon="mdi:format-bold" :width="16" :height="16" />
            </button>
            <button class="format-btn" @click="toggleFormat('italic')" :title="'倾斜 (Ctrl+I)'"
              :class="{ active: isActiveFormat('italic') }">
              <Icon icon="mdi:format-italic" :width="16" :height="16" />
            </button>
            <button class="format-btn" @click="toggleFormat('cancel')" :title="'划掉 (Ctrl+D)'"
              :class="{ active: isActiveFormat('cancel') }">
              <Icon icon="mdi:format-strikethrough-variant" :width="16" :height="16" />
            </button>
            <div class="toolbar-group" :class="{ active: activeGroup === 'underline' }">
              <button class="format-btn" @click="toggleGroup('underline')" :title="'下划线/加点'">
                <Icon icon="mdi:format-underline" :width="16" :height="16" />
              </button>
              <div class="dropdown-menu" v-show="activeGroup === 'underline'">
                <div class="dropdown-content">
                  <button class="formula-btn" @click="toggleFormat('underline')" title="普通下划线">
                    <span class="rich-underline">普通</span>
                    <span class="formula-name">普通下划线</span>
                  </button>
                  <button class="formula-btn" @click="toggleFormat('underline-wavy')" title="波浪下划线">
                    <span class="rich-underline-wave">波浪</span>
                    <span class="formula-name">波浪下划线</span>
                  </button>
                  <button class="formula-btn" @click="toggleFormat('underline-dashed')" title="虚线下划线">
                    <span class="rich-underline-dashed">虚线</span>
                    <span class="formula-name">虚线下划线</span>
                  </button>
                  <button class="formula-btn" @click="toggleFormat('underline-double')" title="双下划线">
                    <span class="rich-underline-double">双线</span>
                    <span class="formula-name">双下划线</span>
                  </button>
                  <button class="formula-btn" @click="toggleFormat('dot')" title="文字加点">
                    <span class="rich-text-dot" style="font-size: 12px;">加点</span>
                    <span class="formula-name">文字加点</span>
                  </button>
                  <button class="formula-btn" @click="toggleFormat('dot-open')" title="空心圆点">
                    <span class="rich-text-dot-open" style="font-size: 12px;">空心</span>
                    <span class="formula-name">空心圆点</span>
                  </button>
                  <button class="formula-btn" @click="toggleFormat('dot-filled')" title="实心圆点">
                    <span class="rich-text-dot-filled" style="font-size: 12px;">实心</span>
                    <span class="formula-name">实心圆点</span>
                  </button>
                  <button class="formula-btn" @click="toggleFormat('circle')" title="文字圈主">
                    <span style="display: inline-block; border: 1px solid currentColor; border-radius: 50%; padding: 0 6px; font-size: 12px;">圈主</span>
                    <span class="formula-name">文字圈主</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 表格对齐按钮 -->
            <div class="toolbar-group" :class="{ active: activeGroup === 'align' }">
              <button class="format-btn" @click="toggleGroup('align')" title="表格对齐">
                <Icon icon="mdi:format-align-center" :width="16" :height="16" />
              </button>
              <div class="dropdown-menu" v-show="activeGroup === 'align'">
                <div class="dropdown-content">
                  <button class="formula-btn" @click="toggleFormat('align-left')" title="左对齐">
                    <Icon icon="mdi:format-align-left" :width="16" :height="16" />
                    <span class="formula-name">左对齐</span>
                  </button>
                  <button class="formula-btn" @click="toggleFormat('align-center')" title="居中对齐">
                    <Icon icon="mdi:format-align-center" :width="16" :height="16" />
                    <span class="formula-name">居中对齐</span>
                  </button>
                  <button class="formula-btn" @click="toggleFormat('align-right')" title="右对齐">
                    <Icon icon="mdi:format-align-right" :width="16" :height="16" />
                    <span class="formula-name">右对齐</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="toolbar-divider"></div>

            <!-- 撤销和恢复按钮 -->
            <button class="format-btn" @click="undo" :title="'撤销 (Ctrl+Z)'" :disabled="!canUndo">
              <Icon icon="mdi:undo" :width="16" :height="16" />
            </button>
            <button class="format-btn" @click="redo" :title="'恢复 (Ctrl+Y)'" :disabled="!canRedo">
              <Icon icon="mdi:redo" :width="16" :height="16" />
            </button>

            <div class="toolbar-divider"></div>

            <!-- 公式分类按钮（仅显示4个常用分类） -->
            <template v-for="group in toolbarFormulaGroups" :key="group.name">
              <div class="toolbar-group" :class="{ active: activeGroup === group.name }">
                <button class="toolbar-btn" @click="toggleGroup(group.name)" :title="group.label">
                  <span class="toolbar-icon">{{ group.icon }}</span>
                </button>
                <div class="dropdown-menu" v-show="activeGroup === group.name">
                  <div class="dropdown-content">
                    <button v-for="formula in group.formulas" :key="formula.name" class="formula-btn"
                      @click="insertFormula(formula)" :title="`${formula.name}: ${formula.code}`">
                      <span class="formula-preview" v-html="renderPreview(formula)"></span>
                      <span class="formula-name">{{ formula.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <!-- 公式大全按钮（齿轮） -->
            <button class="format-btn formula-reference-btn" @click="showFormulaDialog = true" :title="'公式大全'">
              <Icon icon="mdi:cog" :width="16" :height="16" />
            </button>
          </div>
        </div>
        <div class="content-box">
          <el-input v-model="editContent" type="textarea" :rows="6" :placeholder="'请输入内容，支持 Markdown 和 LaTeX 公式'"
            @input="handleEditChange" @blur="handleBlur" @focus="handleFocus" @keydown="handleKeydown" />
        </div>
      </div>

      <!-- 预览框 -->
      <div class="detail-section">
        <div class="section-title mb-2">预览</div>
        <div class="content-box preview-box">
          <div v-if="editContent" class="preview-content" v-html="renderContentWithImage(editContent)"></div>
          <div v-else class="text-gray-400">暂无内容</div>
        </div>
      </div>
    </div>

    <!-- 公式大全弹窗 -->
    <el-dialog v-model="showFormulaDialog" title="公式大全" width="900px" :close-on-click-modal="false"
      class="formula-dialog">
      <el-tabs v-model="activeFormulaTab" type="border-card">
        <el-tab-pane v-for="group in formulaGroups" :key="group.name" :label="group.label" :name="group.name">
          <div class="formula-grid">
            <div v-for="formula in group.formulas" :key="formula.name" class="formula-card"
              @click="insertFormulaFromDialog(formula)" :title="`${formula.name}: ${formula.code}`">
              <div class="formula-card-preview" v-html="renderPreview(formula)"></div>
              <div class="formula-card-name">{{ formula.name }}</div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { type AnnotationSimpleVO, putAnnotationUpdateAnalysisResultApi } from '@/api/gen/annotationController'
import { useConfigStore } from '@/stores/config'
import { renderContent, renderLatex } from '@/utils/contentRenderer'
import 'katex/dist/katex.min.css'

const emit = defineEmits(['retryParse', 'updateContent'])
const configStore = useConfigStore()

const props = defineProps<{
  selectedAnnotation: AnnotationSimpleVO
}>()

const retrying = ref(false)
const editContent = ref('')
const originalContent = ref('')
const isRetrying = ref(false)
const cooldown = ref(false)
const activeGroup = ref('')
const showFormulaDialog = ref(false)
const activeFormulaTab = ref('symbol')
const editorRef = ref<HTMLTextAreaElement>()
const undoStack = ref<string[]>([])
const redoStack = ref<string[]>([])
const maxHistorySize = 50
const isUndoingOrRedoing = ref(false)
const isFocused = ref(false)

// 标注类型名称映射
const annotationTypeNames: Record<number, string> = {
  1: '题干',
  3: '选项',
  5: '解析',
  7: '答案'
}

// 工具栏显示的公式分类（5个分类）
const toolbarFormulaGroups = [
  {
    name: 'text',
    label: '文字格式',
    icon: '🔤',
    formulas: [
      { name: '拼音', code: '$\\overset{拼音}{}$', previewCode: '$\\overset{\\text{拼音}}{\\text{字}}$' },
      { name: '划掉', code: '$\\not{}$' },
      { name: '上角标', previewCode: 'x<span style="vertical-align: super; font-size: 0.8em;">2</span>', code: 'text-format-superscript', isFormat: true },
      { name: '下角标', previewCode: 'x<span style="vertical-align: sub; font-size: 0.8em;">2</span>', code: 'text-format-subscript', isFormat: true },
      { name: '横线', code: '$\\underline{ \\quad \\quad }$' },
      { name: '框选', code: '$\\boxed{}$' },
      { name: '打钩', code: '$\\fbox{√}$' },
      { name: '平行等于', code: '$\\xrightarrow{\\parallel}$' },
    ]
  },
  {
    name: 'symbol',
    label: '常用符号',
    icon: 'Σ',
    formulas: [
      { name: '+', code: '$+$' }, { name: '-', code: '$-$' }, { name: '×', code: '$\\times$' },
      { name: '÷', code: '$\\div$' }, { name: '±', code: '$\\pm$' }, { name: '∓', code: '$\\mp$' },
      { name: '·', code: '$\\cdot$' }, { name: '=', code: '$=$' }, { name: '≠', code: '$\\ne$' },
      { name: '≤', code: '$\\le$' }, { name: '≥', code: '$\\ge$' }, { name: '∞', code: '$\\infty$' },
      { name: '∝', code: '$\\propto$' }, { name: '≈', code: '$\\approx$' }
    ]
  },
  {
    name: 'greek',
    label: '希腊字母',
    icon: 'α',
    formulas: [
      { name: 'α', code: '$\\alpha$' }, { name: 'β', code: '$\\beta$' }, { name: 'γ', code: '$\\gamma$' },
      { name: 'δ', code: '$\\delta$' }, { name: 'ε', code: '$\\epsilon$' }, { name: 'θ', code: '$\\theta$' },
      { name: 'λ', code: '$\\lambda$' }, { name: 'μ', code: '$\\mu$' }, { name: 'π', code: '$\\pi$' },
      { name: 'σ', code: '$\\sigma$' }, { name: 'φ', code: '$\\phi$' }, { name: 'ω', code: '$\\omega$' }
    ]
  },
  {
    name: 'sqrt',
    label: '根式角标',
    icon: '√',
    formulas: [
      { name: '根号', code: '$\\sqrt{}$' }, { name: 'n次根', code: '$\\sqrt[n]{}$' },
      { name: '上标', code: '$x^{}$' }, { name: '下标', code: '$x_{}$' },
      { name: 'x^2', code: '$x^2$' }, { name: 'x^3', code: '$x^3$' },
      { name: 'x^n', code: '$x^n$' }, { name: 'a^b', code: '$a^b$' }
    ]
  },
  {
    name: 'trig',
    label: 'sin',
    icon: 'sin',
    formulas: [
      { name: 'sin', code: '$\\sin$' }, { name: 'cos', code: '$\\cos$' }, { name: 'tan', code: '$\\tan$' },
      { name: 'cot', code: '$\\cot$' }, { name: 'sec', code: '$\\sec$' }, { name: 'csc', code: '$\\csc$' },
      { name: 'arcsin', code: '$\\arcsin$' }, { name: 'arccos', code: '$\\arccos$' }, { name: 'arctan', code: '$\\arctan$' }
    ]
  }
]

// 公式大全弹窗数据（所有分类）
const formulaGroups = [
  {
    name: 'symbol',
    label: '常用符号',
    icon: 'Σ',
    formulas: [
      { name: '+', code: '$+$' }, { name: '-', code: '$-$' }, { name: '×', code: '$\\times$' },
      { name: '÷', code: '$\\div$' }, { name: '±', code: '$\\pm$' }, { name: '∓', code: '$\\mp$' },
      { name: '·', code: '$\\cdot$' }, { name: '⋆', code: '$\\star$' }, { name: '∗', code: '$\\ast$' },
      { name: '⊎', code: '$\\sqcup$' }, { name: '⊓', code: '$\\sqcap$' }, { name: '∨', code: '$\\vee$' },
      { name: '∧', code: '$\\wedge$' }, { name: '∘', code: '$\\circ$' }, { name: '•', code: '$\\bullet$' },
      { name: '⊕', code: '$\\oplus$' }, { name: '⊖', code: '$\\ominus$' }, { name: '⊙', code: '$\\odot$' },
      { name: '⊘', code: '$\\oslash$' }, { name: '⊗', code: '$\\otimes$' }, { name: '○', code: '$\\bigcirc$' },
      { name: '◇', code: '$\\diamond$' }, { name: '<', code: '$<$' }, { name: '>', code: '$>$' },
      { name: '=', code: '$=$' }, { name: '≤', code: '$\\le$' }, { name: '≥', code: '$\\ge$' },
      { name: '≡', code: '$\\equiv$' }, { name: '≪', code: '$\\ll$' }, { name: '≫', code: '$\\gg$' },
      { name: '≐', code: '$\\doteq$' }, { name: '≺', code: '$\\prec$' }, { name: '≻', code: '$\\succ$' },
      { name: '∼', code: '$\\sim$' }, { name: '≼', code: '$\\preceq$' }, { name: '≽', code: '$\\succeq$' },
      { name: '≃', code: '$\\simeq$' }, { name: '≈', code: '$\\approx$' }, { name: '⊂', code: '$\\subset$' },
      { name: '⊃', code: '$\\supset$' }, { name: '⊆', code: '$\\subseteq$' }, { name: '⊇', code: '$\\supseteq$' },
      { name: '⊏', code: '$\\sqsubset$' }, { name: '⊐', code: '$\\sqsupset$' }, { name: '⊑', code: '$\\sqsubseteq$' },
      { name: '⊒', code: '$\\sqsupseteq$' }, { name: '≅', code: '$\\cong$' }, { name: '⋈', code: '$\\bowtie$' },
      { name: '∝', code: '$\\propto$' }, { name: '∈', code: '$\\in$' }, { name: '∋', code: '$\\ni$' },
      { name: '⊢', code: '$\\vdash$' }, { name: '⊣', code: '$\\dashv$' }, { name: '⊧', code: '$\\models$' },
      { name: '∣', code: '$\\mid$' }, { name: '∥', code: '$\\parallel$' }, { name: '⊥', code: '$\\perp$' },
      { name: '⌣', code: '$\\smile$' }, { name: '⌢', code: '$\\frown$' }, { name: '≍', code: '$\\asymp$' },
      { name: '∉', code: '$\\notin$' }, { name: '≠', code: '$\\ne$' }, { name: '←', code: '$\\leftarrow$' },
      { name: '→', code: '$\\rightarrow$' }, { name: '↑', code: '$\\uparrow$' }, { name: '↓', code: '$\\downarrow$' },
      { name: '↕', code: '$\\updownarrow$' }, { name: '↔', code: '$\\leftrightarrow$' }, { name: '⇑', code: '$\\Uparrow$' },
      { name: '⇓', code: '$\\Downarrow$' }, { name: '⇕', code: '$\\Updownarrow$' }, { name: '⇐', code: '$\\Leftarrow$' },
      { name: '⇒', code: '$\\Rightarrow$' }, { name: '⇔', code: '$\\Leftrightarrow$' }, { name: '↦', code: '$\\mapsto$' },
      { name: '↗', code: '$\\nearrow$' }, { name: '↘', code: '$\\searrow$' }, { name: '↙', code: '$\\swarrow$' },
      { name: '↖', code: '$\\nwarrow$' }, { name: '↩', code: '$\\hookleftarrow$' }, { name: '↪', code: '$\\hookrightarrow$' },
      { name: '⇌', code: '$\\rightleftharpoons$' }, { name: '⇔', code: '$\\iff$' }, { name: '⇆', code: '$\\leftharpoonup$' },
      { name: '⇄', code: '$\\rightharpoonup$' }, { name: '⇇', code: '$\\leftharpoondown$' }, { name: '⇅', code: '$\\rightharpoondown$' },
      { name: '∵', code: '$\\because$' }, { name: '∴', code: '$\\therefore$' }, { name: '…', code: '$\\dots$' },
      { name: '⋯', code: '$\\cdots$' }, { name: '⋮', code: '$\\vdots$' }, { name: '⋰', code: '$\\ddots$' },
      { name: '∀', code: '$\\forall$' }, { name: '∃', code: '$\\exists$' }, { name: '∄', code: '$\\nexists$' },
      { name: '¬', code: '$\\neg$' }, { name: '′', code: '$\\prime$' }, { name: '∅', code: '$\\emptyset$' },
      { name: '∞', code: '$\\infty$' }, { name: '∇', code: '$\\nabla$' }, { name: '△', code: '$\\triangle$' },
      { name: '□', code: '$\\Box$' }, { name: '◇', code: '$\\Diamond$' }, { name: '⊥', code: '$\\bot$' },
      { name: '⊤', code: '$\\top$' }, { name: '∠', code: '$\\angle$' }, { name: '∡', code: '$\\measuredangle$' },
      { name: '⌢', code: '$\\sphericalangle$' }, { name: '√', code: '$\\surd$' }, { name: '♢', code: '$\\diamondsuit$' },
      { name: '♡', code: '$\\heartsuit$' }, { name: '♣', code: '$\\clubsuit$' }, { name: '♠', code: '$\\spadesuit$' },
      { name: '♭', code: '$\\flat$' }, { name: '♮', code: '$\\natural$' }, { name: '♯', code: '$\\sharp$' }
    ]
  },
  {
    name: 'greek',
    label: '希腊字母',
    icon: 'α',
    formulas: [
      { name: 'α', code: '$\\alpha$' }, { name: 'β', code: '$\\beta$' }, { name: 'γ', code: '$\\gamma$' },
      { name: 'δ', code: '$\\delta$' }, { name: 'ε', code: '$\\epsilon$' }, { name: 'ε', code: '$\\varepsilon$' },
      { name: 'ζ', code: '$\\zeta$' }, { name: 'η', code: '$\\eta$' }, { name: 'θ', code: '$\\theta$' },
      { name: 'θ', code: '$\\vartheta$' }, { name: 'ι', code: '$\\iota$' }, { name: 'κ', code: '$\\kappa$' },
      { name: 'λ', code: '$\\lambda$' }, { name: 'μ', code: '$\\mu$' }, { name: 'ν', code: '$\\nu$' },
      { name: 'ξ', code: '$\\xi$' }, { name: 'ο', code: '$o$' }, { name: 'π', code: '$\\pi$' },
      { name: 'π', code: '$\\varpi$' }, { name: 'ρ', code: '$\\rho$' }, { name: 'ρ', code: '$\\varrho$' },
      { name: 'σ', code: '$\\sigma$' }, { name: 'ς', code: '$\\varsigma$' }, { name: 'τ', code: '$\\tau$' },
      { name: 'υ', code: '$\\upsilon$' }, { name: 'φ', code: '$\\phi$' }, { name: 'φ', code: '$\\varphi$' },
      { name: 'χ', code: '$\\chi$' }, { name: 'ψ', code: '$\\psi$' }, { name: 'ω', code: '$\\omega$' },
      { name: 'Γ', code: '$\\Gamma$' }, { name: 'Δ', code: '$\\Delta$' }, { name: 'Θ', code: '$\\Theta$' },
      { name: 'Λ', code: '$\\Lambda$' }, { name: 'Ξ', code: '$\\Xi$' }, { name: 'Π', code: '$\\Pi$' },
      { name: 'Σ', code: '$\\Sigma$' }, { name: 'Υ', code: '$\\Upsilon$' }, { name: 'Φ', code: '$\\Phi$' },
      { name: 'Ψ', code: '$\\Psi$' }, { name: 'Ω', code: '$\\Omega$' }
    ]
  },
  {
    name: 'frac',
    label: '分数微分',
    icon: '½',
    formulas: [
      { name: '分数', code: '$\\frac{a}{b}$' }, { name: 'd/dx', code: '$\\frac{d}{dx}$' },
      { name: 'd²/dx²', code: '$\\frac{d^2}{dx^2}$' }, { name: '∂/∂x', code: '$\\frac{\\partial}{\\partial x}$' },
      { name: '∂²/∂x²', code: '$\\frac{\\partial^2}{\\partial x^2}$' }, { name: '∂/∂y', code: '$\\frac{\\partial}{\\partial y}$' },
      { name: '∂²/∂x∂y', code: '$\\frac{\\partial^2}{\\partial x \\partial y}$' }, { name: 'dy/dx', code: '$\\frac{dy}{dx}$' },
      { name: 'd²y/dx²', code: '$\\frac{d^2y}{dx^2}$' }
    ]
  },
  {
    name: 'sqrt',
    label: '根式角标',
    icon: '√',
    formulas: [
      { name: '根号', code: '$\\sqrt{}$' }, { name: 'n次根', code: '$\\sqrt[n]{}$' },
      { name: '上标', code: '$x^{}$' }, { name: '下标', code: '$x_{}$' },
      { name: 'x^2', code: '$x^2$' }, { name: 'x^3', code: '$x^3$' },
      { name: 'x^n', code: '$x^n$' }, { name: 'x^{-1}', code: '$x^{-1}$' },
      { name: 'x^{-2}', code: '$x^{-2}$' }, { name: 'x^{-n}', code: '$x^{-n}$' },
      { name: 'x^½', code: '$x^{\\frac12}$' }, { name: 'x^{-½}', code: '$x^{-\\frac12}$' },
      { name: 'a^b', code: '$a^b$' }, { name: 'a^{bc}', code: '$a^{bc}$' }
    ]
  },
  {
    name: 'limit',
    label: '极限对数',
    icon: 'lim',
    formulas: [
      { name: 'lim', code: '$\\lim_{}$' }, { name: 'lim x→0', code: '$\\lim_{x \\to 0}$' },
      { name: 'lim x→∞', code: '$\\lim_{x \\to \\infty}$' }, { name: 'lim n→∞', code: '$\\lim_{n \\to \\infty}$' },
      { name: 'inf', code: '$\\inf_{}$' }, { name: 'sup', code: '$\\sup_{}$' },
      { name: 'max', code: '$\\max_{}$' }, { name: 'min', code: '$\\min_{}$' },
      { name: 'ln', code: '$\\ln$' }, { name: 'log', code: '$\\log_{}$' },
      { name: 'lg', code: '$\\lg$' }, { name: 'log₂', code: '$\\log_2$' },
      { name: 'log₁₀', code: '$\\log_{10}$' }, { name: 'log_e', code: '$\\log_e$' }
    ]
  },
  {
    name: 'trig',
    label: '三角函数',
    icon: 'sin',
    formulas: [
      { name: 'sin', code: '$\\sin$' }, { name: 'cos', code: '$\\cos$' }, { name: 'tan', code: '$\\tan$' },
      { name: 'cot', code: '$\\cot$' }, { name: 'sec', code: '$\\sec$' }, { name: 'csc', code: '$\\csc$' },
      { name: 'arcsin', code: '$\\arcsin$' }, { name: 'arccos', code: '$\\arccos$' }, { name: 'arctan', code: '$\\arctan$' },
      { name: 'arccot', code: '$\\operatorname{arccot}$' }, { name: 'arcsec', code: '$\\operatorname{arcsec}$' },
      { name: 'arccsc', code: '$\\operatorname{arccsc}$' }, { name: 'sinh', code: '$\\sinh$' }, { name: 'cosh', code: '$\\cosh$' },
      { name: 'tanh', code: '$\\tanh$' }, { name: 'coth', code: '$\\coth$' }, { name: 'sech', code: '$\\operatorname{sech}$' },
      { name: 'csch', code: '$\\operatorname{csch}$' }, { name: 'arsinh', code: '$\\operatorname{arsinh}$' },
      { name: 'arcosh', code: '$\\operatorname{arcosh}$' }, { name: 'artanh', code: '$\\operatorname{artanh}$' },
      { name: 'arcoth', code: '$\\operatorname{arcoth}$' }, { name: 'arsech', code: '$\\operatorname{arsech}$' },
      { name: 'arcsch', code: '$\\operatorname{arcsch}$' }
    ]
  },
  {
    name: 'integral',
    label: '积分运算',
    icon: '∫',
    formulas: [
      { name: '∫', code: '$\\int$' }, { name: '∫_a^b', code: '$\\int_a^b$' },
      { name: '∫₀^∞', code: '$\\int_0^\\infty$' }, { name: '∫_{-∞}^∞', code: '$\\int_{-\\infty}^{\\infty}$' },
      { name: '∬', code: '$\\iint$' }, { name: '∭', code: '$\\iiint$' },
      { name: '∮', code: '$\\oint$' }, { name: '∂', code: '$\\partial$' },
      { name: '∇·', code: '$\\nabla \\cdot$' }, { name: '∇×', code: '$\\nabla \\times$' },
      { name: '∇²', code: '$\\nabla^2$' }, { name: '∇f', code: '$\\nabla f$' }
    ]
  },
  {
    name: 'sum',
    label: '大型运算',
    icon: '∑',
    formulas: [
      { name: '∑', code: '$\\sum_{}^{}$' }, { name: '∑_i', code: '$\\sum_{i}$' },
      { name: '∑_{i=1}^n', code: '$\\sum_{i=1}^n$' }, { name: '∑_{i=0}^∞', code: '$\\sum_{i=0}^{\\infty}$' },
      { name: '∏', code: '$\\prod_{}^{}$' }, { name: '∏_i', code: '$\\prod_{i}$' },
      { name: '∏_{i=1}^n', code: '$\\prod_{i=1}^n$' }, { name: '∐', code: '$\\coprod_{}^{}$' },
      { name: '∪', code: '$\\bigcup_{}^{}$' }, { name: '∩', code: '$\\bigcap_{}^{}$' },
      { name: '∨', code: '$\\bigvee_{}^{}$' }, { name: '∧', code: '$\\bigwedge_{}^{}$' },
      { name: '⊕', code: '$\\bigoplus_{}^{}$' }, { name: '⊗', code: '$\\bigotimes_{}^{}$' }
    ]
  },
  {
    name: 'bracket',
    label: '括号取整',
    icon: '( )',
    formulas: [
      { name: '( )', code: '$\\left(\\right)$' }, { name: '[ ]', code: '$\\left[\\right]$' },
      { name: '⟨ ⟩', code: '$\\left\\langle\\right\\rangle$' }, { name: '{ }', code: '$\\left\\{\\right\\}$' },
      { name: '| |', code: '$\\left|\\right|$' }, { name: '‖ ‖', code: '$\\left\\|\\right\\|$' },
      { name: '⌊ ⌋', code: '$\\left\\lfloor\\right\\rfloor$' }, { name: '⌈ ⌉', code: '$\\left\\lceil\\right\\rceil$' },
      { name: 'C(n,k)', code: '$\\binom{n}{k}$' }, { name: '[a,b)', code: '$\\left[a,b\\right)$' },
      { name: '⟨ψ|', code: '$\\left\\langle\\psi\\right|$' }, { name: '|ψ⟩', code: '$\\left|\\psi\\right\\rangle$' },
      { name: '⟨ψ|ψ⟩', code: '$\\left\\langle\\psi|\\psi\\right\\rangle$' }
    ]
  },
  {
    name: 'matrix',
    label: '数组矩阵',
    icon: '□',
    formulas: [
      { name: '矩阵', code: '$$\\begin{pmatrix}a & b\\\\c & d\\end{pmatrix}$$' },
      { name: '矩阵2', code: '$$\\begin{bmatrix}a & b\\\\c & d\\end{bmatrix}$$' },
      { name: '矩阵3', code: '$$\\begin{vmatrix}a & b\\\\c & d\\end{vmatrix}$$' },
      { name: '矩阵4', code: '$$\\begin{Vmatrix}a & b\\\\c & d\\end{Vmatrix}$$' },
      { name: '矩阵5', code: '$$\\begin{Bmatrix}a & b\\\\c & d\\end{Bmatrix}$$' },
      { name: 'cases', code: '$$\\begin{cases}x = 1\\\\y = 2\\end{cases}$$' },
      { name: 'align', code: '$$\\begin{align*}x &= y\\\\z &= w\\end{align*}$$' }
    ]
  }
]

// 获取标注类型名称
const getAnnotationTypeName = (type: number, inputType?: number) => {
  // 如果 inputType 是 3（表格），返回表格类型名称
  if (inputType === 3) {
    const tableNames: Record<number, string> = {
      1: '题干表格',
      3: '选项表格',
      5: '解析表格',
      7: '答案表格'
    }
    return tableNames[type] || annotationTypeNames[type] || '未知类型'
  }
  return annotationTypeNames[type] || '未知类型'
}

// 计算是否可以撤销/恢复
const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

// 保存历史记录
const saveHistory = (content: string) => {
  if (!isFocused.value) return
  if (isUndoingOrRedoing.value) return // 撤销/恢复时不保存历史

  if (undoStack.value.length >= maxHistorySize) {
    undoStack.value.shift()
  }
  undoStack.value.push(content)
  redoStack.value = [] // 清空恢复栈
}

// 撤销
const undo = () => {
  if (undoStack.value.length === 0) return

  isUndoingOrRedoing.value = true

  const currentContent = editContent.value
  const previousContent = undoStack.value.pop()!

  redoStack.value.push(currentContent)
  editContent.value = previousContent

  handleEditChange(previousContent)

  nextTick(() => {
    isUndoingOrRedoing.value = false
  })
}

// 恢复
const redo = () => {
  if (redoStack.value.length === 0) return

  isUndoingOrRedoing.value = true

  const currentContent = editContent.value
  const nextContent = redoStack.value.pop()!

  undoStack.value.push(currentContent)
  editContent.value = nextContent

  handleEditChange(nextContent)

  nextTick(() => {
    isUndoingOrRedoing.value = false
  })
}

// 处理焦点
const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  setTimeout(() => {
    // 检查新焦点是否在编辑器内部（工具栏按钮等）
    const activeElement = document.activeElement
    const isToolbarButton = activeElement?.classList.contains('format-btn') ||
      activeElement?.classList.contains('toolbar-btn') ||
      activeElement?.classList.contains('formula-btn')

    // 如果焦点不在工具栏按钮上，说明真正离开了编辑器，执行保存
    if (!isToolbarButton) {
      autoSave()
      isFocused.value = false
    }
  }, 150)
}

// 处理键盘快捷键
const handleKeydown = (e: Event | KeyboardEvent) => {
  const keyboardEvent = e as KeyboardEvent
  if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) && keyboardEvent.key === 'z') {
    e.preventDefault()
    undo()
  } else if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) && (keyboardEvent.key === 'y' || (keyboardEvent.shiftKey && keyboardEvent.key === 'z'))) {
    e.preventDefault()
    redo()
  } else if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) && keyboardEvent.key === 'b') {
    e.preventDefault()
    toggleFormat('bold')
  } else if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) && keyboardEvent.key === 'i') {
    e.preventDefault()
    toggleFormat('italic')
  } else if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) && keyboardEvent.key === 'd') {
    e.preventDefault()
    toggleFormat('cancel')
  } else if ((keyboardEvent.ctrlKey || keyboardEvent.metaKey) && keyboardEvent.key === 'u') {
    e.preventDefault()
    toggleFormat('underline')
  }
}

// 查找光标所在最近的 td/th 标签
const findNearestTd = (text: string, cursorPos: number): { tagStart: number, tagEnd: number, tagHtml: string, tagName: string } | null => {
  let searchPos = cursorPos

  while (searchPos > 0) {
    const tdIdx = text.lastIndexOf('<td', searchPos)
    const thIdx = text.lastIndexOf('<th', searchPos)
    const nearestIdx = Math.max(tdIdx, thIdx)

    if (nearestIdx === -1) return null

    // 找到开始标签的结束位置 >
    const tagCloseIdx = text.indexOf('>', nearestIdx)
    if (tagCloseIdx === -1) {
      searchPos = nearestIdx - 1
      continue
    }

    // 判断标签名
    const tagName = text.slice(nearestIdx + 1, nearestIdx + 3) === 'td' ? 'td' : 'th'
    const closeTag = `</${tagName}>`
    const closeIdx = text.indexOf(closeTag, tagCloseIdx + 1)

    if (closeIdx === -1 || cursorPos > closeIdx + closeTag.length) {
      // 光标不在这个 td/th 内，继续往前找
      searchPos = nearestIdx - 1
      continue
    }

    return {
      tagStart: nearestIdx,
      tagEnd: tagCloseIdx + 1,
      tagHtml: text.slice(nearestIdx, tagCloseIdx + 1),
      tagName
    }
  }

  return null
}

// 设置 td/th 标签的对齐 class
const setTdAlign = (tagHtml: string, align: 'left' | 'center' | 'right'): string => {
  const alignClass = `rich-text-${align}`
  const alignClasses = ['rich-text-left', 'rich-text-center', 'rich-text-right']

  const classMatch = tagHtml.match(/class="([^"]*)"/)

  if (classMatch) {
    let classes = (classMatch[1] ?? '').split(/\s+/).filter(c => c.trim())
    const currentAlign = classes.find(c => alignClasses.includes(c))

    // 移除已有的对齐 class
    classes = classes.filter(c => !alignClasses.includes(c))

    // 如果当前已有相同对齐，则取消（恢复默认左对齐）
    // 否则添加新对齐
    if (currentAlign !== alignClass) {
      classes.push(alignClass)
    }

    return tagHtml.replace(/class="[^"]*"/, `class="${classes.join(' ')}"`)
  } else {
    // 没有 class 属性，在标签名后添加
    return tagHtml.replace(/<(td|th)(\s)/, `<$1 class="${alignClass}"$2`)
  }
}

// 切换格式（加粗、倾斜、删除线、上角标、下角标、下划线、加点、对齐）
const toggleFormat = (format: 'bold' | 'italic' | 'cancel' | 'superscript' | 'subscript' | 'underline' | 'underline-wavy' | 'underline-dashed' | 'underline-double' | 'dot' | 'dot-open' | 'dot-filled' | 'highlight' | 'circle' | 'text-format-superscript' | 'text-format-subscript' | 'align-left' | 'align-center' | 'align-right') => {
  // 关闭下拉菜单
  activeGroup.value = ''

  const textarea = document.querySelector('.content-box textarea') as HTMLTextAreaElement
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = editContent.value

  // 表格对齐格式 - 作用于 td/th 标签
  const alignFormats = ['align-left', 'align-center', 'align-right']
  if (alignFormats.includes(format)) {
    const tdInfo = findNearestTd(text, start)
    if (!tdInfo) {
      ElMessage.warning('请将光标放在 td/th 元素内再设置对齐')
      return
    }

    const alignType = format.split('-')[1] as 'left' | 'center' | 'right'
    const newTagHtml = setTdAlign(tdInfo.tagHtml, alignType)
    editContent.value = text.slice(0, tdInfo.tagStart) + newTagHtml + text.slice(tdInfo.tagEnd)
    saveHistory(text)
    handleEditChange(editContent.value)

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start, end)
    }, 0)
    return
  }
  const selectedText = text.slice(start, end)

  // 文字圈主 - 使用 inline style 实现（无 class）
  if (format === 'circle') {
    const circleStyle = 'display: inline-block; border: 1px solid currentColor; border-radius: 50%; padding: 0 6px;'

    if (!selectedText) {
      // 没有选中文字时，插入格式模板
      const placeholderText = '圈主文字'
      const code = `<span style="${circleStyle}">${placeholderText}</span>`
      editContent.value = text.slice(0, start) + code + text.slice(end)

      handleEditChange(editContent.value)

      // 定位光标到占位文字后面
      setTimeout(() => {
        textarea.focus()
        const cursorPos = start + code.length - placeholderText.length - 7 // </span> 之前
        textarea.setSelectionRange(cursorPos, cursorPos)
      }, 0)
      return
    }

    // 有选中文字：检查是否已经被圈主（通过检测 style 中的 border-radius: 50%）
    let beforeText = text.slice(0, start)
    let afterText = text.slice(end)

    // 检测前面是否已有圈主 span 结束标签（兼容 style 方式）
    const beforeStyleMatch = beforeText.match(/<span\s+style="[^"]*border-radius:\s*50%[^"]*"[^>]*>$/)
    if (beforeStyleMatch) {
      const afterMatch = afterText.match(/^<\/span>/)
      if (afterMatch) {
        // 已经被圈主，移除圈主
        beforeText = beforeText.slice(0, -beforeStyleMatch[0].length)
        afterText = afterText.slice(afterMatch[0].length)
        editContent.value = beforeText + selectedText + afterText
      } else {
        // 未找到结束标签，直接添加
        const wrapCode = `<span style="${circleStyle}">${selectedText}</span>`
        editContent.value = beforeText + wrapCode + afterText
      }
    } else {
      // 未圈主，添加圈主
      const wrapCode = `<span style="${circleStyle}">${selectedText}</span>`
      editContent.value = beforeText + wrapCode + afterText
    }

    saveHistory(text)
    handleEditChange(editContent.value)
    return
  }

  // CSS 类名类型 - 统一使用 span 标签 + class
  const cssFormats: Record<string, { className: string, tag: string }> = {
    'bold': { className: 'rich-text-bold', tag: 'span' },
    'italic': { className: 'rich-text-italic', tag: 'span' },
    'text-format-superscript': { className: 'rich-text-sup', tag: 'span' },
    'text-format-subscript': { className: 'rich-text-sub', tag: 'span' },
    'underline': { className: 'rich-underline', tag: 'span' },
    'underline-wavy': { className: 'rich-underline-wave', tag: 'span' },
    'underline-dashed': { className: 'rich-underline-dashed', tag: 'span' },
    'underline-double': { className: 'rich-underline-double', tag: 'span' },
    'dot': { className: 'rich-text-dot', tag: 'span' },
    'dot-open': { className: 'rich-text-dot-open', tag: 'span' },
    'dot-filled': { className: 'rich-text-dot-filled', tag: 'span' },
    'highlight': { className: 'rich-highlight', tag: 'span' }
  }

  // 使用 CSS 类名的格式
  if (cssFormats[format]) {
    const formatConfig = cssFormats[format]

    if (!selectedText) {
      // 没有选中文字时，插入格式模板
      const placeholderText = (format === 'dot' || format === 'dot-open' || format === 'dot-filled') ? '加点文字' : ''
      const code = `<${formatConfig.tag} class="${formatConfig.className}">${placeholderText}</${formatConfig.tag}>`
      editContent.value = text.slice(0, start) + code + text.slice(end)

      // 触发输入事件
      handleEditChange(editContent.value)

      // 定位光标
      setTimeout(() => {
        textarea.focus()
        const classAttrLen = formatConfig.className.length + 9 // class="..." 的长度
        const cursorPos = placeholderText
          ? start + formatConfig.tag.length + classAttrLen + placeholderText.length // 在占位文字后面
          : start + formatConfig.tag.length + classAttrLen + 1 // 在 >< 之间
        textarea.setSelectionRange(cursorPos, cursorPos)
      }, 0)
      return
    }

    // 查找选中文本的父级 span 的 class
    const findParentSpanClasses = (text: string, start: number, end: number): string[] => {
      const parentClasses: string[] = []

      // 解析文本中的所有 span 标签，记录位置和 class
      const spans: Array<{ className: string, startIndex: number, endIndex: number }> = []
      const stack: Array<{ className: string, startIndex: number }> = []

      let pos = 0
      while (pos < text.length) {
        // 查找开始标签
        const openMatch = text.slice(pos).match(/^<span[^>]*>/)
        if (openMatch) {
          const matchPos = pos + openMatch.index!
          const classMatch = openMatch[0].match(/class="([^"]*)"/)
          const styleMatch = openMatch[0].match(/style="([^"]*)"/)
          // 兼容旧的 style 方式和新的 class 方式
          const className: string = classMatch?.[1] ?? ''
          const hasStyle = !!styleMatch
          if (className !== undefined || hasStyle) {
            stack.push({ className, startIndex: matchPos })
          }
          pos = matchPos + openMatch[0].length
          continue
        }

        // 查找结束标签
        const closeMatch = text.slice(pos).match(/^<\/span>/)
        if (closeMatch && stack.length > 0) {
          const matchPos = pos + closeMatch.index!
          const openSpan = stack.pop()
          if (openSpan) {
            spans.push({
              className: openSpan.className,
              startIndex: openSpan.startIndex,
              endIndex: matchPos + 7 // +7 是 '</span>' 的长度
            })
          }
          pos = matchPos + closeMatch[0].length
          continue
        }

        pos++
      }

      // 找到包含整个选中区域的 span
      for (const span of spans) {
        if (span.startIndex <= start && span.endIndex >= end) {
          if (span.startIndex < start && span.className) {
            parentClasses.push(span.className)
          }
        }
      }

      return parentClasses
    }

    // 获取父级 class
    const parentClasses = findParentSpanClasses(text, start, end)

    // 合并多个 class 名
    const mergeClasses = (existingClasses: string[], newClassName: string): string => {
      const classSet = new Set<string>()
      existingClasses.forEach(cls => {
        if (!cls) return
        cls.split(/\s+/).forEach(c => {
          if (c.trim()) classSet.add(c.trim())
        })
      })
      if (newClassName) {
        newClassName.split(/\s+/).forEach(c => {
          if (c.trim()) classSet.add(c.trim())
        })
      }
      return Array.from(classSet).join(' ')
    }

    // 有选中文字时，检查是否已经被格式化
    let beforeText = text.slice(0, start)
    let afterText = text.slice(end)

    // 检查前面是否有对应的开始标签（class 方式）
    const beforeMatch = beforeText.match(new RegExp(`<${formatConfig.tag}\\s+class="[^"]*"[^>]*$`, 's'))

    if (beforeMatch) {
      // 查找对应的结束标签
      const afterMatch = afterText.match(new RegExp(`^</${formatConfig.tag}>`, 's'))
      if (afterMatch) {
        // 已经被格式化，移除格式
        beforeText = beforeText.slice(0, -beforeMatch[0].length)
        afterText = afterText.slice(afterMatch[0].length)
        editContent.value = beforeText + selectedText + afterText
      } else {
        // 未找到结束标签，直接添加格式
        const wrapCode = `<${formatConfig.tag} class="${formatConfig.className}">${selectedText}</${formatConfig.tag}>`
        editContent.value = beforeText + wrapCode + afterText
      }
    } else {
      // 兼容旧的 style 方式检测
      const beforeStyleMatch = beforeText.match(new RegExp(`<${formatConfig.tag}\\s+style="[^"]*"[^>]*$`, 's'))
      if (beforeStyleMatch) {
        const afterStyleMatch = afterText.match(new RegExp(`^</${formatConfig.tag}>`, 's'))
        if (afterStyleMatch) {
          // 移除旧的 style 方式格式
          beforeText = beforeText.slice(0, -beforeStyleMatch[0].length)
          afterText = afterText.slice(afterStyleMatch[0].length)
          // 用新的 class 方式重新添加
          const mergedClass = mergeClasses(parentClasses, formatConfig.className)
          const wrapCode = `<${formatConfig.tag} class="${mergedClass}">${selectedText}</${formatConfig.tag}>`
          editContent.value = beforeText + wrapCode + afterText
        } else {
          const mergedClass = mergeClasses(parentClasses, formatConfig.className)
          const wrapCode = `<${formatConfig.tag} class="${mergedClass}">${selectedText}</${formatConfig.tag}>`
          editContent.value = beforeText + wrapCode + afterText
        }
      } else {
        // 未格式化，添加格式（继承父级 class）
        const mergedClass = mergeClasses(parentClasses, formatConfig.className)
        const wrapCode = `<${formatConfig.tag} class="${mergedClass}">${selectedText}</${formatConfig.tag}>`
        editContent.value = beforeText + wrapCode + afterText
      }
    }

    // 保存历史记录
    saveHistory(text)

    // 触发输入事件
    handleEditChange(editContent.value)
    return
  }

  // 删除线使用 CSS 类名 - 统一使用 span 标签
  if (format === 'cancel') {
    const formatConfig = { className: 'rich-line-through', tag: 'span' }

    if (!selectedText) {
      const code = `<${formatConfig.tag} class="${formatConfig.className}"></${formatConfig.tag}>`
      editContent.value = text.slice(0, start) + code + text.slice(end)

      handleEditChange(editContent.value)

      setTimeout(() => {
        textarea.focus()
        const classAttrLen = formatConfig.className.length + 9
        const cursorPos = start + formatConfig.tag.length + classAttrLen + 1
        textarea.setSelectionRange(cursorPos, cursorPos)
      }, 0)
      return
    }

    let beforeText = text.slice(0, start)
    let afterText = text.slice(end)
    // 检查 class 方式
    const beforeMatch = beforeText.match(new RegExp(`<${formatConfig.tag}\\s+class="[^"]*"[^>]*$`, 's'))

    if (beforeMatch) {
      const afterMatch = afterText.match(new RegExp(`^</${formatConfig.tag}>`, 's'))
      if (afterMatch) {
        beforeText = beforeText.slice(0, -beforeMatch[0].length)
        afterText = afterText.slice(afterMatch[0].length)
        editContent.value = beforeText + selectedText + afterText
      } else {
        const wrapCode = `<${formatConfig.tag} class="${formatConfig.className}">${selectedText}</${formatConfig.tag}>`
        editContent.value = beforeText + wrapCode + afterText
      }
    } else {
      // 兼容旧的 style 方式
      const beforeStyleMatch = beforeText.match(new RegExp(`<${formatConfig.tag}\\s+style="[^"]*"[^>]*$`, 's'))
      if (beforeStyleMatch) {
        const afterStyleMatch = afterText.match(new RegExp(`^</${formatConfig.tag}>`, 's'))
        if (afterStyleMatch) {
          beforeText = beforeText.slice(0, -beforeStyleMatch[0].length)
          afterText = afterText.slice(afterStyleMatch[0].length)
          editContent.value = beforeText + selectedText + afterText
        } else {
          const wrapCode = `<${formatConfig.tag} class="${formatConfig.className}">${selectedText}</${formatConfig.tag}>`
          editContent.value = beforeText + wrapCode + afterText
        }
      } else {
        const wrapCode = `<${formatConfig.tag} class="${formatConfig.className}">${selectedText}</${formatConfig.tag}>`
        editContent.value = beforeText + wrapCode + afterText
      }
    }

    saveHistory(text)
    handleEditChange(editContent.value)
  }
}



// 检查选中文字是否已被格式化
const isActiveFormat = (format: 'bold' | 'italic' | 'cancel' | 'text-format-superscript' | 'text-format-subscript' | 'underline' | 'underline-wavy' | 'underline-dashed' | 'underline-double' | 'dot' | 'dot-open' | 'dot-filled' | 'highlight' | 'circle' | 'align-left' | 'align-center' | 'align-right'): boolean => {
  const textarea = document.querySelector('.content-box textarea') as HTMLTextAreaElement
  if (!textarea) return false

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = editContent.value

  if (start === end) return false

  // 查找选中文本是否在某个 span 标签内部
  const findEnclosingSpan = (text: string, start: number, end: number): { className: string, style: string } | null => {
    const stack: Array<{ className: string, style: string, startIndex: number }> = []
    let pos = 0

    while (pos < text.length) {
      const openMatch = text.slice(pos).match(/^<span[^>]*>/)
      if (openMatch && pos + openMatch.index! < start) {
        const classMatch = openMatch[0].match(/class="([^"]*)"/)
        const styleMatch = openMatch[0].match(/style="([^"]*)"/)
        const className: string = classMatch?.[1] ?? ''
        const style: string = styleMatch?.[1] ?? ''
        stack.push({ className, style, startIndex: pos + openMatch.index! })
        pos += openMatch.index! + openMatch[0].length
        continue
      }

      const closeMatch = text.slice(pos).match(/^<\/span>/)
      if (closeMatch && pos + closeMatch.index! >= end) {
        if (stack.length > 0) {
          const lastSpan = stack[stack.length - 1]
          if (lastSpan) {
            return { className: lastSpan.className, style: lastSpan.style }
          }
        }
        break
      }

      if (closeMatch && pos + closeMatch.index! < start) {
        stack.pop()
        pos += closeMatch.index! + closeMatch[0].length
        continue
      }

      break
    }

    return null
  }

  const enclosingSpan = findEnclosingSpan(text, start, end)
  if (!enclosingSpan) return false

  const { className, style } = enclosingSpan

  // 格式对应的 class 名映射
  const formatClassMap: Record<string, string[]> = {
    'bold': ['rich-text-bold'],
    'italic': ['rich-text-italic'],
    'text-format-superscript': ['rich-text-sup'],
    'text-format-subscript': ['rich-text-sub'],
    'underline': ['rich-underline'],
    'underline-wavy': ['rich-underline-wave'],
    'underline-dashed': ['rich-underline-dashed'],
    'underline-double': ['rich-underline-double'],
    'cancel': ['rich-line-through'],
    'dot': ['rich-text-dot', 'dian_down'],
    'dot-open': ['rich-text-dot-open'],
    'dot-filled': ['rich-text-dot-filled'],
    'highlight': ['rich-highlight']
  }

  // 优先检查 class 方式
  const targetClasses = formatClassMap[format] || []
  if (targetClasses.some(cls => className && className.split(/\s+/).includes(cls))) {
    return true
  }

  // 文字圈主 - 检测 style 中的 border-radius: 50%
  if (format === 'circle') {
    return /border-radius:\s*50%/.test(style)
  }

  // 兼容旧的 style 方式
  if (format === 'bold') {
    return /font-weight:\s*bold/.test(style)
  } else if (format === 'italic') {
    return /font-style:\s*italic/.test(style)
  } else if (format === 'text-format-superscript') {
    return /vertical-align:\s*super/.test(style)
  } else if (format === 'text-format-subscript') {
    return /vertical-align:\s*sub/.test(style)
  } else if (format === 'underline') {
    return /text-decoration:\s*underline/.test(style) && !/wavy/.test(style) && !/dashed/.test(style) && !/double/.test(style)
  } else if (format === 'underline-wavy') {
    return /text-decoration:.*wavy/.test(style)
  } else if (format === 'underline-dashed') {
    return /text-decoration:.*dashed/.test(style)
  } else if (format === 'cancel') {
    return /text-decoration:.*line-through/.test(style)
  } else if (format === 'dot') {
    return /text-emphasis/.test(style)
  }

  // 表格对齐格式检测 - 检查光标所在 td/th 的 class
  const alignFormats = ['align-left', 'align-center', 'align-right']
  if (alignFormats.includes(format)) {
    const tdInfo = findNearestTd(text, start)
    if (!tdInfo) return false
    const alignClass = `rich-text-${format.split('-')[1]}`
    const classMatch = tdInfo.tagHtml.match(/class="([^"]*)"/)
    if (classMatch && classMatch[1]) {
      return classMatch[1].split(/\s+/).includes(alignClass)
    }
    // 兼容旧的 style 对齐方式
    const styleMatch = tdInfo.tagHtml.match(/style="([^"]*)"/)
    if (styleMatch && styleMatch[1]) {
      const s: string = styleMatch[1]
      if (format === 'align-center') return /text-align:\s*center/.test(s)
      if (format === 'align-right') return /text-align:\s*right/.test(s)
      if (format === 'align-left') return /text-align:\s*left/.test(s) && !/center|right/.test(s)
    }
    return false
  }

  return false
}

// 切换公式组
const toggleGroup = (groupName: string) => {
  if (activeGroup.value === groupName) {
    activeGroup.value = ''
  } else {
    activeGroup.value = groupName
    // 延迟检查下拉菜单位置，确保元素已渲染
    setTimeout(() => {
      adjustDropdownPosition()
    }, 0)
  }
}

// 调整下拉菜单位置
const adjustDropdownPosition = () => {
  const dropdown = document.querySelector('.toolbar-group.active .dropdown-menu') as HTMLElement
  if (!dropdown) return

  const rect = dropdown.getBoundingClientRect()
  const windowWidth = window.innerWidth

  // 如果下拉菜单超出右侧边界
  if (rect.right > windowWidth) {
    dropdown.style.right = 'auto'
    dropdown.style.left = '0'
  } else {
    dropdown.style.left = 'auto'
    dropdown.style.right = '0'
  }
}

// 插入公式
const insertFormula = (formula: { name: string, code: string, isFormat?: boolean }) => {
  // 如果是格式类型，调用 toggleFormat
  if ((formula as any).isFormat) {
    const formatType = formula.code as any
    toggleFormat(formatType)
    return
  }

  const textarea = document.querySelector('.content-box textarea') as HTMLTextAreaElement
  if (!textarea) return

  // 1. 使用 insertCode（如果存在）或 code
  let finalCode = (formula as any).insertCode || formula.code
  if (!finalCode.includes('$')) {
    finalCode = '$' + finalCode + '$'
  }

  // 2. 在光标位置插入
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = editContent.value
  editContent.value = text.slice(0, start) + finalCode + text.slice(end)

  // 3. 触发输入事件
  handleEditChange(editContent.value)

  // 4. 定位光标到合适位置
  setTimeout(() => {
    textarea.focus()
    activeGroup.value = '' // 关闭下拉菜单

    const bracePos = finalCode.indexOf('{}')
    if (bracePos !== -1) {
      textarea.setSelectionRange(start + bracePos + 1, start + bracePos + 1)
    } else if (finalCode.includes('\\\\')) {
      // 对于数组和大括号，定位到第一个 \\ 前面
      const newlinePos = finalCode.indexOf('\\\\')
      // 尝试找到 } 后面的位置（在 {cc} 或 {} 之后）
      const braceClosePos = finalCode.lastIndexOf('}', newlinePos)
      if (braceClosePos !== -1) {
        textarea.setSelectionRange(start + braceClosePos + 1, start + braceClosePos + 1)
      } else if (newlinePos !== -1) {
        textarea.setSelectionRange(start + newlinePos, start + newlinePos)
      }
    } else if (finalCode.includes('_{') || finalCode.includes('^{')) {
      const subPos = finalCode.indexOf('{') + 1
      textarea.setSelectionRange(start + subPos, start + subPos)
    } else if (finalCode.includes('$$')) {
      // 对于 $$ 公式，定位到 $$ 之后
      const doubleDollarPos = finalCode.indexOf('$$') + 2
      textarea.setSelectionRange(start + doubleDollarPos, start + doubleDollarPos)
    } else if (finalCode.includes('$')) {
      const dollarPos = finalCode.indexOf('$') + 1
      textarea.setSelectionRange(start + dollarPos, start + dollarPos)
    } else {
      textarea.setSelectionRange(start + finalCode.length, start + finalCode.length)
    }
  }, 0)
}

// 从弹窗插入公式并关闭弹窗
const insertFormulaFromDialog = (formula: { name: string, code: string }) => {
  insertFormula(formula)
  showFormulaDialog.value = false
}

// 监听选中标注变化，更新编辑内容
watch(() => props.selectedAnnotation?.analysisContent, (newContent) => {
  if (newContent !== undefined) {
    if (newContent !== editContent.value) {
      editContent.value = newContent
      originalContent.value = newContent
      // 切换标注时清空历史记录
      undoStack.value = []
      redoStack.value = []
    }
  }
}, { immediate: true })

// 监听内容变化，保存历史记录
watch(editContent, (newContent, oldContent) => {
  if (oldContent !== undefined && newContent !== oldContent) {
    saveHistory(oldContent)
  }
}, { immediate: false })

// 处理编辑内容变化
const handleEditChange = (value: string) => {
  emit('updateContent', {
    annotationId: props.selectedAnnotation.id,
    content: value
  })
}

// 自动保存逻辑
const autoSave = async () => {
  if (isRetrying.value) return

  if (!editContent.value.trim()) {
    return
  }

  if (editContent.value === originalContent.value) {
    return
  }

  try {
    await putAnnotationUpdateAnalysisResultApi({
      annotationId: props.selectedAnnotation.id,
      analysisContent: editContent.value.trim()
    })

    emit('updateContent', {
      annotationId: props.selectedAnnotation.id,
      content: editContent.value.trim()
    })

    originalContent.value = editContent.value.trim()
  } catch (error) {
    console.error('自动保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 渲染预览（自动判断是否需要显示模式）
const renderPreview = (formula: { name: string, code: string, previewCode?: string }) => {
  const codeToRender = formula.previewCode || formula.code

  // 纯文本预览
  if (!codeToRender.includes('$')) {
    return codeToRender
  }

  // 去掉 $ 或 $$ 包裹
  const latex = codeToRender.replace(/^\$\$/, '').replace(/\$\$$$/, '').replace(/^\$/, '').replace(/\$$$/, '')

  // 判断是否需要显示模式（包含 cases、array、matrix 等）
  const needsDisplayMode = codeToRender.includes('$$') ||
    latex.includes('\\begin{cases}') ||
    latex.includes('\\begin{array}') ||
    latex.includes('\\begin{matrix}') ||
    latex.includes('\\begin{pmatrix}') ||
    latex.includes('\\begin{bmatrix}')

  return renderLatex(latex, needsDisplayMode)
}

// 处理图片路径
const processImageUrl = (url: string) => {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const sliceEndpoint = configStore.getSliceEndpoint()
  return sliceEndpoint ? `${sliceEndpoint}${url}` : url
}

// 包装 renderContent，提供图片路径处理
const renderContentWithImage = (content: string) => {
  return renderContent(content, processImageUrl)
}

// 重新生成（文本类型）
const handleRetryParse = async () => {
  // 冷却期或正在重试时，禁止重复点击
  if (cooldown.value || isRetrying.value) {
    return
  }

  isRetrying.value = true
  cooldown.value = true
  retrying.value = true

  props.selectedAnnotation.result = 0

  try {
    emit('retryParse', props.selectedAnnotation)
  } finally {
    retrying.value = false
    // 2秒后结束冷却期，允许再次点击
    setTimeout(() => {
      cooldown.value = false
    }, 2000)
    setTimeout(() => {
      isRetrying.value = false
    }, 500)
  }
}

// 重新生成（解析失败状态）
const handleRetry = async () => {
  // 冷却期或正在重试时，禁止重复点击
  if (cooldown.value || isRetrying.value) {
    return
  }

  isRetrying.value = true
  cooldown.value = true
  retrying.value = true

  props.selectedAnnotation.result = 0

  try {
    emit('retryParse', props.selectedAnnotation)
  } finally {
    retrying.value = false
    // 2秒后结束冷却期，允许再次点击
    setTimeout(() => {
      cooldown.value = false
    }, 2000)
    setTimeout(() => {
      isRetrying.value = false
    }, 500)
  }
}

// 组件卸载前自动保存
onBeforeUnmount(() => {
  if (isFocused.value) {
    autoSave()
  }
})

// 暴露方法
defineExpose({
  autoSave
})
</script>

<style scoped>
.annotation-text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-section {
  background: white;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item .label {
  color: #6b7280;
  min-width: 50px;
}

.detail-item .value {
  color: #374151;
  font-weight: 500;
}

.status-box {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.status-0 {
  background-color: #fef3c7;
  color: #d97706;
}

.status-2 {
  background-color: #fee2e2;
  color: #dc2626;
}

.status-box .is-spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.content-box {
  background-color: #f9fafb;
  border-radius: 4px;
  padding: 10px;
  max-height: 300px;
  overflow: auto;
}

.preview-box {
  min-height: 120px;
}

.preview-content {
  font-size: 13px;
  line-height: 1.8;
  color: #374151;
}



.latex-error {
  color: #dc2626;
  font-family: monospace;
  background-color: #fef2f2;
  padding: 2px 6px;
  border-radius: 3px;
}

.preview-content :deep(.katex) {
  font-size: 1em;
}

.preview-content :deep(.katex-display) {
  margin: 12px 0;
  overflow-x: auto;
}

/* LaTeX 工具栏样式 */
.latex-toolbar {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.format-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #6b7280;
}

.format-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.format-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.format-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 4px;
}

.toolbar-group {
  position: relative;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 14px;
}

.toolbar-btn:hover {
  background: #f3f4f6;
}

.toolbar-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
}

.toolbar-icon {
  font-size: 14px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 260px;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-content {
  display: flex;
  flex-wrap: wrap;
  padding: 6px;
  gap: 4px;
}

.formula-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 52px;
  font-size: 11px;
}

.formula-btn:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.formula-preview {
  font-size: 12px;
  margin-bottom: 2px;
}

.formula-name {
  font-size: 10px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.formula-btn:hover .formula-name {
  color: white;
}

/* 公式大全按钮样式 */
.formula-reference-btn {
  width: auto;
  padding: 0 12px;
  gap: 4px;
}

.formula-reference-text {
  font-size: 11px;
  font-weight: 500;
}

/* 公式大全弹窗样式 */
.formula-dialog :deep(.el-dialog__body) {
  padding: 10px;
}



.formula-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  padding: 12px;
}

.formula-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 80px;
}

.formula-card:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
}

.formula-card-preview {
  font-size: 16px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.formula-card-name {
  font-size: 11px;
  color: #6b7280;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.formula-card:hover .formula-card-name {
  color: white;
}

/* 滚动条样式 */
.formula-grid::-webkit-scrollbar {
  width: 6px;
}

.formula-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.formula-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.formula-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
