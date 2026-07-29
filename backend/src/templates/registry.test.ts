import { describe, it, expect } from 'vitest'
import { validTemplates, renderTemplate } from './registry.js'
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
  languageBreakdown: { TypeScript: 5, Rust: 3 },
  stats: { totalStars: 10, totalForks: 2, totalRepos: 5, totalPRs: 3, topLanguages: { TypeScript: 5 }, contributionYears: 2 },
  customSections: [],
  projects: [
    { name: 'proj1', description: 'First project', url: 'https://github.com/testuser/proj1', stars: 10, language: 'TypeScript' },
  ],
}

describe('template registry', () => {
  it('includes all templates', () => {
    expect(validTemplates).toContain('modern')
    expect(validTemplates).toContain('classic')
    expect(validTemplates).toContain('minimal')
    expect(validTemplates).toContain('technical')
    expect(validTemplates).toContain('creative')
  })

  it('renders all templates without errors', () => {
    for (const name of validTemplates) {
      const result = renderTemplate(name, mockUser)
      expect(result).toContain('\\begin{document}')
      expect(result).toContain('proj1')
    }
  })

  it('throws for unknown template', () => {
    expect(() => renderTemplate('unknown', mockUser)).toThrow('Unknown template')
  })
})
