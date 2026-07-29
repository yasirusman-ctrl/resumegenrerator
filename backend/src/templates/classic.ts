import type { UserData } from "../services/github.js";
import { escapeLatex } from "../utils/latex.js";

export function getClassicTemplate(data: UserData): string {
  let projectsTex = "";
  data.projects.forEach((p) => {
    projectsTex += `\\textbf{${escapeLatex(p.name)}} (${escapeLatex(p.language)}) \\hfill ${p.stars} Stars \\\\
${escapeLatex(p.description)} \\\\
\\vspace{0.5em}\n`;
  });

  return `
\\documentclass[10pt, letterpaper]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{${escapeLatex(data.name)}}} \\\\
  \\vspace{0.5em}
  ${escapeLatex(data.location)} $|$ \\href{mailto:${escapeLatex(data.email)}}{${escapeLatex(data.email)}} $|$ \\href{${escapeLatex(data.website)}}{Website} $|$ \\href{${escapeLatex(data.githubUrl)}}{GitHub}
\\end{center}

\\vspace{1em}
\\noindent\\textbf{\\Large Summary}
\\vspace{0.2em}
\\hrule
\\vspace{0.5em}
${escapeLatex(data.bio)}

\\vspace{1em}
\\noindent\\textbf{\\Large Top Languages}
\\vspace{0.2em}
\\hrule
\\vspace{0.5em}
${escapeLatex(data.languages)}

\\vspace{1em}
\\noindent\\textbf{\\Large Projects}
\\vspace{0.2em}
\\hrule
\\vspace{0.5em}
${projectsTex}

\\end{document}
  `.trim();
}
