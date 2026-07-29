# GitHub Resume Generator API Documentation

## Overview

This project generates professional PDF resumes from GitHub profiles using LaTeX templates. The API consists of two main components:

1. **Backend API** - Node.js/TypeScript service that:
   - Fetches GitHub user data via GitHub REST API
   - Renders LaTeX templates to HTML/PDF using an external service
   - Returns PDF resumes as downloadable files

2. **Frontend UI** - React application that:
   - Allows users to input GitHub username or URL
   - Selects between modern and classic resume templates
   - Fetches and downloads PDF resumes

## API Endpoints

### POST /api/generate

**Description:** Generate a resume PDF from a GitHub username

**Request Body:**
```json
{
  "username": "github_username",
  "template": "modern|classic"
}
```

**Response on Success:**
- **Status:** 200 OK
- **Content-Type:** application/pdf
- **Content-Disposition:** attachment; filename="{username}_resume.pdf"

**Error Responses:**
- **400 Bad Request:** Invalid username format, username too long, invalid template type
- **429 Too Many Requests:** Rate limit exceeded (API requests limited to 10 per minute per IP)
- **500 Internal Server Error:** LaTeX compilation failed or internal server error

## Authentication

The backend uses a GitHub Personal Access Token for GitHub API authentication. This token should be set as `GITHUB_TOKEN` environment variable.

**Example .env file:**
```env
GITHUB_TOKEN=your_github_token_here
PORT=3000
```

## Templates

### Modern Template
- **Style:** Professional and clean (Awesome-CV inspired)
- **Features:** Includes name, title, contact info, summary, languages, and top 4 projects
- **LaTeX Package:** `moderncv` with `casual` style

### Classic Template
- **Style:** Academic/resume style
- **Features:** Centered header with comprehensive project details
- **LaTeX Package:** `article` class with custom styling

## Error Handling

The API returns structured error messages:
```json
{
  "error": "Error description"
}
```

**Common Errors:**
- "GitHub username is required"
- "Invalid GitHub username format"
- "GitHub username is too long"
- "Invalid template type"
- "Failed to compile LaTeX to PDF"
- "Failed to fetch GitHub data. Please check the username."

## Rate Limiting

- **Global:** 10 requests per minute per IP address
- **GitHub API:** Automatic retry on rate limit errors (up to 3 attempts with exponential backoff)
- **LaTeX Service:** 30-second timeout per request

## Security

The API implements several security measures:

1. **Input Validation & Sanitization:** All inputs are validated and sanitized
2. **Rate Limiting:** Prevents abuse with per-IP rate limiting
3. **Security Headers:** Includes CSP, X-Frame-Options, X-XSS-Protection, etc.
4. **Error Messages:** Generic error messages to avoid information leakage

## Local Development

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your GitHub token
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

The frontend will automatically proxy requests to `http://localhost:3000/api/generate`

## Building

### Backend
```bash
cd backend
npm run build
```

This produces a compiled `dist/` folder with the TypeScript code.

### Frontend
```bash
cd frontend
npm run build
```

This produces a compiled `dist/` folder with the optimized React application.

## Testing

The application currently does not include automated tests, but you can manually test the API by:

1. Running the backend and frontend as described above
2. Opening the frontend UI and submitting a valid GitHub username
3. Verifying the PDF download in your browser

## Dependencies

### Backend
- `@hono/node-server`: Web server framework
- `@hono/cors`: CORS middleware
- `@octokit/rest`: GitHub API client
- `cors`: CORS middleware
- `dotenv`: Environment variable loading

### Frontend
- `react`: UI library
- `react-dom`: React DOM renderer
- `lucide-react`: Icon library

## Deployment

For production deployment, ensure:

1. The `GITHUB_TOKEN` environment variable is set
2. The backend is listening on port 3000
3. CORS is properly configured if the API is accessed from a different origin

## Troubleshooting

### LaTeX Compilation Fails
If the LaTeX compilation fails, the API returns the original TeX content in the response for debugging:
```json
{
  "error": "Failed to compile LaTeX to PDF",
  "tex": "[LaTeX code here]"
}
```

### GitHub API Errors
GitHub rate limiting is handled automatically with retries. If persistent rate limiting issues occur, consider rotating your GitHub token or using a personal token with higher limits.

### Frontend Cannot Connect to Backend
Ensure the backend is running and accessible. The frontend uses environment variables from `VITE_API_URL` if available.
