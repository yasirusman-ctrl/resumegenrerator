import { execFile } from 'node:child_process'
import { writeFile, unlink, mkdtemp, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const LATEX_ONLINE_URL = 'https://latexonline.cc/compile'

export type CompileStep = 'preparing' | 'compiling-local' | 'compiling-remote' | 'done' | 'error'
export type ProgressCallback = (step: CompileStep, message: string) => void

export async function compileLaTeX(
  texContent: string,
  onProgress?: ProgressCallback,
  timeoutMs = 30000,
): Promise<Buffer> {
  onProgress?.('preparing', 'Writing LaTeX source')

  const pdf = await tryLocalCompile(texContent, onProgress, timeoutMs)
  if (pdf) {
    onProgress?.('done', 'PDF compiled successfully')
    return pdf
  }

  return remoteCompile(texContent, onProgress, timeoutMs)
}

async function tryLocalCompile(
  texContent: string,
  onProgress?: ProgressCallback,
  timeoutMs?: number,
): Promise<Buffer | null> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'resume-'))
  const texPath = join(tmpDir, 'resume.tex')

  try {
    await writeFile(texPath, texContent)
    onProgress?.('compiling-local', 'Compiling with pdflatex...')

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const proc = execFile(
        'pdflatex',
        ['-interaction=nonstopmode', '-output-directory', tmpDir, texPath],
        { timeout: timeoutMs },
      )

      let stderr = ''
      proc.stderr?.on('data', (d: string) => { stderr += d })

      proc.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ENOENT') reject(new Error('pdflatex not found'))
        else reject(err)
      })

      proc.on('exit', (code) => {
        if (code !== 0) reject(new Error(`pdflatex exited ${code}: ${stderr.slice(0, 200)}`))
        else resolve(readFile(join(tmpDir, 'resume.pdf')))
      })
    })

    return pdfBuffer
  } catch {
    return null
  } finally {
    cleanTmpDir(tmpDir)
  }
}

async function remoteCompile(
  texContent: string,
  onProgress?: ProgressCallback,
  timeoutMs = 30000,
): Promise<Buffer> {
  onProgress?.('compiling-remote', 'Compiling on remote service...')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(
      `${LATEX_ONLINE_URL}?text=${encodeURIComponent(texContent)}`,
      { signal: controller.signal },
    )

    if (!response.ok) throw new Error(`LaTeX service responded with ${response.status}`)

    onProgress?.('done', 'PDF compiled successfully')
    return Buffer.from(await response.arrayBuffer())
  } finally {
    clearTimeout(timer)
  }
}

function cleanTmpDir(dir: string) {
  import('node:fs').then(fs => {
    fs.rmSync(dir, { recursive: true, force: true })
  })
}
