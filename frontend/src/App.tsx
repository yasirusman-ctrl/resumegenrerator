import { useState } from 'react'
import { AlertCircle, Download, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || '/api/generate'

function App() {
  const [username, setUsername] = useState('')
  const [template, setTemplate] = useState('modern')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('Please enter a GitHub username or URL')
      return
    }

    let parsedUsername = username.trim()
    
    if (parsedUsername.includes('github.com/')) {
      const urlParts = parsedUsername.split('github.com/')
      parsedUsername = urlParts[1].split('/')[0]
    }

    setLoading(true)
    setError('')
    setProgress('Fetching GitHub data...')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: parsedUsername, template }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate resume')
      }

      setProgress('Downloading PDF...')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${parsedUsername}_resume.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">GitHub to Resume</h1>
        <p className="subtitle">Transform your GitHub profile into a professional PDF resume instantly.</p>
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
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="template" className="form-label">Resume Template</label>
            <div style={{ position: 'relative' }}>
              <select
                id="template"
                className="form-select"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                disabled={loading}
              >
                <option value="modern">Modern Professional (Awesome-CV inspired)</option>
                <option value="classic">Classic Academic</option>
              </select>
            </div>
          </div>

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
      </div>
    </div>
  )
}

export default App
