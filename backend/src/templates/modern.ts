import type { UserData } from "../services/github.js";
import { escapeLatex } from "../utils/latex.js";

export function getModernTemplate(data: UserData): string {
  let projectsTex = "";
  data.projects.forEach((p) => {
    projectsTex += `\\cvproject{${escapeLatex(p.name)}}{${escapeLatex(p.language)}: ${escapeLatex(p.description)} $\\star$ ${p.stars}}\\vspace{0.5em}\n`;
  });

  return `
\\documentclass[11pt,a4paper,sans]{moderncv}
\\moderncvstyle{casual}
\\moderncvcolor{blue}
\\usepackage[scale=0.75]{geometry}

\\name{${escapeLatex(data.name.split(' ')[0] || '')}}{${escapeLatex(data.name.split(' ').slice(1).join(' ') || '')}}
\\title{Software Engineer}
\\address{${escapeLatex(data.location)}}{}
\\email{${escapeLatex(data.email)}}
\\homepage{${escapeLatex(data.website.replace('https://', '').replace('http://', ''))}}
\\social[github]{${escapeLatex(data.githubUrl.split('/').pop() || '')}}

\\newcommand*{\\cvproject}[2]{
  \\cvitem{\\textbf{#1}}{#2}
}

\\begin{document}
\\makecvtitle

\\section{Summary}
\\cvitem{}{${escapeLatex(data.bio)}}

\\section{Top Languages}
\\cvitem{}{${escapeLatex(data.languages)}}

\\section{Projects}
${projectsTex}

\\end{document}
  `.trim();
}
