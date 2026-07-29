import { describe, it, expect } from 'vitest'
import { validTemplates, getTemplate, renderTemplate } from './registry.js'
import type { UserData } from '../services/github.js'

const mockUser: UserData = {
  name: 'Test User',
  bio: 'A test bio',
  location: 'Earth',
  email: 'test@example.com',
  website: 'https://example.com',
  githubUrl: 'https://github.com/testuser',
  avatarUrl: 'https://avatars.githubusercontent.com/u/0',
  languages: 'TypeScript, Rust',
  projects: [
    { name: 'proj1', description: 'First project', url: 'https://github.com/testuser/proj1', stars: 10, language: 'TypeScript' },
  ],
}

describe('template registry', () => {
  it('includes modern and classic templates', () => {
    expect(validTemplates).toContain('modern')
    expect(validTemplates).toContain('classic')
  })

  it('returns template functions', () => {
    expect(getTemplate('modern')).toBeDefined()
    expect(getTemplate('classic')).toBeDefined()
    expect(getTemplate('nonexistent')).toBeUndefined()
  })

  it('renders templates without errors', () => {
    const modern = renderTemplate('modern', mockUser)
    expect(modern).toContain('Test')
    expect(modern).toContain('User')
    expect(modern).toContain('\\begin{document}')

    const classic = renderTemplate('classic', mockUser)
    expect(classic).toContain('Test User')
    expect(classic).toContain('\\begin{document}')
  })

  it('throws for unknown template', () => {
    expect(() => renderTemplate('unknown', mockUser)).toThrow('Unknown template')
  })
})
