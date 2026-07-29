import type { UserData } from '../services/github.js'
import { escapeLatex } from '../utils/latex.js'

export function getMinimalTemplate(data: UserData): string {
  const projectsTex = data.projects
    .map(p => `${escapeLatex(p.name)}  \\hfill {\\small ${escapeLatex(p.language)}}`)
    .join(' \\\\\n')

  const customTex = data.customSections
    .map(
      sec =>
        `\\noindent\\textbf{\\large ${escapeLatex(sec.title)}} \\\\
${sec.items.map(item => `  ${escapeLatex(item)} \\\\`).join('\n')}`,
    )
    .join('\n\n')

  return `
\\documentclass[10pt,letterpaper]{article}
\\usepackage[margin=0.7in]{geometry}
\\usepackage{hyperref}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\begin{document}

{\\huge \\textbf{${escapeLatex(data.name)}}} \\\\[0.3em]
{\\small ${escapeLatex(data.location)} $\\cdot$ \\href{mailto:${escapeLatex(data.email)}}{${escapeLatex(data.email)}} $\\cdot$ \\href{${escapeLatex(data.githubUrl)}}{GitHub}} \\\\[0.5em]

\\noindent\\textbf{\\large Summary} \\\\
${escapeLatex(data.bio)} \\\\[0.5em]

\\noindent\\textbf{\\large Languages} \\\\
${escapeLatex(data.languages)} \\\\[0.5em]

\\noindent\\textbf{\\large Projects} \\\\
\\begin{enumerate}
${data.projects.map(p => `  \\item \\textbf{${escapeLatex(p.name)}} --- ${escapeLatex(p.description)}`).join('\n')}
\\end{enumerate}

${customTex ? `\\bigskip\n${customTex}` : ''}

\\end{document}
  `.trim()
}
