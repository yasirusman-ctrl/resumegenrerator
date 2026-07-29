import { z } from 'zod'
import type { Context, Next } from 'hono'

export const generateSchema = z.object({
  username: z
    .string()
    .min(1, 'GitHub username is required')
    .max(39, 'GitHub username is too long')
    .regex(/^[a-zA-Z0-9-]+$/, 'Invalid GitHub username format'),
  template: z.enum(['modern', 'classic', 'minimal', 'technical', 'creative']).default('modern'),
  customSections: z
    .array(
      z.object({
        title: z.string().min(1).max(100),
        items: z.array(z.string().min(1).max(500)).min(1).max(20),
      }),
    )
    .max(10)
    .default([]),
})

export type GenerateInput = z.infer<typeof generateSchema>

export function validate<T>(schema: z.ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const body = await c.req.json().catch(() => ({}))
    const result = schema.safeParse(body)
    if (!result.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        400,
      )
    }
    ;(c as any).set('validated', result.data)
    await next()
  }
}
