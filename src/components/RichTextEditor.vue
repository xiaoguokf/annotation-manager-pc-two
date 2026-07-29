<template>
  <div class="rich-editor">
    <div v-if="editor" class="rich-editor__toolbar" @mousedown.prevent>
      <button type="button" class="rich-editor__btn" :class="{ 'is-active': editor.isActive('bold') }" title="加粗" @click="toggle('bold')">
        <b>B</b>
      </button>
      <button type="button" class="rich-editor__btn" :class="{ 'is-active': editor.isActive('italic') }" title="斜体" @click="toggle('italic')">
        <i>I</i>
      </button>
      <button type="button" class="rich-editor__btn" :class="{ 'is-active': editor.isActive('strike') }" title="删除线" @click="toggle('strike')">
        <s>S</s>
      </button>
      <button type="button" class="rich-editor__btn" :class="{ 'is-active': editor.isActive('code') }" title="行内代码" @click="toggle('code')">
        &lt;/&gt;
      </button>
      <span class="rich-editor__divider" />
      <button type="button" class="rich-editor__btn" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }" title="标题" @click="toggle('h2')">H</button>
      <button type="button" class="rich-editor__btn" :class="{ 'is-active': editor.isActive('bulletList') }" title="无序列表" @click="toggle('bullet')">•</button>
      <button type="button" class="rich-editor__btn" :class="{ 'is-active': editor.isActive('orderedList') }" title="有序列表" @click="toggle('ordered')">1.</button>
      <button type="button" class="rich-editor__btn" :class="{ 'is-active': editor.isActive('blockquote') }" title="引用" @click="toggle('quote')">❝</button>
      <button type="button" class="rich-editor__btn" :class="{ 'is-active': editor.isActive('codeBlock') }" title="代码块" @click="toggle('codeBlock')">{ }</button>
      <span class="rich-editor__divider" />
      <button type="button" class="rich-editor__btn" :class="{ 'is-active': editor.isActive('link') }" title="链接" @click="setLink">链接</button>
      <button type="button" class="rich-editor__btn" title="图片" @click="setImage">图片</button>
      <button type="button" class="rich-editor__btn" title="清除格式" @click="editor.chain().focus().unsetAllMarks().clearNodes().run()">清除</button>
    </div>
    <div class="rich-editor__content" :style="{ height }">
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    height?: string
    editable?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: '请输入公告内容...',
    height: '320px',
    editable: true
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editor = useEditor({
  content: props.modelValue || '',
  editable: props.editable,
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' }
    }),
    Image.configure({ inline: false }),
    Placeholder.configure({ placeholder: props.placeholder })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

const toggle = (name: 'bold' | 'italic' | 'strike' | 'code' | 'h2' | 'bullet' | 'ordered' | 'quote' | 'codeBlock') => {
  const e = editor.value
  if (!e) return
  const chain = e.chain().focus()
  switch (name) {
    case 'bold':
      chain.toggleBold().run()
      break
    case 'italic':
      chain.toggleItalic().run()
      break
    case 'strike':
      chain.toggleStrike().run()
      break
    case 'code':
      chain.toggleCode().run()
      break
    case 'h2':
      chain.toggleHeading({ level: 2 }).run()
      break
    case 'bullet':
      chain.toggleBulletList().run()
      break
    case 'ordered':
      chain.toggleOrderedList().run()
      break
    case 'quote':
      chain.toggleBlockquote().run()
      break
    case 'codeBlock':
      chain.toggleCodeBlock().run()
      break
  }
}

const setLink = () => {
  const e = editor.value
  if (!e) return
  const previousUrl = e.getAttributes('link').href as string | undefined
  const url = window.prompt('请输入链接地址', previousUrl || 'https://')
  if (url === null) return
  if (url === '') {
    e.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  e.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const setImage = () => {
  const e = editor.value
  if (!e) return
  const url = window.prompt('请输入图片地址', 'https://')
  if (url) {
    e.chain().focus().setImage({ src: url }).run()
  }
}

// 外部值变化（如编辑不同记录）时同步到编辑器
watch(
  () => props.modelValue,
  (val) => {
    const current = editor.value?.getHTML()
    if (val !== current) {
      editor.value?.commands.setContent(val || '', false)
    }
  }
)

watch(
  () => props.editable,
  (val) => {
    editor.value?.setEditable(val)
  }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.rich-editor {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.rich-editor__toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
}

.rich-editor__btn {
  min-width: 30px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  transition: all 0.2s;
}

.rich-editor__btn:hover {
  background: var(--el-fill-color);
}

.rich-editor__btn.is-active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.rich-editor__divider {
  width: 1px;
  height: 18px;
  margin: 0 2px;
  background: var(--el-border-color);
}

.rich-editor__content {
  padding: 10px 12px;
  overflow-y: auto;
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.6;
}

.rich-editor__content :deep(.ProseMirror) {
  outline: none;
  min-height: 100%;
}

.rich-editor__content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--el-text-color-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.rich-editor__content :deep(.ProseMirror h2) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 0.4em 0;
}

.rich-editor__content :deep(.ProseMirror ul),
.rich-editor__content :deep(.ProseMirror ol) {
  padding-left: 1.5em;
  margin: 0.4em 0;
}

.rich-editor__content :deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--el-border-color);
  margin: 0.4em 0;
  padding-left: 1em;
  color: var(--el-text-color-secondary);
}

.rich-editor__content :deep(.ProseMirror pre) {
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 0.6em 0.8em;
  font-family: monospace;
  overflow-x: auto;
}

.rich-editor__content :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
}

.rich-editor__content :deep(.ProseMirror a) {
  color: var(--el-color-primary);
}
</style>
