import { describe, it, expect } from 'vitest'
import { escapeLatex } from './latex.js'

describe('escapeLatex', () => {
  it('handles empty input', () => {
    expect(escapeLatex('')).toBe('')
    expect(escapeLatex(' ')).toBe(' ')
  })

  it('escapes special characters', () => {
    expect(escapeLatex('&')).toBe('\\&')
    expect(escapeLatex('%')).toBe('\\%')
    expect(escapeLatex('$')).toBe('\\$')
    expect(escapeLatex('#')).toBe('\\#')
    expect(escapeLatex('_')).toBe('\\_')
    expect(escapeLatex('{')).toBe('\\{')
    expect(escapeLatex('}')).toBe('\\}')
    expect(escapeLatex('~')).toBe('\\textasciitilde{}')
    expect(escapeLatex('^')).toBe('\\textasciicircum{}')
    expect(escapeLatex('\\')).toBe('\\textbackslash{}')
  })

  it('escapes backslash first to prevent double-escaping', () => {
    expect(escapeLatex('\\&')).toBe('\\textbackslash{}\\&')
  })

  it('leaves normal text unchanged', () => {
    expect(escapeLatex('Hello World')).toBe('Hello World')
    expect(escapeLatex('foo-bar_baz')).not.toContain('foo-bar_baz')
  })
})
