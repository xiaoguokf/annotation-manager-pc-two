/** 命名转换工具 */

/** kebab / snake / 驼峰 → PascalCase */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/\s/g, '')
}

/** kebab / snake / 驼峰 → camelCase */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l, i) => (i === 0 ? l.toLowerCase() : l.toUpperCase()))
    .replace(/\s/g, '')
}
