import katex from 'katex'
import DOMPurify from 'dompurify'
import 'katex/contrib/mhchem'

/**
 * 行内公式定界符：$...$ 与 \(...\)
 */
const INLINE_FORMULA = /\$([^$\n]+)\$|\\\(([\s\S]*?)\\\)/g

/**
 * 块级公式定界符：$$...$$ 与 \[...\]
 */
const BLOCK_FORMULA = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g

/**
 * 渲染一段文本中的公式。
 *
 * 与后端 FormulaNormalizer 保持同一套定界符（\( \)、\[ \]、$ $、$$ $$），
 * 先块级后行内，避免 $$ 被行内规则截断。
 */
export const renderFormulas = (text: string): string =>
  text
    .replace(BLOCK_FORMULA, (_match, dollarLatex, bracketLatex) =>
      renderLatex((dollarLatex ?? bracketLatex).trim(), true),
    )
    .replace(INLINE_FORMULA, (_match, dollarLatex, parenLatex) =>
      renderLatex((dollarLatex ?? parenLatex).trim(), false),
    )

/**
 * 清洗富文本，仅保留排版与媒体标签。
 *
 * 题干、选项、解析均来自用户/模型输出，直接 v-html 存在 XSS 风险。
 * 公式渲染依赖 class 与 style，自定义标签 blank、supplement 属性一并放行。
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return ''

  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['blank'],
    ADD_ATTR: ['supplement'],
  })
}

/**
 * 渲染 LaTeX 公式
 */
export const renderLatex = (latex: string, displayMode: boolean = false) => {
  try {
    return katex.renderToString(latex, {
      displayMode: displayMode,
      throwOnError: false,
      strict: false,
      output: 'html'
    })
  } catch (error) {
    console.error('LaTeX 渲染错误:', error)
    return `<span class="latex-error">${latex}</span>`
  }
}

/**
 * 匹配最外层的 HTML 标签（不包含嵌套的同名标签）
 * @param content 要匹配的内容
 * @param tagName 标签名，如 'span'
 * @returns 匹配到的标签数组（按起始位置从后往前排序）
 */
const matchOuterTags = (content: string, tagName: string): Array<{ content: string, start: number, end: number }> => {
  const tags: Array<{ content: string, start: number, end: number }> = []
  const openTagRegex = new RegExp(`<${tagName}\\b[^>]*>`, 'gi')

  let match
  while ((match = openTagRegex.exec(content)) !== null) {
    const start = match.index
    const openTag = match[0]

    // 检查这个开始标签是否在已有的标签内部（嵌套的情况）
    const isNested = tags.some(tag => start > tag.start && start < tag.end)

    // 如果是嵌套标签，跳过
    if (isNested) {
      continue
    }

    // 查找对应的结束标签
    let stack = 1
    const searchStart = start + openTag.length
    const closeTagRegex = new RegExp(`<${tagName}\\b[^>]*>|<\/${tagName}>`, 'gi')
    closeTagRegex.lastIndex = searchStart

    let closeMatch
    let found = false
    while ((closeMatch = closeTagRegex.exec(content)) !== null) {
      if (closeMatch[0].toLowerCase().startsWith(`</${tagName.toLowerCase()}`)) {
        stack--
        if (stack === 0) {
          const end = closeMatch.index + closeMatch[0].length
          const tagContent = content.slice(start, end)
          tags.push({ content: tagContent, start, end })
          found = true
          break
        }
      } else {
        stack++
      }
    }

    // 如果没找到对应的结束标签，跳过这个开始标签
    if (!found) {
      continue
    }
  }

  // 按起始位置排序（从后到前，这样替换时不会影响前面的索引）
  return tags.sort((a, b) => b.start - a.start)
}

/**
 * 渲染内容（支持 Markdown、LaTeX、HTML 表格和 CSS 格式标签）
 * @param content 要渲染的内容
 * @param processImageFn 处理图片路径的函数，如果不需要处理可以传 null
 */
