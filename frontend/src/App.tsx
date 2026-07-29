import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, Download, Loader2, Plus, Trash2, Link2, Clock, ChevronDown, ChevronUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${location.hostname}:3000/ws`

interface CustomSection {
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

function App() {
  const [username, setUsername] = useState('')
  const [template, setTemplate] = useState('modern')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [shareId, setShareId] = useState('')
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showSections, setShowSections] = useState(false)
  const [customSections, setCustomSections] = useState<CustomSection[]>([
    { title: '', items: [''] },
  ])
  const [wsProgress, setWsProgress] = useState<string[]>([])
  const [useWebSocket, setUseWebSocket] = useState(false)

  const parseUsername = (input: string): string => {
    let parsed = input.trim()
    if (parsed.includes('github.com/')) {
      parsed = parsed.split('github.com/')[1].split('/')[0]
    }
    return parsed
  }

  const fetchHistory = useCallback(async (user: string) => {
    try {
      const res = await fetch(`${API_URL}/resumes?username=${encodeURIComponent(user)}`)
      if (res.ok) setHistory(await res.json())
    } catch { /* ignore */ }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseUsername(username)
    if (!parsed) { setError('Please enter a GitHub username or URL'); return }

    setLoading(true)
    setError('')
    setProgress('')
    setShareId('')
    setPdfBlob(null)
    setWsProgress([])

    if (useWebSocket) {
      submitViaWebSocket(parsed)
    } else {
      submitViaHttp(parsed)
    }
  }

  const submitViaHttp = async (user: string) => {
    setProgress('Generating resume...')
    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user,
          template,
          customSections: customSections.filter(s => s.title.trim()),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate resume')
      }

      const blob = await res.blob()
      setPdfBlob(blob)
      setShareId(res.headers.get('X-Share-Id') || '')
      fetchHistory(user)
      setProgress('Ready!')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const submitViaWebSocket = async (user: string) => {
    try {
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'compile',
          username: user,
          template,
          customSections: customSections.filter(s => s.title.trim()),
        }))
      }

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)

        if (msg.type === 'progress') {
          setProgress(msg.message)
          setWsProgress(p => [...p, msg.message])
        }

        if (msg.type === 'complete') {
          setShareId(msg.shareId)
          setProgress('Complete!')
          fetchHistory(user)
          ws.close()
          setLoading(false)
        }

        if (msg.type === 'error') {
          setError(msg.message)
          ws.close()
          setLoading(false)
        }
      }

      ws.onerror = () => {
        setError('WebSocket connection failed, try HTTP mode')
        setUseWebSocket(false)
        submitViaHttp(user)
      }
    } catch {
      submitViaHttp(user)
    }
  }

  const downloadPdf = () => {
    if (!pdfBlob) return
    const url = window.URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${parseUsername(username)}_resume.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const addSection = () => {
    setCustomSections(s => [...s, { title: '', items: [''] }])
  }

  const removeSection = (idx: number) => {
    setCustomSections(s => s.filter((_, i) => i !== idx))
  }

  const updateSection = (idx: number, field: 'title' | 'items', value: string | string[]) => {
    setCustomSections(s => s.map((sec, i) =>
      i === idx ? { ...sec, [field]: value } : sec,
    ))
  }

  const addItem = (sectionIdx: number) => {
    setCustomSections(s => s.map((sec, i) =>
      i === sectionIdx ? { ...sec, items: [...sec.items, ''] } : sec,
    ))
  }

  const updateItem = (sectionIdx: number, itemIdx: number, value: string) => {
    setCustomSections(s => s.map((sec, i) =>
      i === sectionIdx
        ? { ...sec, items: sec.items.map((item, j) => (j === itemIdx ? value : item)) }
        : sec,
    ))
  }

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">GitHub to Resume</h1>
        <p className="subtitle">Transform your GitHub profile into a professional PDF resume.</p>
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
            <input
              type="text"
              id="username"
              className="form-input"
              placeholder="e.g., torvalds or https://github.com/torvalds"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="template" className="form-label">Resume Template</label>
            <select
              id="template"
              className="form-select"
              value={template}
              onChange={e => setTemplate(e.target.value)}
              disabled={loading}
            >
              <option value="modern">Modern Professional</option>
              <option value="classic">Classic Academic</option>
              <option value="minimal">Minimal Clean</option>
              <option value="technical">Technical (Stats Focused)</option>
              <option value="creative">Creative (Visual)</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowSections(!showSections)}
            style={{ marginBottom: '1rem' }}
          >
            {showSections ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Custom Sections {customSections[0]?.title ? `(${customSections.length})` : ''}
          </button>

          {showSections && (
            <div className="sections-panel">
              {customSections.map((section, si) => (
                <div key={si} className="section-card">
                  <div className="section-header">
                    <input
                      className="form-input"
                      placeholder="Section title (e.g., Experience, Education)"
                      value={section.title}
                      onChange={e => updateSection(si, 'title', e.target.value)}
                    />
                    <button type="button" className="btn-icon-only" onClick={() => removeSection(si)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {section.items.map((item, ii) => (
                    <input
                      key={ii}
                      className="form-input section-item"
                      placeholder={`Item ${ii + 1}`}
                      value={item}
                      onChange={e => updateItem(si, ii, e.target.value)}
                    />
                  ))}
                  <button type="button" className="btn btn-small" onClick={() => addItem(si)}>
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
              <>
                <Loader2 size={20} className="loader btn-icon" />
                {progress || 'Generating...'}
              </>
            ) : (
              <>
                <Download size={20} className="btn-icon" />
                Generate PDF
              </>
            )}
          </button>
        </form>

        {wsProgress.length > 0 && (
          <div className="progress-steps">
            {wsProgress.map((step, i) => (
              <div key={i} className="progress-step">{step}</div>
            ))}
          </div>
        )}

        {pdfBlob && (
          <div className="result-panel">
            <div className="result-actions">
              <button className="btn" onClick={downloadPdf}>
                <Download size={18} /> Download PDF
              </button>
              {shareId && (
                <div className="share-link">
                  <Link2 size={16} />
                  <input
                    readOnly
                    value={`${window.location.origin}/share/${shareId}`}
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                </div>
              )}
            </div>
            <embed
              src={window.URL.createObjectURL(pdfBlob)}
              type="application/pdf"
              className="pdf-preview"
            />
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
                <a href={`${API_URL}/resumes/${entry.share_id}/pdf`} target="_blank">
                  <Download size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
