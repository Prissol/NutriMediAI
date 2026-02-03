import { useState, useCallback, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { useAuth } from './AuthContext'

const CONDITION_OPTIONS = [
  'Diabetes',
  'Hypertension (High BP)',
  'Heart disease',
  'Kidney disease',
  'Obesity / Weight management',
  'Celiac disease',
  'Lactose intolerance',
  'GERD / Acid reflux',
  'High cholesterol',
  'Thyroid disorder',
  'None / No current conditions',
]
const CONCERNED_OPTIONS = CONDITION_OPTIONS.filter((c) => c !== 'None / No current conditions')

function formatConditionLabel(c: string): string {
  return c === 'None / No current conditions' ? 'None' : c.replace(' (High BP)', '').replace(' / Weight management', '').replace('GERD / Acid reflux', 'GERD')
}

// Use env first; in production fallback to deployed backend so Vercel build always hits Railway
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'https://nutrimediai-production.up.railway.app')

// Icons for metric cards – real-looking: flame, egg, bread, oil drop, leaf, sugar cube, salt shaker
const METRIC_ICONS: Record<string, React.ReactNode> = {
  calories: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  ),
  protein: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <ellipse cx="12" cy="14" rx="6" ry="8" strokeWidth={1.8} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v0a4 4 0 014 4" />
    </svg>
  ),
  carbs: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10V8a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  fat: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4c-2 4-4 7-4 10a4 4 0 108 0c0-3-2-6-4-10z" />
    </svg>
  ),
  fiber: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3c-2 2-4 6-4 9s2 7 4 9 4-4 4-9-2-7-4-9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3c2 2 4 6 4 9s-2 7-4 9-4-4-4-9 2-7 4-9z" />
    </svg>
  ),
  sugar: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h4v4H5V8zm10 0h4v4h-4V8zM5 14h4v4H5v-4zm10 0h4v4h-4v-4z" />
    </svg>
  ),
  sodium: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20h6v-4H9v4zM10 16V8l2-3 2 3v8" />
      <circle cx="11" cy="6" r="0.8" fill="currentColor" />
      <circle cx="13" cy="6" r="0.8" fill="currentColor" />
    </svg>
  ),
}

// Strip markdown asterisks and bold so text displays clean
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .trim()
}

// Parse identified dish name from analysis (so report clearly states which food)
function parseDishName(text: string): string | null {
  const cleaned = stripMarkdown(text)
  const match = cleaned.match(/DISH\s*:?\s*\n?\s*([^\n]+)/i)
  const name = match ? match[1].trim() : null
  return name && name.length > 0 && name.length < 120 ? name : null
}

// Parse overall food summary (1–2 lines) from analysis
function parseFoodSummary(text: string): string | null {
  const cleaned = stripMarkdown(text)
  const match = cleaned.match(/FOOD SUMMARY\s*:?\s*\n?\s*([\s\S]*?)(?=\s*\n\s*---|\s*\n\s*KEY METRICS|$)/i)
  if (!match) return null
  const lines = match[1].trim().split(/\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 2)
  const summary = lines.join(' ').trim()
  return summary.length > 0 && summary.length < 400 ? summary : null
}

// Parse ALTERNATIVES section (1–2 similar-but-safer suggestions)
function parseAlternatives(text: string): string[] {
  const cleaned = stripMarkdown(text)
  const match = cleaned.match(/ALTERNATIVES\s*:?\s*\n?\s*([\s\S]*?)(?=\s*\n\s*---|Health score|$)/i)
  if (!match) return []
  const lines = match[1].trim().split(/\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 3)
  return lines.filter((l) => l.length > 5 && l.length < 200)
}

// Parse only health score for the progress bar
function parseScore(text: string): number {
  const scoreMatch = text.match(/(?:Health score|score)[:\s]*(\d+)(?:\s*\/\s*10)?/i) || text.match(/(\d+)\s*\/\s*10(?:\s|,|\.|$)/)
  const raw = scoreMatch ? parseInt(scoreMatch[1], 10) : 7
  const out = raw <= 10 ? raw * 10 : raw
  return Math.min(100, Math.max(0, out))
}

// Parse KEY METRICS line for the colorful overview cards
function parseKeyMetrics(text: string): Record<string, string> {
  const cleaned = stripMarkdown(text)
  const metrics: Record<string, string> = {
    calories: '—',
    protein: '—',
    carbs: '—',
    fat: '—',
    fiber: '—',
    sugar: '—',
    sodium: '—',
  }
  const caloriesMatch = cleaned.match(/Calories:\s*([\d\-]+(?:\s*kcal)?)/i)
  if (caloriesMatch) metrics.calories = caloriesMatch[1].trim().toLowerCase().endsWith('kcal') ? caloriesMatch[1].trim() : caloriesMatch[1].trim() + ' kcal'
  const proteinMatch = cleaned.match(/Protein:\s*(\d+)\s*g/i)
  if (proteinMatch) metrics.protein = proteinMatch[1] + 'g'
  const carbsMatch = cleaned.match(/Carbs:\s*(\d+)\s*g/i)
  if (carbsMatch) metrics.carbs = carbsMatch[1] + 'g'
  const fatMatch = cleaned.match(/Fat:\s*(\d+)\s*g/i)
  if (fatMatch) metrics.fat = fatMatch[1] + 'g'
  const fiberMatch = cleaned.match(/Fiber:\s*(\d+)\s*g/i)
  if (fiberMatch) metrics.fiber = fiberMatch[1] + 'g'
  const sugarMatch = cleaned.match(/Sugar:\s*(\d+)\s*g/i)
  if (sugarMatch) metrics.sugar = sugarMatch[1] + 'g'
  const sodiumMatch = cleaned.match(/Sodium:\s*(\d+)\s*mg/i)
  if (sodiumMatch) metrics.sodium = sodiumMatch[1] + 'mg'
  return metrics
}

