/**
 * 公式定界符与渲染模式。
 *
 * 全站统一以 \( ... \) 作为**唯一**公式定界符（不再使用 \[ ... \]）。
 * 模型输出、公式库插入、用户手写都可能带 $ ... $ / $$ ... $$ / \[ ... \]，
 * 若不收敛，数据里就会混着几套定界符，渲染、校验、导出各认一套，容易漏。
 *
 * 归一化规则：
 * - $ ... $     → \( ... \)
 * - $$ ... $$   → \( ... \)
 * - \[ ... \]   → \( ... \)
 * - \( ... \)   保持不变
 *
 * 行内 / 行间不再由定界符表达，改按**内容**判断（见 isDisplayFormula）：
 * cases、array、matrix 这类块级环境本身就要换行对齐，按行间公式渲染更合理。
 *
 * 只处理 HTML 文本节点（按标签切分），不碰标签与属性；幂等。
 * 与后端 FormulaNormalizer 保持同一套规则。
 */

/**
 * 块级公式判据：内容里出现 LaTeX 环境（\begin{...}）即按行间渲染。
 *
 * 不枚举具体环境名：matrix 家族（pmatrix/bmatrix/Bmatrix/vmatrix/Vmatrix）、
 * cases、array、align*、aligned、gathered 等等一个都不能漏，漏一个就会把
 * 本该换行对齐的公式挤成行内。这些文档里的环境本质上都是块级的。
 */
const BLOCK_ENVIRONMENT = /\\begin\{/

/**
 * 公式内容是否应按行间（display）模式渲染。
 *
 * @param latex 公式内容（不含定界符）
 */
export function isDisplayFormula(latex: string): boolean {
  return BLOCK_ENVIRONMENT.test(latex)
}

/** $$ ... $$（先处理，避免被行内规则截断） */
const DISPLAY_DOLLAR = /\$\$([\s\S]+?)\$\$/g
/** \[ ... \]（历史写法，统一收敛为 \( ... \)） */
const DISPLAY_BRACKET = /\\\[([\s\S]+?)\\\]/g
/** $ ... $（允许跨行：模型常把 cases 这类内容写成多行） */
const INLINE_DOLLAR = /(?<!\$)\$([^$]+?)\$(?!\$)/g

/** 按标签切分，保留标签本身；偶数下标为文本节点 */
const TAG_SPLIT = /(<[^>]*>)/

/** 统一输出行内定界符 \( ... \) */
const toInlineDelimiters = (latex: string) => '\\(' + latex + '\\)'

/**
 * 将文本节点中的各类公式定界符统一改写为 \( ... \)。
 */
export function normalizeFormulaDelimiters(richText: string): string {
  if (!richText) {
    return richText
  }
  return richText
    .split(TAG_SPLIT)
    .map((segment, index) => {
      // 奇数下标是标签，原样保留
      if (index % 2 === 1) {
        return segment
      }
      return segment
        .replace(DISPLAY_DOLLAR, (_match, latex: string) => toInlineDelimiters(latex))
        .replace(DISPLAY_BRACKET, (_match, latex: string) => toInlineDelimiters(latex))
        .replace(INLINE_DOLLAR, (_match, latex: string) => toInlineDelimiters(latex))
    })
    .join('')
}

/**
 * 解码常见 HTML 实体。
 *
 * OCR 模型常把文本里的 \< / \> / & 转义成实体（如 a&gt;b、\ce{F + A-&gt; 8}），
 * 而公式（KaTeX / mhchem）只认原始字符，实体原样进入公式就会「乱码」（-> 变 -&gt;）。
 * 提示词已明确「禁止输出 HTML 实体」，这里作为兜底统一还原。
 */
export function decodeHtmlEntities(text: string | null): string {
  if (!text) {
    return ''
  }
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}
