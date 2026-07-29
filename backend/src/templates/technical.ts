import type { UserData } from '../services/github.js'
import { escapeLatex } from '../utils/latex.js'

export function getTechnicalTemplate(data: UserData): string {
  const langBar = Object.entries(data.languageBreakdown)
    .slice(0, 8)
    .map(([lang, count]) => `\\cvitem{${escapeLatex(lang)}}{${'\\textbullet{} '.repeat(Math.min(count, 10))}}`)
    .join('\n')

  const customTex = data.customSections
    .map(
      sec =>
        `\\section{${escapeLatex(sec.title)}}
${sec.items.map(item => `\\cvitem{}{${escapeLatex(item)}}`).join('\n')}`,
    )
    .join('\n')

  return `
\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}
\\usepackage[scale=0.75]{geometry}
\\usepackage{fontawesome}

\\name{${escapeLatex(data.name.split(' ')[0] || '')}}{${escapeLatex(data.name.split(' ').slice(1).join(' ') || '')}}
\\title{${escapeLatex(data.bio)}}
\\address{${escapeLatex(data.location)}}{}
\\email{${escapeLatex(data.email)}}
\\social[github]{${escapeLatex(data.githubUrl.split('/').pop() || '')}}

\\begin{document}
\\makecvtitle

\\section{Stats}
\\cvitem{Total Stars}{${data.stats.totalStars}}
\\cvitem{Total Repos}{${data.stats.totalRepos}}
\\cvitem{Contribution Years}{${data.stats.contributionYears}}

\\section{Languages}
${langBar}

\\section{Top Projects}
${data.projects
  .map(
    p =>
      `\\cvproject{${escapeLatex(p.name)}}{${escapeLatex(p.language)} $\\star${p.stars}} \\cvitem{}{${escapeLatex(p.description)}}`,
  )
  .join('\n')}

${customTex}

\\end{document}
  `.trim()
}
