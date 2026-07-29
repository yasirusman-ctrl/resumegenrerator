import { Octokit } from '@octokit/rest'
import { cache } from './cache.js'
import { createLogger } from '../utils/logger.js'
import type { RestEndpointMethodTypes } from '@octokit/rest'

const log = createLogger('github')

type Repo = RestEndpointMethodTypes['repos']['listForUser']['response']['data'][number]
type User = RestEndpointMethodTypes['users']['getByUsername']['response']['data']

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

export interface Project {
  name: string
  description: string
  url: string
  stars: number
  language: string
}

export interface UserStats {
  totalStars: number
  totalForks: number
  totalRepos: number
  totalPRs: number
  topLanguages: Record<string, number>
  contributionYears: number
}

export interface CustomSection {
  title: string
  items: string[]
}

export interface UserData {
  name: string
  bio: string
  location: string
  email: string
  website: string
  githubUrl: string
  avatarUrl: string
  languages: string
  languageBreakdown: Record<string, number>
  projects: Project[]
  stats: UserStats
  customSections: CustomSection[]
}

async function retryRequest<T>(
  request: (opts: any) => Promise<T>,
  opts: any,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await request(opts)
    } catch (error: unknown) {
      if (attempt === maxRetries) throw error
      const err = error as { status?: number; headers?: Record<string, string> }
      if (err.status === 403 || err.status === 429) {
        const retryAfter = err.headers?.['retry-after'] || String(baseDelay)
        await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * attempt))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

export async function fetchGitHubUserData(
  username: string,
  customSections: CustomSection[] = [],
): Promise<UserData> {
  const cacheKey = cache.cacheKey('github', username.toLowerCase())
  const cached = await cache.get(cacheKey)
  if (cached) {
    const parsed = JSON.parse(cached) as UserData
    parsed.customSections = customSections
    return parsed
  }

  const sanitized = username.trim().toLowerCase()

  const [user, repos, events] = await Promise.all([
    retryRequest<{ data: User }>(octokit.rest.users.getByUsername, { username: sanitized }),
    retryRequest<{ data: Repo[] }>(octokit.rest.repos.listForUser, {
      username: sanitized,
      sort: 'pushed',
      per_page: 100,
    }),
    retryRequest<{ data: any[] }>(octokit.rest.activity.listPublicEventsForUser, {
      username: sanitized,
      per_page: 100,
    }),
  ])

  const allRepos = repos.data.filter(r => !r.fork)
  const topRepos = [...allRepos].sort((a, b) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0)).slice(0, 4)

  const languageBytes: Record<string, number> = {}
  allRepos.forEach(r => {
    if (r.language) {
      languageBytes[r.language] = (languageBytes[r.language] || 0) + 1
    }
  })

  const sortedLangs = Object.entries(languageBytes)
    .sort(([, a], [, b]) => b - a)

  const totalStars = allRepos.reduce((s, r) => s + (r.stargazers_count ?? 0), 0)
  const totalForks = allRepos.reduce((s, r) => s + (r.forks_count ?? 0), 0)
  const totalPRs = events.data.filter((e: any) => e.type === 'PullRequestEvent').length

  const userCreated = user.data.created_at ? new Date(user.data.created_at).getFullYear() : 0
  const contributionYears = userCreated ? new Date().getFullYear() - userCreated : 0

  const stats: UserStats = {
    totalStars,
    totalForks,
    totalRepos: allRepos.length,
    totalPRs,
    topLanguages: Object.fromEntries(sortedLangs.slice(0, 10)),
    contributionYears,
  }

  const data: UserData = {
    name: user.data.name || user.data.login,
    bio: user.data.bio || 'Software Engineer',
    location: user.data.location || 'Earth',
    email: user.data.email || `${user.data.login}@users.noreply.github.com`,
    website: user.data.blog || user.data.html_url,
    githubUrl: user.data.html_url,
    avatarUrl: user.data.avatar_url,
    languages: sortedLangs.slice(0, 5).map(([l]) => l).join(', ') || 'JavaScript',
    languageBreakdown: Object.fromEntries(sortedLangs),
    projects: topRepos.map(r => ({
      name: r.name,
      description: r.description || '',
      url: r.html_url,
      stars: r.stargazers_count ?? 0,
      language: r.language || 'Unknown',
    })),
    stats,
    customSections,
  }

  await cache.set(cacheKey, JSON.stringify(data), 300000)
  return data
}
