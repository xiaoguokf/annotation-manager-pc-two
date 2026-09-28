/**
 * 公式定界符归一化。
 *
 * 全站统一以 \( ... \)（行内）、\[ ... \]（行间）为唯一写法。
 * 模型输出、公式库插入、用户手写都可能带 $ ... $ / $$ ... $$，
 * 若不收敛，数据里就会混着两种定界符（渲染、校验、导出各认一套，容易漏）。
 *
 * 规则：
 * - $$ ... $$ → \[ ... \]
 * - $ ... $   → \( ... \)
 * - \( ... \)、\[ ... \] 保持不变
 *
 * 只处理 HTML 文本节点（按标签切分），不碰标签与属性；幂等。
 * 与后端 FormulaNormalizer 保持同一套规则。
 */

/** 成对的公式定界符（行间优先，避免 $$ 被行内规则截断） */
const DISPLAY_DOLLAR = /\$\$([\s\S]+?)\$\$/g
/** 行内公式：允许跨行（模型常把 cases 这类内容写成多行） */
const INLINE_DOLLAR = /(?<!\$)\$([^$]+?)\$(?!\$)/g

/** 按标签切分，保留标签本身；偶数下标为文本节点 */
const TAG_SPLIT = /(<[^>]*>)/

/**
 * 将文本节点中的 $ 定界符统一改写为 \ 形式。
 * 已经是 \ 形式的片段不受影响。
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
        .replace(DISPLAY_DOLLAR, (_match, latex: string) => `\\[${latex}\\]`)
        .replace(INLINE_DOLLAR, (_match, latex: string) => `\\(${latex}\\)`)
    })
    .join('')
}