export const renderContent = (
  content: string,
  processImageFn: ((url: string) => string) | null = null
): string => {
  if (!content) return ''

  let result = content

  // 第零步：保护 supplement 补充标签（开始/结束标签用占位符替代，内部内容正常渲染）
  result = result.replace(/<p\s+supplement\b[^>]*>/gi, '__SUPPLEMENT_OPEN__')
  result = result.replace(/<\/p>/gi, '__SUPPLEMENT_CLOSE__')

  // 第一步：提取所有最外层的 span 标签（不包含嵌套的同名标签），替换为占位符
  const spanTags: string[] = []
  const matchedSpans = matchOuterTags(result, 'span')

  // 由于 matchedSpans 是按起始位置从后往前排序的，替换顺序是从后往前
  // 这不会影响前面的索引，是正确的
  matchedSpans.forEach((spanInfo) => {
    const idx = spanTags.length
    spanTags.push(spanInfo.content)
    result = result.slice(0, spanInfo.start) + `__SPAN_TAG_${idx}__` + result.slice(spanInfo.end)
  })

  // 由于是从后往前替换，spanTags 中的顺序与占位符索引是一致的
  // 不需要反转

  // 第二步：提取所有表格和 img 标签，替换为占位符
  const tables: string[] = []
  const imgTags: string[] = []

  // 匹配完整的 <table>...</table>
  result = result.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (match) => {
    tables.push(match)
    return `__TABLE_${tables.length - 1}__`
  })

  // 匹配缺少 <table> 标签的表格片段
  result = result.replace(/(<thead\b[^>]*>[\s\S]*?|<tbody\b[^>]*>[\s\S]*?)<\/table>/gi, (match) => {
    const tableHtml = `<table>${match}</table>`
    tables.push(tableHtml)
    return `__TABLE_${tables.length - 1}__`
  })

  // 匹配所有 <img> 标签
  result = result.replace(/<img\s+[^>]*?>/gi, (match) => {
    imgTags.push(match)
    return `__IMG_TAG_${imgTags.length - 1}__`
  })

  // 第二步：对非表格内容进行 LaTeX 和 Markdown 处理
  // 定界符与后端 FormulaNormalizer 一致：$$..$$、\[..\]、$..$、\(..\)
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+\$|\\\([\s\S]*?\\\))/g
  const parts = result.split(regex)

  let processedResult = ''
  parts.forEach(part => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const latex = part.slice(2, -2).trim()
      processedResult += renderLatex(latex, true)
    } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
      const latex = part.slice(2, -2).trim()
      processedResult += renderLatex(latex, true)
    } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
      const latex = part.slice(2, -2).trim()
      processedResult += renderLatex(latex, false)
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const latex = part.slice(1, -1).trim()
      processedResult += renderLatex(latex, false)
    } else if (part.match(/!\[([^\]]*)\]\(([^)]+)\)/)) {
      const imgMatch = part.match(/!\[([^\]]*)\]\(([^)]+)\)/)
      if (imgMatch && imgMatch[2]) {
        const originalUrl = imgMatch[2]
        if (processImageFn) {
          const processedUrl = processImageFn(originalUrl)
          processedResult += `<img src="${processedUrl}" alt="${imgMatch[1] || ''}" style="max-width: 100%; height: auto;" />`
        } else {
          processedResult += part.replace(/\n/g, '<br>')
        }
      } else {
        processedResult += part.replace(/\n/g, '<br>')
      }
    } else if (part.includes('__TABLE_') || part.includes('__SPAN_TAG_') || part.includes('__IMG_TAG_')) {
      // 表格、span 或 img 占位符前后可能有其他文本，需要分别处理
      let textPart = part

      // 处理表格占位符
      const tableMatches = textPart.match(/__TABLE_\d+__/g) || []
      const tablePlaceholders = tableMatches.map((_, idx) => `__TEMP_TABLE_PLACEHOLDER_${idx}__`)
      tableMatches.forEach((match, idx) => {
        textPart = textPart.replace(match, tablePlaceholders[idx]!)
      })

      // 处理 span 占位符
      const spanMatches = textPart.match(/__SPAN_TAG_\d+__/g) || []
      const spanPlaceholders = spanMatches.map((_, idx) => `__TEMP_SPAN_PLACEHOLDER_${idx}__`)
      spanMatches.forEach((match, idx) => {
        textPart = textPart.replace(match, spanPlaceholders[idx]!)
      })

      // 处理 img 占位符
      const imgMatches = textPart.match(/__IMG_TAG_\d+__/g) || []
      const imgPlaceholders = imgMatches.map((_, idx) => `__TEMP_IMG_PLACEHOLDER_${idx}__`)
      imgMatches.forEach((match, idx) => {
        textPart = textPart.replace(match, imgPlaceholders[idx]!)
      })

      // 处理文本部分，转义HTML并转换换行
      textPart = textPart
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')

      // 还原表格占位符
      tablePlaceholders.forEach((placeholder, idx) => {
        textPart = textPart.replace(placeholder, tableMatches[idx]!)
      })

      // 还原 span 占位符
      spanPlaceholders.forEach((placeholder, idx) => {
        textPart = textPart.replace(placeholder, spanMatches[idx]!)
      })

      // 还原 img 占位符
      imgPlaceholders.forEach((placeholder, idx) => {
        textPart = textPart.replace(placeholder, imgMatches[idx]!)
      })

      processedResult += textPart
    } else {
      // 普通文本，转义 HTML 并转换换行
      let textPart = part

      // 转义 HTML（除了占位符）
      textPart = textPart
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')

      processedResult += textPart
    }
  })

  // 第三步：将表格占位符替换回原始 HTML，并处理表格内的 LaTeX 和图片
  tables.forEach((table, idx) => {
    let processedTable = table

    // 处理表格内的图片
    if (processImageFn) {
      processedTable = processedTable.replace(/<img\s+[^>]*?>/gi, (match) => {
        const srcMatch = match.match(/src=["']([^"']+)["']/i)
        if (srcMatch && srcMatch[1]) {
          const originalUrl = srcMatch[1]
          const processedSrc = processImageFn(originalUrl)
          return match.replace(/src=["'][^"']*["']/i, `src="${processedSrc}"`)
        }
        return match
      })
    }

    // 处理表格内的 LaTeX 公式
    processedTable = renderFormulas(processedTable)
    processedResult = processedResult.replace(`__TABLE_${idx}__`, processedTable)
  })

  // 第四步：还原 img 标签占位符，并处理图片路径
  imgTags.forEach((tag, idx) => {
    let processedImg = tag
    if (processImageFn) {
      // 提取 src 属性并处理
      const srcMatch = processedImg.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        const originalUrl = srcMatch[1]
        const processedSrc = processImageFn(originalUrl)
        processedImg = processedImg.replace(/src=["'][^"']*["']/i, `src="${processedSrc}"`)
      }
    }
    processedResult = processedResult.replace(`__IMG_TAG_${idx}__`, processedImg)
  })

  // 第五步：还原 span 标签占位符
  spanTags.forEach((tag, idx) => {
    // 处理 span 标签内的 LaTeX（四种定界符）
    const processedSpan = renderFormulas(tag)
    processedResult = processedResult.replace(`__SPAN_TAG_${idx}__`, processedSpan)
  })

  // 第六步：还原 supplement 标签
  processedResult = processedResult.replace(/__SUPPLEMENT_OPEN__/g, '<p supplement class="">')
  processedResult = processedResult.replace(/__SUPPLEMENT_CLOSE__/g, '</p>')

  return processedResult
}
