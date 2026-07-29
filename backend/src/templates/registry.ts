import type { UserData } from '../services/github.js'
import type { AccentColor, Font } from '../middleware/validation.js'
import { getModernTemplate } from './modern.js'
import { getClassicTemplate } from './classic.js'
import { getMinimalTemplate } from './minimal.js'
import { getTechnicalTemplate } from './technical.js'
import { getCreativeTemplate } from './creative.js'

type TemplateFn = (data: UserData, accent?: AccentColor, font?: Font) => string

export const templates: Record<string, TemplateFn> = {
  modern: getModernTemplate,
  classic: getClassicTemplate,
  minimal: getMinimalTemplate,
  technical: getTechnicalTemplate,
  creative: getCreativeTemplate,
}

export const validTemplates = Object.keys(templates)

export function renderTemplate(name: string, data: UserData, accent?: AccentColor, font?: Font): string {
  const fn = templates[name]
  if (!fn) throw new Error(`Unknown template: ${name}`)
  return fn(data, accent, font)
}
