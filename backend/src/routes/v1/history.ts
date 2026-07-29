import { Hono } from 'hono'
import { getResumeByShareId, getResumesByUsername, getAllResumes } from '../../db/index.js'
import { fetchGitHubUserData } from '../../services/github.js'
import { renderTemplate } from '../../templates/registry.js'
import { compileLaTeX } from '../../utils/compile.js'

const history = new Hono()

history.get('/', async (c) => {
  const username = c.req.query('username')
  if (username) {
    return c.json(getResumesByUsername(username))
  }
  return c.json(getAllResumes())
})

history.get('/:shareId', async (c) => {
  const record = getResumeByShareId(c.req.param('shareId'))
  if (!record) return c.json({ error: 'Resume not found' }, 404)
  return c.json({
    ...record,
    custom_sections: JSON.parse(record.custom_sections),
    stats: JSON.parse(record.stats),
  })
})

history.get('/:shareId/pdf', async (c) => {
  const record = getResumeByShareId(c.req.param('shareId'))
  if (!record) return c.json({ error: 'Resume not found' }, 404)

  try {
    const customSections = JSON.parse(record.custom_sections)
    const userData = await fetchGitHubUserData(record.username, customSections)
    const texContent = renderTemplate(record.template, userData)
    const pdfBuffer = await compileLaTeX(texContent)

    c.header('Content-Type', 'application/pdf')
    c.header('Content-Disposition', `attachment; filename="${record.username}_resume.pdf"`)
    return c.body(new Uint8Array(pdfBuffer))
  } catch {
    return c.json({ error: 'Failed to regenerate PDF' }, 500)
  }
})

export default history
