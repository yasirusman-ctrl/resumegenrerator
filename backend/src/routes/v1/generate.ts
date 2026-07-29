import { Hono } from 'hono'
import { fetchGitHubUserData } from '../../services/github.js'
import { renderTemplate } from '../../templates/registry.js'
import { compileLaTeX } from '../../utils/compile.js'
import { createResume } from '../../db/index.js'
import { validate, generateSchema, type GenerateInput } from '../../middleware/validation.js'
import { createLogger } from '../../utils/logger.js'

const log = createLogger('route:generate')

type Vars = { validated: GenerateInput }

const generate = new Hono<{ Variables: Vars }>()

generate.post('/', validate(generateSchema), async (c) => {
  const { username, template, customSections } = c.var.validated

  try {
    const userData = await fetchGitHubUserData(username, customSections)
    const texContent = renderTemplate(template, userData)

    let pdfBuffer: Buffer
    try {
      pdfBuffer = await compileLaTeX(texContent)
    } catch {
      return c.json({ error: 'Failed to compile LaTeX to PDF', tex: texContent }, 500)
    }

    const record = createResume(username, template, customSections, userData.stats as any)

    c.header('Content-Type', 'application/pdf')
    c.header('Content-Disposition', `attachment; filename="${username}_resume.pdf"`)
    c.header('X-Share-Id', record.share_id)
    return c.body(new Uint8Array(pdfBuffer))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    log.error({ err: message })
    return c.json({ error: message }, 500)
  }
})

export default generate
