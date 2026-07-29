import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertCircle, Download, Loader2, Plus, Trash2, Link2, Clock, ChevronDown, ChevronUp, GripVertical, FileText, Code } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${location.hostname}:3000/ws`

const ACCENTS = ['blue', 'green', 'red', 'purple', 'orange', 'teal', 'pink', 'gray'] as const
const FONTS = ['inter', 'outfit', 'roboto', 'mono', 'serif'] as const

interface CustomSection {
  id: number
  title: string
  items: string[]
}

interface HistoryEntry {
  id: number
  username: string
  template: string
  share_id: string
  created_at: string
}

let sectionIdCounter = 0
function newSection(): CustomSection {
  return { id: ++sectionIdCounter, title: '', items: [''] }
}

function App() {
  const [username, setUsername] = useState('')
  const [template, setTemplate] = useState('modern')
  const [format, setFormat] = useState<'pdf' | 'html'>('pdf')
  const [accent, setAccent] = useState<string>('blue')
  const [font, setFont] = useState<string>('inter')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [shareId, setShareId] = useState('')
  const [resultHtml, setResultHtml] = useState('')
  const [resultPdfBlob, setResultPdfBlob] = useState<Blob | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showSections, setShowSections] = useState(false)
  const [customSections, setCustomSections] = useState<CustomSection[]>([newSection()])
  const [wsProgress, setWsProgress] = useState<string[]>([])

  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const parseUsername = (input: string): string => {
    let p = input.trim()
    if (p.includes('github.com/')) p = p.split('github.com/')[1].split('/')[0]
    return p
  }

  const fetchHistory = useCallback(async (user: string) => {
    try {
      const res = await fetch(`${API_URL}/resumes?username=${encodeURIComponent(user)}`)
      if (res.ok) setHistory(await res.json())
    } catch { /* ignore */ }
  }, [])

  const handleDragStart = (idx: number) => { dragItem.current = idx }
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const arr = [...customSections]
    const [removed] = arr.splice(dragItem.current, 1)
    arr.splice(dragOverItem.current, 0, removed)
    setCustomSections(arr)
    dragItem.current = null
    dragOverItem.current = null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseUsername(username)
    if (!parsed) { setError('Please enter a GitHub username or URL'); return }

    setLoading(true)
    setError('')
    setProgress('Generating...')
    setShareId('')
    setResultPdfBlob(null)
    setResultHtml('')
    setWsProgress([])

    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: parsed,
          template,
          format,
          accent,
          font,
          customSections: customSections.filter(s => s.title.trim()),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate resume')
      }

      setShareId(res.headers.get('X-Share-Id') || '')

      if (format === 'html') {
        setResultHtml(await res.text())
      } else {
        setResultPdfBlob(await res.blob())
      }

      fetchHistory(parsed)
      setProgress('Ready!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = () => {
    if (!resultPdfBlob) return
    const url = window.URL.createObjectURL(resultPdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${parseUsername(username)}_resume.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const addSection = () => setCustomSections(s => [...s, newSection()])
  const removeSection = (id: number) => setCustomSections(s => s.filter(x => x.id !== id))

  const updateSection = (id: number, field: 'title' | 'items', value: string | string[]) =>
    setCustomSections(s => s.map(sec => sec.id === id ? { ...sec, [field]: value } : sec))

  const addItem = (id: number) =>
    setCustomSections(s => s.map(sec => sec.id === id ? { ...sec, items: [...sec.items, ''] } : sec))

  const updateItem = (secId: number, itemIdx: number, value: string) =>
    setCustomSections(s => s.map(sec =>
      sec.id === secId ? { ...sec, items: sec.items.map((it, j) => j === itemIdx ? value : it) } : sec,
    ))

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">GitHub to Resume</h1>
        <p className="subtitle">Transform your GitHub profile into a PDF or HTML resume.</p>
      </header>

      <div className="card">
        {error && (
          <div className="error-message">
            <AlertCircle size={20} className="btn-icon" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">GitHub Username or URL</label>
            <input id="username" className="form-input" placeholder="e.g., torvalds or https://github.com/torvalds"
              value={username} onChange={e => setUsername(e.target.value)} disabled={loading} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Template</label>
              <select className="form-select" value={template} onChange={e => setTemplate(e.target.value)} disabled={loading}>
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
                <option value="technical">Technical</option>
                <option value="creative">Creative</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Format</label>
              <div className="toggle-group">
                <button type="button" className={`toggle-btn ${format === 'pdf' ? 'active' : ''}`}
                  onClick={() => setFormat('pdf')}><FileText size={14} /> PDF</button>
                <button type="button" className={`toggle-btn ${format === 'html' ? 'active' : ''}`}
                  onClick={() => setFormat('html')}><Code size={14} /> HTML</button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Accent Color</label>
              <div className="color-picker">
                {ACCENTS.map(c => (
                  <button key={c} type="button"
                    className={`color-swatch ${c} ${accent === c ? 'selected' : ''}`}
                    onClick={() => setAccent(c)} title={c} />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Font</label>
              <select className="form-select" value={font} onChange={e => setFont(e.target.value)} disabled={loading}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <button type="button" className="btn btn-secondary" onClick={() => setShowSections(!showSections)}
            style={{ marginBottom: '1rem' }}>
            {showSections ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Custom Sections {customSections[0]?.title ? `(${customSections.length})` : ''}
          </button>

          {showSections && (
            <div className="sections-panel">
              {customSections.map((section, si) => (
                <div key={section.id} className="section-card"
                  draggable onDragStart={() => handleDragStart(si)}
                  onDragEnter={() => handleDragEnter(si)} onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}>
                  <div className="section-header">
                    <span className="drag-handle"><GripVertical size={14} /></span>
                    <input className="form-input" placeholder="Section title"
                      value={section.title} onChange={e => updateSection(section.id, 'title', e.target.value)} />
                    <button type="button" className="btn-icon-only" onClick={() => removeSection(section.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {section.items.map((item, ii) => (
                    <input key={ii} className="form-input section-item" placeholder={`Item ${ii + 1}`}
                      value={item} onChange={e => updateItem(section.id, ii, e.target.value)} />
                  ))}
                  <button type="button" className="btn btn-small" onClick={() => addItem(section.id)}>
                    <Plus size={14} /> Add item
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-small" onClick={addSection}>
                <Plus size={14} /> Add section
              </button>
            </div>
          )}

          <button type="submit" className="btn" disabled={loading}>
            {loading ? (
              <><Loader2 size={20} className="loader btn-icon" />{progress || 'Generating...'}</>
            ) : (
              <><Download size={20} className="btn-icon" />Generate {format === 'html' ? 'HTML' : 'PDF'}</>
            )}
          </button>
        </form>

        {wsProgress.length > 0 && (
          <div className="progress-steps">
            {wsProgress.map((step, i) => <div key={i} className="progress-step">{step}</div>)}
          </div>
        )}

        {resultPdfBlob && (
          <div className="result-panel">
            <div className="result-actions">
              <button className="btn" onClick={downloadPdf}><Download size={18} /> Download PDF</button>
              {shareId && (
                <div className="share-link">
                  <Link2 size={16} />
                  <input readOnly value={`${window.location.origin}/api/v1/resumes/${shareId}/pdf`}
                    onClick={e => (e.target as HTMLInputElement).select()} />
                </div>
              )}
            </div>
            <embed src={window.URL.createObjectURL(resultPdfBlob)} type="application/pdf" className="pdf-preview" />
          </div>
        )}

        {resultHtml && (
          <div className="result-panel">
            <div className="result-actions">
              <a className="btn" href={`data:text/html;charset=utf-8,${encodeURIComponent(resultHtml)}`}
                download={`${parseUsername(username)}_resume.html`}><Download size={18} /> Download HTML</a>
              {shareId && (
                <>
                  <a className="btn btn-secondary" href={`/api/v1/resumes/${shareId}/html`} target="_blank">
                    <FileText size={16} /> View Live Page
                  </a>
                  <div className="share-link">
                    <Link2 size={16} />
                    <input readOnly value={`${window.location.origin}/api/v1/resumes/${shareId}/html`}
                      onClick={e => (e.target as HTMLInputElement).select()} />
                  </div>
                </>
              )}
            </div>
            <iframe srcDoc={resultHtml} className="html-preview" title="resume preview" />
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="card history-card">
          <h3><Clock size={18} /> Recent Resumes</h3>
          <div className="history-list">
            {history.slice(0, 5).map(entry => (
              <div key={entry.id} className="history-item">
                <span>{entry.template} — {new Date(entry.created_at).toLocaleDateString()}</span>
                <div className="history-links">
                  <a href={`${API_URL}/resumes/${entry.share_id}/pdf`} target="_blank" title="PDF"><Download size={14} /></a>
                  <a href={`${API_URL}/resumes/${entry.share_id}/html`} target="_blank" title="HTML"><Code size={14} /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