// Section header lines to strip from body (avoids duplicate headings as bullets)
const SECTION_HEADER_REG = /^\s*(•\s*)?(---\s*)?(CURRENT CONDITION SUMMARY|CONCERNED CONDITION SUMMARY|KEY METRICS)\s*:?\s*$/i

// Split into Current condition summary and Concerned condition summary only; no overlap
function splitSections(text: string): { title: string; body: string }[] {
  const cleaned = stripMarkdown(text)
  const sections: { title: string; body: string }[] = []

  // Current: capture until we hit CONCERNED (with or without ---)
  const currentMatch = cleaned.match(/(?:---\s*)?CURRENT CONDITION SUMMARY\s*:?\s*\n([\s\S]*?)(?=\n\s*(---\s*)?CONCERNED CONDITION SUMMARY|$)/i)
  if (currentMatch && currentMatch[1].trim()) {
    let currentBody = currentMatch[1].trim()
    // Trim at any line that looks like "CONCERNED CONDITION SUMMARY" (stops nested duplicate)
    const concernedStart = currentBody.search(/\n\s*(•\s*)?(---\s*)?CONCERNED CONDITION SUMMARY\s*:?\s*(\n|$)/i)
    if (concernedStart >= 0) currentBody = currentBody.slice(0, concernedStart).trim()
    sections.push({ title: 'Current medical condition summary', body: stripMarkdown(currentBody) })
  }

  // Concerned: use last occurrence so we get the real section, not a line inside Current
  const concernedBlocks = [...cleaned.matchAll(/(?:---\s*)?CONCERNED CONDITION SUMMARY\s*:?\s*\n([\s\S]*?)(?=\n\s*---|$)/gi)]
  const concernedBlock = concernedBlocks.length > 0 ? concernedBlocks[concernedBlocks.length - 1] : null
  if (concernedBlock && concernedBlock[1].trim()) {
    sections.push({ title: 'Concerned condition summary', body: stripMarkdown(concernedBlock[1].trim()) })
  }

  if (sections.length === 0) {
    sections.push({ title: 'Summary', body: cleaned })
  }
  return sections
}

const POINT_TYPE_REG = /^\s*\[(Reasoning|Action|Benefit|Ask your doctor|Important)\]\s*/i
type PointType = 'reasoning' | 'action' | 'benefit' | 'ask_doctor' | 'important' | null

function parsePointType(line: string): { type: PointType; text: string } {
  const match = line.match(POINT_TYPE_REG)
  if (!match) return { type: null, text: line.trim() }
  const raw = match[1].toLowerCase()
  const type: PointType =
    raw === 'reasoning' ? 'reasoning'
    : raw === 'action' ? 'action'
    : raw === 'benefit' ? 'benefit'
    : raw.includes('ask') || raw.includes('doctor') ? 'ask_doctor'
    : raw === 'important' ? 'important'
    : null
  const text = line.slice(match[0].length).trim()
  return { type, text }
}

// Split section body into summary (TL;DR), points with types, and health score
function bodyToPoints(body: string): {
  sectionSummary: string | null
  points: { type: PointType; text: string }[]
  healthScoreLine: string | null
} {
  const trimmed = body.trim()
  if (!trimmed) return { sectionSummary: null, points: [], healthScoreLine: null }
  const byNewline = trimmed.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  let lines = byNewline.length > 1 ? byNewline : trimmed.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  if (lines.length < 1) lines = [trimmed]

  const healthScoreMatch = lines.find((l) => /Health score\s*:\s*\d+\s*\/\s*10/i.test(l))
  const contentLines = lines.filter(
    (line) =>
      !SECTION_HEADER_REG.test(line) &&
      !/^\s*---\s*$/.test(line) &&
      line !== healthScoreMatch
  )
  const sectionSummary =
    contentLines.length > 0 && contentLines[0].length > 10 && contentLines[0].length < 300
      ? contentLines[0].trim()
      : null
  const pointLines = sectionSummary ? contentLines.slice(1) : contentLines
  const points = pointLines.map((line) => parsePointType(line))
  return { sectionSummary: sectionSummary || null, points, healthScoreLine: healthScoreMatch ?? null }
}

