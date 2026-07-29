import { getDb, type ResumeRecord } from './schema.js'
import { nanoid } from 'nanoid'
import type { CustomSection } from '../services/github.js'

export function createResume(
  username: string,
  template: string,
  customSections: CustomSection[],
  stats: Record<string, unknown>,
): ResumeRecord {
  const db = getDb()
  const shareId = nanoid(10)
  const stmt = db.prepare(`
    INSERT INTO resumes (username, template, custom_sections, stats, share_id)
    VALUES (?, ?, ?, ?, ?)
  `)
  stmt.run(username, template, JSON.stringify(customSections), JSON.stringify(stats), shareId)

  return db.prepare('SELECT * FROM resumes WHERE share_id = ?').get(shareId) as ResumeRecord
}

export function getResumeByShareId(shareId: string): ResumeRecord | undefined {
  return getDb().prepare('SELECT * FROM resumes WHERE share_id = ?').get(shareId) as ResumeRecord | undefined
}

export function getResumesByUsername(username: string): ResumeRecord[] {
  return getDb()
    .prepare('SELECT * FROM resumes WHERE username = ? ORDER BY created_at DESC')
    .all(username) as ResumeRecord[]
}

export function getAllResumes(limit = 20): ResumeRecord[] {
  return getDb()
    .prepare('SELECT * FROM resumes ORDER BY created_at DESC LIMIT ?')
    .all(limit) as ResumeRecord[]
}
