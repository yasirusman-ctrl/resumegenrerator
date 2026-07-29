import type { UserData } from '../services/github.js'
import { escapeLatex } from '../utils/latex.js'

export function getCreativeTemplate(data: UserData): string {
  const projectsTex = data.projects
    .map(
      (p, i) =>
        `\\entry{${i + 1}}{${escapeLatex(p.name)}}{${escapeLatex(p.language)}}{$\\star${p.stars}}{${escapeLatex(p.description)}}`,
    )
    .join('\n')

  const customTex = data.customSections
    .map(
      sec =>
        `\\bigskip
\\heading{${escapeLatex(sec.title)}}
${sec.items.map(item => `\\item ${escapeLatex(item)}`).join('\n')}`,
    )
    .join('\n')

  return `
\\documentclass[10pt]{article}
\\usepackage[margin=0.6in]{geometry}
\\usepackage{hyperref}
\\usepackage{tikz}
\\usepackage{xcolor}

\\definecolor{primary}{HTML}{2563EB}
\\definecolor{secondary}{HTML}{7C3AED}
\\definecolor{accent}{HTML}{F59E0B}

\\newcommand{\\entry}[5]{
  \\noindent
  \\begin{minipage}[t]{0.08\\textwidth}
    {\\hfill \\color{primary}\\large\\textbf{#1}}
  \\end{minipage}
  \\hfill
  \\begin{minipage}[t]{0.88\\textwidth}
    \\textbf{#2} \\hfill {\\small\\color{gray}#3 \\quad #4} \\\\
    {\\small #5}
  \\end{minipage}
  \\\\[0.6em]
}

\\newcommand{\\heading}[1]{
  \\vspace{0.3em}
  {\\color{primary}\\large\\textbf{#1}}
  \\vspace{0.2em}
}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\begin{document}

\\begin{center}
  {\\Huge\\bfseries\\color{primary} ${escapeLatex(data.name)}} \\\\[0.2em]
  {\\small\\color{gray}
    ${escapeLatex(data.location)} $\\cdot$
    \\href{mailto:${escapeLatex(data.email)}}{${escapeLatex(data.email)}} $\\cdot$
    \\href{${escapeLatex(data.githubUrl)}}{GitHub}
  } \\\\[0.2em]
  {\\small\\color{secondary} ${escapeLatex(data.bio)}}
\\end{center}

\\vspace{0.5em}
\\begin{tikzpicture}
  \\fill[primary] (0,0) rectangle (\\textwidth,0.02);
\\end{tikzpicture}
\\vspace{0.5em}

\\heading{Skills \\& Languages}
\\hfill
{\\small ${Object.entries(data.languageBreakdown)
  .slice(0, 8)
  .map(([l, c]) => \`\\textcolor{primary}{\\textbf{\\textbullet}}\\ ${escapeLatex(l)}\`)
  .join(' \\quad ')}}
\\hfill

\\bigskip
\\heading{Projects}
${projectsTex}

${customTex}

\\vfill
\\begin{center}
  {\\tiny\\color{gray} Generated with GitHub Resume Generator}
\\end{center}

\\end{document}
  `.trim()
}