// Point type → label, color, icon
const POINT_TYPE_CONFIG: Record<NonNullable<PointType>, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  reasoning: { label: 'Reasoning', bg: 'bg-amber-500', text: 'text-white', icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
  action: { label: 'Action', bg: 'bg-blue-500', text: 'text-white', icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
  benefit: { label: 'Benefit', bg: 'bg-emerald-500', text: 'text-white', icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ask_doctor: { label: 'Ask your doctor', bg: 'bg-violet-500', text: 'text-white', icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  important: { label: 'Important', bg: 'bg-rose-500', text: 'text-white', icon: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
}

const STEP_COLORS = [
  { bg: 'bg-teal-500', text: 'text-white', step: '01' },
  { bg: 'bg-orange-500', text: 'text-white', step: '02' },
  { bg: 'bg-blue-500', text: 'text-white', step: '03' },
  { bg: 'bg-amber-600', text: 'text-white', step: '04' },
  { bg: 'bg-pink-500', text: 'text-white', step: '05' },
]

const ANALYSES_KEY = 'nutrimedai_analyses'
const ANALYSES_MAX = 50
const PREVIEW_MAX_SIZE = 600
const PREVIEW_JPEG_QUALITY = 0.78

type AnalysisEntry = { id: string; date: string; dishName: string; analysis: string; preview?: string }

function loadAnalysesFromStorage(): AnalysisEntry[] {
  try {
    const raw = localStorage.getItem(ANALYSES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, ANALYSES_MAX) : []
  } catch {
    return []
  }
}

function saveAnalysesToStorage(list: AnalysisEntry[]): { ok: boolean; quota?: boolean } {
  try {
    localStorage.setItem(ANALYSES_KEY, JSON.stringify(list.slice(0, ANALYSES_MAX)))
    return { ok: true }
  } catch (e) {
    const quota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)
    return { ok: false, quota: !!quota }
  }
}

function compressImageAsDataUrl(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth
      const h = img.naturalHeight
      let dw = w
      let dh = h
      if (w > PREVIEW_MAX_SIZE || h > PREVIEW_MAX_SIZE) {
        if (w >= h) {
          dw = PREVIEW_MAX_SIZE
          dh = Math.round((h * PREVIEW_MAX_SIZE) / w)
        } else {
          dh = PREVIEW_MAX_SIZE
          dw = Math.round((w * PREVIEW_MAX_SIZE) / h)
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = dw
      canvas.height = dh
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(undefined)
        return
      }
      ctx.drawImage(img, 0, 0, dw, dh)
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', PREVIEW_JPEG_QUALITY)
        resolve(dataUrl)
      } catch {
        resolve(undefined)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(undefined)
    }
    img.src = url
  })
}

function LoginScreen({
  onLogin,
  onRegister,
  error,
  onClearError,
}: {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string) => Promise<void>
  error: string | null
  onClearError: () => void
}) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onClearError()
    setSubmitting(true)
    try {
      if (tab === 'login') await onLogin(email, password)
      else await onRegister(email, password)
    } catch {
      /* error set by context */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.svg" alt="" className="h-10 w-10" />
          <h1 className="text-xl font-semibold text-slate-800">NutriMedAI</h1>
        </div>
        <p className="text-sm text-slate-500 mb-4">Sign in to your dashboard. Your analyses are saved per account.</p>
        <div className="flex rounded-lg bg-slate-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => { setTab('login'); onClearError(); setPassword('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'login' ? 'bg-white text-slate-800 shadow' : 'text-slate-600'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); onClearError(); setPassword('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'register' ? 'bg-white text-slate-800 shadow' : 'text-slate-600'}`}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={tab === 'register' ? 6 : 1}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800"
              placeholder={tab === 'register' ? 'Min 6 characters' : ''}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Please wait...' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const { user, token, loading: authLoading, login, register, logout, error: authError, clearError: clearAuthError } = useAuth()
  const [currentConditions, setCurrentConditions] = useState<string[]>([])
  const [concernedConditions, setConcernedConditions] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [concernedInput, setConcernedInput] = useState('')
  const [currentDropdownOpen, setCurrentDropdownOpen] = useState(false)
  const [concernedDropdownOpen, setConcernedDropdownOpen] = useState(false)
  const [userDescription, setUserDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCurrentSummary, setShowCurrentSummary] = useState(true)
  const [showConcernedSummary, setShowConcernedSummary] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({})
  const [analysesList, setAnalysesList] = useState<AnalysisEntry[]>(() => (user ? [] : loadAnalysesFromStorage()))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [sortNewestFirst, setSortNewestFirst] = useState(true)
  const [clearAllConfirm, setClearAllConfirm] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [storageQuotaError, setStorageQuotaError] = useState<string | null>(null)
  const [analysesLoading, setAnalysesLoading] = useState(false)

  // When user identity changes (login, logout, or different account), clear current session so the new user doesn't see the previous user's image, analysis, or profile
  useEffect(() => {
    setFile(null)
    setPreview(null)
    setAnalysis(null)
    setCurrentConditions([])
    setConcernedConditions([])
    setUserDescription('')
    setActiveEntryId(null)
    setError(null)
    setStorageQuotaError(null)
    setEditingEntryId(null)
    setEditingName('')
    setClearAllConfirm(false)
  }, [user?.id])

  // Fetch user's analyses when logged in
  useEffect(() => {
    if (!user || !token) {
      if (!user) setAnalysesList(loadAnalysesFromStorage())
      return
    }
    setAnalysesLoading(true)
    fetch(`${API_BASE}/analyses`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 401) return []
        return res.json()
      })
      .then((data: Array<{ id: string; dishName: string; analysis: string; preview?: string; date: string }>) => {
        setAnalysesList(
          Array.isArray(data)
            ? data.map((e) => ({ id: e.id, date: e.date, dishName: e.dishName, analysis: e.analysis, preview: e.preview }))
            : []
        )
      })
      .catch(() => setAnalysesList([]))
      .finally(() => setAnalysesLoading(false))
  }, [user, token])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setAnalysis(null)
    setError(null)
  }, [])

  const addCurrent = (c: string) => {
    if (c === 'None / No current conditions') {
      setCurrentConditions(['None / No current conditions'])
    } else {
      setCurrentConditions((prev) =>
        prev.filter((x) => x !== 'None / No current conditions').concat(c)
      )
    }
    setCurrentInput('')
    setCurrentDropdownOpen(false)
  }

  const removeCurrent = (c: string) => {
    setCurrentConditions((prev) => {
      const next = prev.filter((x) => x !== c)
      return next.length ? next : ['None / No current conditions']
    })
  }

  const addConcerned = (c: string) => {
    setConcernedConditions((prev) => (prev.includes(c) ? prev : [...prev, c]))
    setConcernedInput('')
    setConcernedDropdownOpen(false)
  }

  const removeConcerned = (c: string) => {
    setConcernedConditions((prev) => prev.filter((x) => x !== c))
  }

  const currentMatches = currentInput.trim().length >= 1
    ? CONDITION_OPTIONS.filter(
        (o) =>
          o.toLowerCase().includes(currentInput.toLowerCase().trim()) &&
          !currentConditions.includes(o)
      )
    : []
  const concernedMatches = concernedInput.trim().length >= 1
    ? CONCERNED_OPTIONS.filter(
        (o) =>
          o.toLowerCase().includes(concernedInput.toLowerCase().trim()) &&
          !concernedConditions.includes(o)
      )
    : []

  const currentDisplay =
    currentConditions.length === 0 || currentConditions.includes('None / No current conditions')
      ? 'No current medical conditions'
      : currentConditions.join(', ')
  const concernedDisplay = concernedConditions.length === 0 ? 'None specified' : concernedConditions.join(', ')

  const analyze = async () => {
    if (!file) {
      setError('Please upload an image first.')
      return
    }
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('current_conditions', currentDisplay)
      form.append('concerned_conditions', concernedDisplay)
      form.append('user_description', userDescription)
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || res.statusText || 'Analysis failed')
      }
      const data = await res.json()
      const newAnalysis = data.analysis
      const dishName = parseDishName(newAnalysis) || 'Food analysis'
      const entryId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      setAnalysis(newAnalysis)
      setActiveEntryId(entryId)

      const addEntryWithPreview = (previewDataUrl: string | undefined) => {
        if (user && token) {
          fetch(`${API_BASE}/analyses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ dish_name: dishName, analysis: newAnalysis, preview: previewDataUrl || null }),
          })
            .then((res) => (res.status === 401 ? null : res.json()))
            .then((data: { id: string; dishName: string; analysis: string; preview?: string; date: string } | null) => {
              if (data) {
                setActiveEntryId(data.id)
                setAnalysesList((prev) => [
                  { id: data.id, date: data.date, dishName: data.dishName, analysis: data.analysis, preview: data.preview },
                  ...prev.filter((e) => e.id !== data.id),
                ].slice(0, ANALYSES_MAX))
              }
            })
            .catch(() => {})
          return
        }
        const entry: AnalysisEntry = {
          id: entryId,
          date: new Date().toISOString(),
          dishName,
          analysis: newAnalysis,
          preview: previewDataUrl,
        }
        setAnalysesList((prev) => {
          const next = [entry, ...prev.filter((e) => e.id !== entryId)].slice(0, ANALYSES_MAX)
          const result = saveAnalysesToStorage(next)
          if (!result.ok && result.quota) {
            setStorageQuotaError('Storage full. Old analyses may be removed or images not saved.')
            const withoutPreviews = next.map((e) => ({ ...e, preview: undefined as string | undefined }))
            const retry = saveAnalysesToStorage(withoutPreviews)
            if (retry.ok) return withoutPreviews
            const trimmed = next.slice(0, Math.max(1, Math.floor(next.length / 2)))
            saveAnalysesToStorage(trimmed)
            return trimmed
          }
          setStorageQuotaError(null)
          return next
        })
      }

      if (file) {
        compressImageAsDataUrl(file).then(addEntryWithPreview)
      } else {
        addEntryWithPreview(undefined)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const startNewAnalysis = () => {
    setAnalysis(null)
    setFile(null)
    setPreview(null)
    setError(null)
    setActiveEntryId(null)
    setSidebarOpen(false)
  }

  const loadAnalysisEntry = (entry: AnalysisEntry) => {
    setAnalysis(entry.analysis)
    setFile(null)
    setPreview(entry.preview ?? null)
    setActiveEntryId(entry.id)
    setSidebarOpen(false)
    setTimeout(() => {
      document.querySelector('[data-results-section]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const removeAnalysisEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (user && token) {
      fetch(`${API_BASE}/analyses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
        .then(() => {
          setAnalysesList((prev) => prev.filter((ent) => ent.id !== id))
          if (activeEntryId === id) startNewAnalysis()
        })
        .catch(() => {})
      setEditingEntryId(null)
      return
    }
    setAnalysesList((prev) => {
      const next = prev.filter((ent) => ent.id !== id)
      const r = saveAnalysesToStorage(next)
      if (r.ok) setStorageQuotaError(null)
      return next
    })
    if (activeEntryId === id) startNewAnalysis()
    setEditingEntryId(null)
  }

  const clearAllAnalyses = () => {
    if (user && token) {
      fetch(`${API_BASE}/analyses`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
        .then(() => {
          setAnalysesList([])
          setClearAllConfirm(false)
          startNewAnalysis()
        })
        .catch(() => {})
      return
    }
    setAnalysesList([])
    saveAnalysesToStorage([])
    setClearAllConfirm(false)
    setStorageQuotaError(null)
    startNewAnalysis()
  }

  const renameEntry = (id: string, newName: string) => {
    const trimmed = newName.trim()
    setEditingEntryId(null)
    setEditingName('')
    if (!trimmed) return
    if (user && token) {
      fetch(`${API_BASE}/analyses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dish_name: trimmed }),
      })
        .then(() => setAnalysesList((prev) => prev.map((e) => (e.id === id ? { ...e, dishName: trimmed } : e))))
        .catch(() => {})
      return
    }
    setAnalysesList((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, dishName: trimmed } : e))
      saveAnalysesToStorage(next)
      return next
    })
  }

  const sidebarSearchLower = sidebarSearch.trim().toLowerCase()
  const filteredForSidebar = sidebarSearchLower
    ? analysesList.filter((e) => e.dishName.toLowerCase().includes(sidebarSearchLower))
    : analysesList
  const sortedForSidebar = [...filteredForSidebar].sort((a, b) => {
    const tA = new Date(a.date).getTime()
    const tB = new Date(b.date).getTime()
    return sortNewestFirst ? tB - tA : tA - tB
  })

  const handleDownload = async () => {
    if (!analysis) return
    const pdfDishName = parseDishName(analysis)
    const foodLabel = pdfDishName || userDescription?.trim() || 'Uploaded food image'
    const imageName = file?.name || '—'

    let imageDataUrl: string | null = null
    if (file) {
      try {
        imageDataUrl = await new Promise<string | null>((resolve) => {
          const r = new FileReader()
          r.onload = () => resolve(r.result as string)
          r.onerror = () => resolve(null)
          r.readAsDataURL(file)
        })
      } catch {
        imageDataUrl = null
      }
    }

    const doc = new jsPDF({ format: 'a4', unit: 'mm' })
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxW = pageW - margin * 2
    const lineH = 5.5

    const pushPage = () => {
      doc.addPage()
      return margin
    }
    let y = margin

    // —— Header ——
    doc.setDrawColor(14, 116, 110)
    doc.setLineWidth(0.8)
    doc.line(margin, y, pageW - margin, y)
    y += 9
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('NutriMedAI', margin, y)
    y += 7
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text('Nutrition Report', margin, y)
    doc.setFontSize(9)
    doc.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), pageW - margin - 25, y)
    y += 12

    // —— Food / meal (which food this report is for) + thumbnail ——
    const imgW = 48
    const imgH = 36
    const boxH = imageDataUrl ? imgH + 4 : 18
    const textW = imageDataUrl ? maxW - imgW - 4 : maxW
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, y, maxW, boxH, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.rect(margin, y, maxW, boxH, 'D')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(71, 85, 105)
    doc.text('Food / meal', margin + 4, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)
    const foodLines = doc.splitTextToSize(foodLabel, textW - 8)
    doc.text(foodLines[0], margin + 4, y + 11)
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Image: ${imageName}`, margin + 4, y + 15)
    if (imageDataUrl) {
      const imgFormat = imageDataUrl.indexOf('image/png') !== -1 ? 'PNG' : 'JPEG'
      try {
        doc.addImage(imageDataUrl, imgFormat, pageW - margin - imgW - 2, y + 2, imgW, imgH)
      } catch {
        /* ignore if unsupported */
      }
    }
    y += boxH + 4

    // —— Nutrition Score ——
    const reportScore = parseScore(analysis)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text('Nutrition score', margin, y)
    doc.text(`${reportScore}/100`, pageW - margin - doc.getTextWidth(`${reportScore}/100`), y)
    y += 5
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.4)
    doc.setFillColor(226, 232, 240)
    doc.rect(margin, y, maxW, 5, 'FD')
    doc.setFillColor(13, 148, 136)
    doc.rect(margin, y, Math.max(0, (maxW * reportScore) / 100), 5, 'F')
    y += 12

    // —— Key metrics: infographic cards (2 rows: 4 + 3) ——
    const pdfMetrics = parseKeyMetrics(analysis)
    const metricColors: [number, number, number][] = [
      [251, 146, 60],   // calories orange
      [236, 72, 153],   // protein pink
      [250, 204, 21],   // carbs yellow
      [96, 165, 250],   // fat blue
      [34, 197, 94],    // fiber green
      [45, 212, 191],   // sugar teal
      [192, 132, 252],  // sodium purple
    ]
    const metricsList = pdfMetrics
      ? [
          ['Calories', pdfMetrics.calories],
          ['Protein', pdfMetrics.protein],
          ['Carbs', pdfMetrics.carbs],
          ['Fat', pdfMetrics.fat],
          ['Fiber', pdfMetrics.fiber],
          ['Sugar', pdfMetrics.sugar],
          ['Sodium', pdfMetrics.sodium],
        ]
      : []
    if (metricsList.length > 0 && Object.values(metricsList).some(([, v]) => v !== '—')) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('Key metrics', margin, y)
      y += 8
      const cardW = (maxW - 6) / 4
      const cardH = 14
      const gap = 2
      for (let row = 0; row < 2; row++) {
        const numCards = row === 0 ? 4 : 3
        for (let col = 0; col < numCards; col++) {
          const i = row * 4 + col
          if (i >= 7) break
          const [label, value] = metricsList[i]
          const x = margin + col * (cardW + gap)
          const cardY = y + row * (cardH + gap)
          const [r, g, b] = metricColors[i]
          doc.setFillColor(Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40))
          doc.setDrawColor(r, g, b)
          doc.setLineWidth(0.25)
          doc.rect(x, cardY, cardW, cardH, 'FD')
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(71, 85, 105)
          doc.text(label.toUpperCase(), x + 2, cardY + 5)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(30, 41, 59)
          const valLines = doc.splitTextToSize(value, cardW - 4)
          doc.text(valLines[0], x + 2, cardY + 10)
          if (valLines[1]) doc.text(valLines[1], x + 2, cardY + 13)
        }
      }
      y += 2 * (cardH + gap) + 4
    }

    // —— Summary sections: infographic (title bar + numbered steps) ——
    const pdfSections = splitSections(analysis)
    const stepColors: [number, number, number][] = [
      [20, 184, 166], [249, 115, 22], [59, 130, 246], [217, 119, 6], [236, 72, 153],
    ]
    for (const sec of pdfSections) {
      if (y > 245) y = pushPage()
      const isCurrent = sec.title.toLowerCase().includes('current')
      doc.setFillColor(isCurrent ? 204 : 254, isCurrent ? 251 : 243, isCurrent ? 241 : 199)
      doc.setDrawColor(isCurrent ? 20 : 245, isCurrent ? 184 : 158, isCurrent ? 166 : 114)
      doc.setLineWidth(0.3)
      doc.rect(margin, y, maxW, 9, 'FD')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text(sec.title, margin + 4, y + 6)
      y += 12
      const { sectionSummary, points } = bodyToPoints(sec.body)
      if (sectionSummary) {
        const sumLines = doc.splitTextToSize(sectionSummary, maxW - 4)
        for (const line of sumLines) {
          if (y > 268) y = pushPage()
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(71, 85, 105)
          doc.text(line, margin, y)
          y += 5
        }
        y += 3
      }
      if (points.length > 0) {
        for (let i = 0; i < points.length; i++) {
          if (y > 268) y = pushPage()
          const [r, g, b] = stepColors[i % stepColors.length]
          const stepNum = String(i + 1).padStart(2, '0')
          const pointText = points[i].text
          doc.setFillColor(r, g, b)
          doc.rect(margin, y, 10, 10, 'F')
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(255, 255, 255)
          doc.text(stepNum, margin + 2, y + 6.5)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(51, 65, 85)
          const textW = maxW - 14
          const stepLines = doc.splitTextToSize(pointText, textW)
          for (let j = 0; j < stepLines.length; j++) {
            doc.text(stepLines[j], margin + 12, y + 5 + j * 4.5)
          }
          y += Math.max(10, 4 + stepLines.length * 4.5) + 2
        }
      } else {
        const fallbackLines = doc.splitTextToSize(sec.body, maxW - 4)
        for (const line of fallbackLines) {
          if (y > 270) y = pushPage()
          doc.text(line, margin, y)
          y += lineH
        }
        y += 2
      }
      y += 8
    }

    doc.save(`NutriMedAI-report-${file?.name ? file.name.replace(/\.[^.]+$/, '') : 'food'}.pdf`)
  }

  const score = analysis ? parseScore(analysis) : 75
  const keyMetrics = analysis ? parseKeyMetrics(analysis) : null
  const sections = analysis ? splitSections(analysis) : []
  const _filtered = sections.filter(
    (sec) =>
      (showCurrentSummary && sec.title.toLowerCase().includes('current')) ||
      (showConcernedSummary && sec.title.toLowerCase().includes('concerned'))
  )
  const filteredSections = _filtered.length > 0 ? _filtered : sections
  const alternatives = analysis ? parseAlternatives(analysis) : []
  const dishName = analysis ? parseDishName(analysis) : null
  const foodSummary = analysis ? parseFoodSummary(analysis) : null
  const metricCards = keyMetrics
    ? [
        { key: 'calories', label: 'Calories', value: keyMetrics.calories, className: 'metric-calories' },
        { key: 'protein', label: 'Protein', value: keyMetrics.protein, className: 'metric-protein' },
        { key: 'carbs', label: 'Carbs', value: keyMetrics.carbs, className: 'metric-carbs' },
        { key: 'fat', label: 'Fat', value: keyMetrics.fat, className: 'metric-fat' },
        { key: 'fiber', label: 'Fiber', value: keyMetrics.fiber, className: 'metric-fiber' },
        { key: 'sugar', label: 'Sugar', value: keyMetrics.sugar, className: 'metric-sugar' },
        { key: 'sodium', label: 'Sodium', value: keyMetrics.sodium, className: 'metric-sodium' },
      ]
    : []

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={login}
        onRegister={register}
        error={authError}
        onClearError={clearAuthError}
      />
    )
  }

  return (
    <div className="min-h-screen text-slate-800 flex">
      {/* Left sidebar – ChatGPT style */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-[260px] flex-shrink-0 border-r border-slate-200 bg-white flex flex-col transition-transform duration-200 ease-out`}
      >
        <div className="p-3 border-b border-slate-100">
          <button
            type="button"
            onClick={startNewAnalysis}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500 text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </span>
            New analysis
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 flex flex-col min-h-0">
          <div className="px-2 pb-2 space-y-2">
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              placeholder="Search analyses..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
            />
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent</span>
              <button
                type="button"
                onClick={() => setSortNewestFirst((v) => !v)}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
              >
                {sortNewestFirst ? 'Newest first' : 'Oldest first'}
              </button>
            </div>
          </div>
          {analysesLoading ? (
            <p className="px-3 py-4 text-sm text-slate-400">Loading your analyses...</p>
          ) : analysesList.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-400">No analyses yet. Upload an image and tap Analyze.</p>
          ) : sortedForSidebar.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-400">No matches for &quot;{sidebarSearch}&quot;</p>
          ) : (
            <ul className="space-y-0.5 px-2 flex-1 min-h-0">
              {sortedForSidebar.map((entry) => (
                <li key={entry.id}>
                  <div
                    className={`rounded-lg text-sm transition-colors flex items-center gap-2 group ${
                      activeEntryId === entry.id ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => loadAnalysisEntry(entry)}
                      className="flex-1 min-w-0 flex items-center gap-2 px-2 py-2.5 text-left"
                    >
                      <span className="w-9 h-9 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {entry.preview ? (
                          <img src={entry.preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                        )}
                      </span>
                      {editingEntryId === entry.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => renameEntry(entry.id, editingName)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') renameEntry(entry.id, editingName)
                            if (e.key === 'Escape') {
                              setEditingEntryId(null)
                              setEditingName('')
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 rounded px-1 py-0.5 text-slate-800 bg-white border border-teal-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1 min-w-0 truncate">{entry.dishName}</span>
                      )}
                    </button>
                    {editingEntryId !== entry.id && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingEntryId(entry.id)
                            setEditingName(entry.dishName)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-600 flex-shrink-0"
                          aria-label="Rename"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => removeAnalysisEntry(entry.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                          aria-label="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </>
                    )}
                  </div>
                  <p className="px-3 pb-1.5 text-[11px] text-slate-400 pl-11">
                    {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {analysesList.length > 0 && (
            <div className="p-2 border-t border-slate-100 mt-2">
              {!clearAllConfirm ? (
                <button
                  type="button"
                  onClick={() => setClearAllConfirm(true)}
                  className="w-full py-2 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear all history
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={clearAllAnalyses}
                    className="flex-1 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg"
                  >
                    Yes, clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearAllConfirm(false)}
                    className="flex-1 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {storageQuotaError && (
          <div className="px-2 pb-2">
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
              {storageQuotaError}
            </p>
          </div>
        )}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Liquid Glass header */}
        <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 md:px-12 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <img src="/logo.svg" alt="" className="h-9 w-9 object-contain" aria-hidden />
              <h1 className="text-lg font-semibold text-slate-800 tracking-tight">NutriMedAI</h1>
            </div>
            <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 truncate max-w-[140px]" title={user?.email}>{user?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white/60 border border-slate-200/80 transition-colors"
            >
              Log out
            </button>
            {analysis && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white/60 border border-slate-200/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Download PDF
              </button>
            )}
          </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 flex-1 w-full">
          {storageQuotaError && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <span>{storageQuotaError}</span>
              <button type="button" onClick={() => setStorageQuotaError(null)} className="p-1 rounded hover:bg-amber-100" aria-label="Dismiss">×</button>
            </div>
          )}
        {/* Input card – professional layout */}
        <section className="card p-6 md:p-8">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">
            Medical profile
          </h2>

          <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Current medical condition */}
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current medical condition</label>
            <div className="relative">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => {
                  setCurrentInput(e.target.value)
                  setCurrentDropdownOpen(true)
                }}
                onFocus={() => setCurrentDropdownOpen(true)}
                onBlur={() => setTimeout(() => setCurrentDropdownOpen(false), 180)}
                placeholder="Search conditions..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 text-sm"
              />
              {currentDropdownOpen && currentMatches.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg py-1 max-h-48 overflow-auto">
                  {currentMatches.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          addCurrent(c)
                        }}
                      >
                        {formatConditionLabel(c)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {currentConditions.filter((c) => c !== 'None / No current conditions').length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {currentConditions
                  .filter((c) => c !== 'None / No current conditions')
                  .map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-700 bg-slate-100 border border-slate-200"
                    >
                      {formatConditionLabel(c)}
                      <button
                        type="button"
                        onClick={() => removeCurrent(c)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none text-lg leading-none"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2">No conditions selected</p>
            )}
            </div>

            {/* Medical conditions to monitor */}
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Medical conditions to monitor</label>
            <div className="relative">
              <input
                type="text"
                value={concernedInput}
                onChange={(e) => {
                  setConcernedInput(e.target.value)
                  setConcernedDropdownOpen(true)
                }}
                onFocus={() => setConcernedDropdownOpen(true)}
                onBlur={() => setTimeout(() => setConcernedDropdownOpen(false), 180)}
                placeholder="Search conditions..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 text-sm"
              />
              {concernedDropdownOpen && concernedMatches.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg py-1 max-h-48 overflow-auto">
                  {concernedMatches.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          addConcerned(c)
                        }}
                      >
                        {formatConditionLabel(c)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {concernedConditions.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {concernedConditions.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-700 bg-slate-100 border border-slate-200"
                  >
                    {formatConditionLabel(c)}
                    <button
                      type="button"
                      onClick={() => removeConcerned(c)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none text-lg leading-none"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2">None selected</p>
            )}
            </div>
          </div>

            {/* Image upload + Description in one row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <label className="upload-zone flex flex-col items-center justify-center w-full min-h-[280px] rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer overflow-hidden transition-colors hover:bg-slate-50 hover:border-slate-300 focus-within:ring-2 focus-within:ring-slate-300 focus-within:ring-offset-1">
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                {preview ? (
                  <img src={preview} alt="Upload" className="w-full h-full min-h-[280px] max-h-[400px] object-contain bg-slate-100" />
                ) : (
                  <span className="flex flex-col items-center gap-3 text-center px-4 py-8">
                    <span className="flex items-center justify-center w-11 h-11 rounded-lg bg-slate-200/80 text-slate-500" aria-hidden>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-slate-600">Upload food image</span>
                    <span className="text-xs text-slate-400">PNG, JPG up to 10MB</span>
                  </span>
                )}
              </label>
              <div className="flex flex-col min-h-[280px] rounded-lg border border-slate-200 bg-white p-5">
                <label htmlFor="description-input" className="text-sm font-medium text-slate-700 mb-2 block">
                  Description (optional)
                </label>
                <input
                  id="description-input"
                  type="text"
                  placeholder="e.g. Portion size, preparation method, or specific question"
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 text-sm"
                />
                <button
                  type="button"
                  onClick={analyze}
                  disabled={!file || loading}
                  className="mt-5 w-full px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? 'Analyzing…' : 'Analyze food'}
                </button>
              </div>
          </div>
          </div>
        </section>

        {error && (
          <div className="card p-4 border-red-200 bg-red-50/80">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results – professional two-column layout with animations; summary scrolls when many points */}
        {analysis && (
          <section data-results-section className="card overflow-hidden animate-fade-in">
            <div className="grid md:grid-cols-[320px_1fr] gap-0">
              {/* Left: identified dish + image + Nutrition Score – glass */}
              <div className="p-5 bg-white/40 border-r border-slate-200/60">
                {dishName && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-teal-50 border border-teal-200">
                    <p className="text-xs font-medium text-teal-700 uppercase tracking-wide">Identified food</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{dishName}</p>
                  </div>
                )}
                {preview ? (
                  <img
                    src={preview}
                    alt={dishName || 'Uploaded dish'}
                    className="w-full max-h-[200px] object-contain bg-slate-100 rounded-xl mb-4 shadow-md"
                  />
                ) : (
                  <div className="w-full max-h-[200px] min-h-[120px] flex items-center justify-center bg-slate-100 rounded-xl mb-4 border border-dashed border-slate-200">
                    <span className="text-sm text-slate-400">No image (saved analysis)</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Nutrition score</span>
                    <span className="text-sm font-semibold text-slate-800">{score}/100</span>
                  </div>
                  <div className="h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Summary + metrics + sections – scrollable when many points */}
              <div className="p-5 md:p-6 flex flex-col max-h-[85vh] min-h-0">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex-shrink-0">Nutrition summary</h3>

                <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
                  {/* Overall food summary (1–2 lines) */}
                  {foodSummary && (
                    <p className="text-sm text-slate-600 leading-relaxed mb-4 pb-4 border-b border-slate-200">
                      {foodSummary}
                    </p>
                  )}
                  {/* Colorful nutrition overview cards – animated */}
                  {metricCards.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      {metricCards.map((m, idx) => (
                        <div
                          key={m.key}
                          className={`rounded-xl border p-3 metric-card-hover animate-scale-in ${m.className}`}
                          style={{ animationDelay: `${idx * 50}ms`, opacity: 0 }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-600/90" aria-hidden>
                              {METRIC_ICONS[m.key]}
                            </span>
                            <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                              {m.label}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
                            {m.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Condition tags – glass */}
                  {(currentConditions.filter((c) => c !== 'None / No current conditions').length > 0 ||
                    concernedConditions.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {currentConditions
                        .filter((c) => c !== 'None / No current conditions')
                        .map((c) => (
                          <span
                            key={c}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200"
                          >
                            {c.replace(' (High BP)', '').replace(' / Weight management', '')}
                          </span>
                        ))}
                      {concernedConditions.map((c) => (
                        <span
                          key={c}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                        >
                          Concern: {c.replace(' (High BP)', '').replace(' / Weight management', '')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Show/hide toggles */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Show:</span>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showCurrentSummary}
                        onChange={(e) => setShowCurrentSummary(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-slate-700">Current condition</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showConcernedSummary}
                        onChange={(e) => setShowConcernedSummary(e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm text-slate-700">Concerned condition</span>
                    </label>
                  </div>

                  {/* Petal-style infographic (hub + petals, scrollable) */}
                  {filteredSections.map((sec, secIdx) => {
                    const { sectionSummary, points, healthScoreLine } = bodyToPoints(sec.body)
                    const sectionScore = healthScoreLine ? parseScore(healthScoreLine) : null
                    const isCurrent = sec.title.toLowerCase().includes('current')
                    const expanded = expandedSections[secIdx] ?? false
                    const showPoints = points.length > 3 && !expanded ? points.slice(0, 3) : points
                    const hasMore = points.length > 3 && !expanded
                    return (
                      <div key={sec.title} className="infographic-block animate-fade-in-up" style={{ animationDelay: `${secIdx * 80}ms`, opacity: 0 }}>
                        <div className={`infographic-hub rounded-2xl border shadow-md p-4 mb-4 text-center ${isCurrent ? 'bg-teal-50/80 border-teal-200' : 'bg-amber-50/80 border-amber-200'}`}>
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${isCurrent ? 'bg-teal-500 text-white' : 'bg-amber-500 text-white'}`} aria-hidden>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isCurrent ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                ) : (
                                  <>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </>
                                )}
                              </svg>
                            </span>
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                              {sec.title}
                            </h4>
                          </div>
                          {sectionScore != null && (
                            <div className="mt-3 mb-2">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-600">Health score</span>
                                <span className="text-sm font-bold text-slate-800">{Math.round((sectionScore / 100) * 10)}/10</span>
                              </div>
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden max-w-[120px] mx-auto">
                                <div
                                  className={`h-full rounded-full ${sectionScore >= 60 ? 'bg-emerald-500' : sectionScore >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                                  style={{ width: `${sectionScore}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {points.length} point{points.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {/* TL;DR + section summary */}
                        {sectionSummary && (
                          <div className="mb-4 pl-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">TL;DR</span>
                            <p className="text-sm text-slate-600 leading-relaxed mt-0.5">
                              {sectionSummary}
                            </p>
                          </div>
                        )}
                        {points.length > 0 ? (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {showPoints.map((point, i) => {
                                const typeConfig = point.type ? POINT_TYPE_CONFIG[point.type] : null
                                const stepFallback = STEP_COLORS[i % STEP_COLORS.length]
                                const bg = typeConfig?.bg ?? stepFallback.bg
                                const textCls = typeConfig?.text ?? stepFallback.text
                                const stepNum = String(i + 1).padStart(2, '0')
                                return (
                                  <div
                                    key={i}
                                    className={`petal-card rounded-2xl ${bg} ${textCls} p-4 shadow-md animate-fade-in-up hover:shadow-lg transition-shadow flex flex-col min-h-0`}
                                    style={{ animationDelay: `${100 + secIdx * 80 + i * 60}ms`, opacity: 0 }}
                                  >
                                    <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                                      {typeConfig ? (
                                        <>
                                          {typeConfig.icon}
                                          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-90">{typeConfig.label}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-lg font-bold leading-none">{stepNum}</span>
                                          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-90">Step</span>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-sm leading-relaxed opacity-95 flex-1 min-h-0">
                                      {point.text}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                            {hasMore && (
                              <button
                                type="button"
                                onClick={() => setExpandedSections((prev) => ({ ...prev, [secIdx]: true }))}
                                className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-700 underline"
                              >
                                Show more ({points.length - 3} more)
                              </button>
                            )}
                            {expanded && points.length > 3 && (
                              <button
                                type="button"
                                onClick={() => setExpandedSections((prev) => ({ ...prev, [secIdx]: false }))}
                                className="mt-2 text-xs font-medium text-slate-500 hover:text-slate-700 underline"
                              >
                                Show less
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-slate-600 pl-3 border-l-2 border-slate-200 animate-fade-in">
                            {sec.body}
                          </p>
                        )}
                      </div>
                    )
                  })}

                  {/* Alternatives */}
                  {alternatives.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Similar but safer</h4>
                      <ul className="space-y-1.5">
                        {alternatives.map((alt, i) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">✓</span>
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <p className="text-xs text-slate-400 pt-4 border-t border-slate-100 mt-4">
                    General dietary guidance; not a substitute for medical advice. When in doubt, discuss with your doctor.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {!analysis && (
          <p className="text-center text-sm text-slate-500 py-4">
            Set your medical profile, upload a food image, then tap Analyze.
          </p>
        )}
        </main>
      </div>
    </div>
  )
}
