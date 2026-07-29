import type { UserData, Project, CustomSection } from '../services/github.js'
import type { AccentColor, Font } from '../middleware/validation.js'

const accentMap: Record<string, string> = {
  blue: '#2563eb', green: '#16a34a', red: '#dc2626',
  purple: '#9333ea', orange: '#ea580c', teal: '#0d9488',
  pink: '#db2777', gray: '#4b5563',
}

const fontMap: Record<string, string> = {
  inter: "'Inter', sans-serif",
  outfit: "'Outfit', sans-serif",
  roboto: "'Roboto', sans-serif",
  mono: "'JetBrains Mono', monospace",
  serif: "'Merriweather', serif",
}

export function renderHtmlResume(
  data: UserData,
  accent: AccentColor = 'blue',
  font: Font = 'inter',
): string {
  const color = accentMap[accent] || accentMap.blue
  const fontFamily = fontMap[font] || fontMap.inter

  const projectItems = data.projects
    .map((p: Project) => `
      <div class="project">
        <div class="project-header">
          <a href="${p.url}" target="_blank">${escapeHtml(p.name)}</a>
          <span class="lang">${escapeHtml(p.language)}</span>
        </div>
        <p>${escapeHtml(p.description || 'No description')}</p>
      </div>`)
    .join('')

  const orgBadges = data.organizations
    .map((o: string) => `<span class="org-badge">${escapeHtml(o)}</span>`)
    .join('')

  const customHtml = data.customSections
    .map((s: CustomSection) => `
      <section>
        <h2>${escapeHtml(s.title)}</h2>
        <ul>${s.items.map((i: string) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
      </section>`)
    .join('')

  const bytesEntries = Object.entries(data.languageBytes).slice(0, 8) as [string, number][]
  const totalBytes = bytesEntries.reduce((a, [, b]) => a + b, 0)
  const langBars = bytesEntries
    .map(([lang, bytes]) => {
      const pct = totalBytes ? ((bytes / totalBytes) * 100).toFixed(1) : '0'
      return `
        <div class="lang-bar">
          <span>${escapeHtml(lang)}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span class="pct">${pct}%</span>
        </div>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(data.name)} — Resume</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${fontFamily};background:#f8fafc;color:#1e293b;line-height:1.6;padding:2rem}
.container{max-width:800px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:2.5rem}
.header{text-align:center;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:3px solid ${color}}
.header h1{font-size:2rem;color:#0f172a}
.header .bio{color:#64748b;margin-top:.25rem}
.header .meta{font-size:.85rem;color:#94a3b8;margin-top:.5rem}
.header .meta a{color:${color};text-decoration:none}
.orgs{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:.75rem}
.org-badge{background:${color}15;color:${color};padding:.2rem .6rem;border-radius:999px;font-size:.8rem;font-weight:600}
section{margin-bottom:1.5rem}
section h2{font-size:1.1rem;color:${color};margin-bottom:.75rem;padding-bottom:.25rem;border-bottom:2px solid #e2e8f0}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.75rem}
.stat-card{text-align:center;padding:.75rem;background:#f8fafc;border-radius:8px}
.stat-card .num{font-size:1.5rem;font-weight:700;color:${color}}
.stat-card .label{font-size:.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em}
.project{margin-bottom:.75rem}
.project-header{display:flex;justify-content:space-between;align-items:center}
.project-header a{font-weight:600;color:#0f172a;text-decoration:none}
.project-header a:hover{color:${color}}
.project-header .lang{font-size:.8rem;color:${color};background:${color}10;padding:.1rem .5rem;border-radius:4px}
.project p{font-size:.9rem;color:#64748b;margin-top:.2rem}
.lang-bar{display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem}
.lang-bar span:first-child{width:100px;font-size:.85rem;font-weight:600}
.bar-track{flex:1;height:8px;background:#e2e8f0;border-radius:4px}
.bar-fill{height:100%;border-radius:4px;transition:width .3s}
.pct{width:40px;font-size:.8rem;color:#94a3b8;text-align:right}
ul{padding-left:1.25rem}
li{margin-bottom:.25rem;font-size:.9rem;color:#475569}
.footer{text-align:center;font-size:.75rem;color:#cbd5e1;margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e8f0}
@media print{body{background:#fff;padding:0}.container{box-shadow:none;padding:1.5rem}}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${escapeHtml(data.name)}</h1>
    <div class="bio">${escapeHtml(data.bio)}</div>
    <div class="meta">
      ${escapeHtml(data.location)} &middot;
      <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a> &middot;
      <a href="${escapeHtml(data.githubUrl)}" target="_blank">GitHub</a>
    </div>
    ${orgBadges ? `<div class="orgs">${orgBadges}</div>` : ''}
  </div>

  <section>
    <h2>GitHub Stats</h2>
    <div class="stats">
      <div class="stat-card"><div class="num">${data.stats.totalStars}</div><div class="label">Stars</div></div>
      <div class="stat-card"><div class="num">${data.stats.totalRepos}</div><div class="label">Repos</div></div>
      <div class="stat-card"><div class="num">${data.stats.contributionYears}</div><div class="label">Years</div></div>
      <div class="stat-card"><div class="num">${data.stats.totalPRs}</div><div class="label">PRs</div></div>
    </div>
  </section>

  <section>
    <h2>Languages</h2>
    ${langBars}
  </section>

  <section>
    <h2>Top Projects</h2>
    ${projectItems}
  </section>

  ${customHtml}

  <div class="footer">Generated with GitHub Resume Generator</div>
</div>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
