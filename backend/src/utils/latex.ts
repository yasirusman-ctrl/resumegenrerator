const BS = '\x00bs\x00'

export function escapeLatex(str: string): string {
  if (!str) return ""
  return str
    .replace(/\\/g, BS)
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/\x00bs\x00/g, '\\textbackslash{}')
}
