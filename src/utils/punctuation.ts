/**
 * 半角标点 → 中文全角标点。
 *
 * 规则：
 * - 题号 / 编号（如 1. 一、 12． 及被文本样式 span 包裹的 <span>1</span>.）整体原样保留，不转换
 * - 保护 LaTeX 公式（$...$ / $$...$$ / \(...\) / \[...\]）与 HTML 标签、实体，内部字符一律不动
 * - 仅在纯文本片段上替换标点
 * - 引号按出现顺序成对转换为 “ ” 与 ‘ ’
 * - 与数字相邻的句点保持半角，避免 3.14、No.1 被误改
 * - 连续 3 个及以上半角句点归一为中文省略号 ……
 */

/**
 * 需要原样保留的片段（含一个捕获组，供 split 后按下标还原）。
 *
 * 题号必须排在 HTML 标签之前：否则 <span>1</span>. 会被拆成「标签 + 文本」，
 * 题号后的点落到文本片段里被误转为句号。
 * 题号口径与 QuestionEditor 去除题号的规则一致：数字（半角/全角，最多 3 位）
 * 或中文数字 + 顿号/句点/点号，可选被 span 包裹。
 */
const PROTECTED =
  /((?:<span[^>]*>\s*)?(?:[0-9０-９]{1,3}|[一二三四五六七八九十百千]{1,3})\s*(?:<\/span>\s*)?[、．.]|\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$<]+\$|\\\([\s\S]*?\\\)|<[^>]*>|&[a-zA-Z#0-9]+;)/g

/** 单字符半角 → 全角映射 */
const CHAR_MAP: Record<string, string> = {
  ',': '，',
  ';': '；',
  ':': '：',
  '?': '？',
  '!': '！',
  '(': '（',
  ')': '）',
  '[': '【',
  ']': '】',
  '~': '～',
}

/** 转换单个纯文本片段（不含公式、标签、题号） */
const convertPlainText = (text: string): string => {
  // 省略号优先：连续 3 个及以上半角句点 → ……
  const src = text.replace(/\.{3,}/g, '……')

  let result = ''
  let doubleQuoteOpen = true
  let singleQuoteOpen = true

  for (let i = 0; i < src.length; i++) {
    const ch = src[i] as string

    if (ch === '.') {
      const prev = src[i - 1]
      const next = src[i + 1]
      const nearDigit =
        (prev !== undefined && /\d/.test(prev)) || (next !== undefined && /\d/.test(next))
      result += nearDigit ? '.' : '。'
      continue
    }

    if (ch === '"') {
      result += doubleQuoteOpen ? '“' : '”'
      doubleQuoteOpen = !doubleQuoteOpen
      continue
    }

    if (ch === "'") {
      result += singleQuoteOpen ? '‘' : '’'
      singleQuoteOpen = !singleQuoteOpen
      continue
    }

    result += CHAR_MAP[ch] ?? ch
  }

  return result
}

/**
 * 把文本中的半角标点转换为中文标点。
 * 题号、公式段、HTML 标签与实体会被原样保留，不做任何替换。
 */
export const toChinesePunctuation = (input: string): string => {
  if (!input) return input
  return input
    .split(PROTECTED)
    .map((segment, index) => (index % 2 === 1 ? segment : convertPlainText(segment)))
    .join('')
}
