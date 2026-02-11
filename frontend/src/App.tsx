import { useState, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import { useAuth } from './AuthContext'

const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '/api') : '/api'

const METRIC_ICONS: Record<string, React.ReactNode> = {
  calories: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>,
  protein: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><ellipse cx="12" cy="14" rx="6" ry="8" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v0a4 4 0 014 4" /></svg>,
  carbs: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 10h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10V8a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
  fat: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4c-2 4-4 7-4 10a4 4 0 108 0c0-3-2-6-4-10z" /></svg>,
  fiber: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3c-2 2-4 6-4 9s2 7 4 9 4-4 4-9-2-7-4-9z" /></svg>,
  sugar: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h4v4H5V8zm10 0h4v4h-4V8zM5 14h4v4H5v-4zm10 0h4v4h-4v-4z" /></svg>,
  sodium: <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20h6v-4H9v4zM10 16V8l2-3 2 3v8" /><circle cx="11" cy="6" r="0.8" fill="currentColor" /><circle cx="13" cy="6" r="0.8" fill="currentColor" /></svg>,
}
function metricKey(label: string): string {
  const k = label.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')
  if (k.includes('calor')) return 'calories'
  if (k.includes('protein')) return 'protein'
  if (k.includes('carb')) return 'carbs'
  if (k.includes('fat')) return 'fat'
  if (k.includes('fiber')) return 'fiber'
  if (k.includes('sugar')) return 'sugar'
  if (k.includes('sodium')) return 'sodium'
  return 'calories'
}

/** Logo: floating leaves in wind — 3D sway, drift, hawa ke jhonke, realistic */
function Logo({ className }: { className?: string }) {
  return (
    <span className={`logo-glow inline-block ${className ?? ''}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="w-full h-full block" style={{ transformStyle: 'preserve-3d', perspective: '180px' }}>
        <defs>
          <linearGradient id="logoLeafGrad" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="40%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#5b21b6" />
          </linearGradient>
          <linearGradient id="logoLeafShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ede9fe" stopOpacity={0.7} />
            <stop offset="100%" stopColor="transparent" stopOpacity={0} />
          </linearGradient>
          <filter id="logoSoftShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx={0} dy={2} stdDeviation={1.5} floodColor="#6d28d9" floodOpacity={0.4} />
          </filter>
        </defs>
        {/* Leaf 1: organic shape — rounded base, curved sides, pointed tip */}
        <g className="logo-leaf-wrap logo-leaf-1" style={{ transformOrigin: '14px 16px' }}>
          <path d="M14 4 C 9 8 8 18 14 26 C 19 18 19 8 14 4 Z" fill="url(#logoLeafGrad)" filter="url(#logoSoftShadow)" stroke="#6d28d9" strokeWidth={0.4} strokeLinejoin="round" />
          <path className="logo-shine-layer" d="M14 4 C 9 8 8 18 14 26 C 19 18 19 8 14 4 Z" fill="url(#logoLeafShine)" stroke="none" />
          <path className="logo-vein" d="M14 5 Q14 15 14 25" stroke="#a78bfa" strokeWidth={0.35} strokeLinecap="round" fill="none" strokeDasharray="3 3" />
        </g>
        {/* Leaf 2: same organic shape, mirrored feel */}
        <g className="logo-leaf-wrap logo-leaf-2" style={{ transformOrigin: '34px 17px' }}>
          <path d="M34 5 C 29 9 28 19 34 27 C 40 19 39 9 34 5 Z" fill="url(#logoLeafGrad)" filter="url(#logoSoftShadow)" stroke="#6d28d9" strokeWidth={0.4} strokeLinejoin="round" />
          <path className="logo-shine-layer" d="M34 5 C 29 9 28 19 34 27 C 40 19 39 9 34 5 Z" fill="url(#logoLeafShine)" stroke="none" />
          <path className="logo-vein" d="M34 6 Q34 16 34 26" stroke="#a78bfa" strokeWidth={0.35} strokeLinecap="round" fill="none" strokeDasharray="3 3" />
        </g>
        {/* Leaf 3: smaller organic leaf */}
        <g className="logo-leaf-wrap logo-leaf-3" style={{ transformOrigin: '24px 39px' }}>
          <path d="M24 30 C 21 33 20 40 24 45 C 28 40 27 33 24 30 Z" fill="url(#logoLeafGrad)" filter="url(#logoSoftShadow)" stroke="#6d28d9" strokeWidth={0.4} strokeLinejoin="round" />
          <path className="logo-shine-layer" d="M24 30 C 21 33 20 40 24 45 C 28 40 27 33 24 30 Z" fill="url(#logoLeafShine)" stroke="none" />
          <path className="logo-vein" d="M24 31 v13" stroke="#a78bfa" strokeWidth={0.3} strokeLinecap="round" fill="none" strokeDasharray="2 2" />
        </g>
      </svg>
    </span>
  )
}

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

/** Multi-select condition field: chips + search dropdown + "Add custom" */
function ConditionMultiSelect({
  selected,
  onSelectedChange,
  dropdownOpen,
  onDropdownOpenChange,
  inputValue,
  onInputValueChange,
  label,
  placeholder,
  options,
}: {
  selected: string[]
  onSelectedChange: (list: string[]) => void
  dropdownOpen: boolean
  onDropdownOpenChange: (open: boolean) => void
  inputValue: string
  onInputValueChange: (v: string) => void
  label: string
  placeholder: string
  options: string[]
}) {
  const normalizedOptions = options.filter((c) => c !== 'None / No current conditions')
  const query = inputValue.trim().toLowerCase()
  const matches = query
    ? normalizedOptions.filter((c) => c.toLowerCase().includes(query) && !selected.includes(c))
    : normalizedOptions.filter((c) => !selected.includes(c))
  const exactMatch = query && normalizedOptions.some((c) => c.toLowerCase() === query)
  const canAddCustom = query.length > 0 && !selected.some((s) => s.toLowerCase() === query) && !exactMatch

  const add = (value: string) => {
    const v = value.trim()
    if (!v || selected.includes(v)) return
    onSelectedChange([...selected, v])
    onInputValueChange('')
    onDropdownOpenChange(false)
  }

  const remove = (value: string) => {
    onSelectedChange(selected.filter((s) => s !== value))
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-violet-800/90 mb-1.5">{label}</label>
      <div className="min-h-[42px] rounded-lg border border-violet-200/60 bg-white/40 backdrop-blur-sm flex flex-wrap items-center gap-2 p-2 focus-within:ring-2 focus-within:ring-violet-400/50 focus-within:border-violet-300">
        {selected.filter((c) => c !== 'None / No current conditions').map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm bg-violet-100/80 border border-violet-200/60 text-violet-900"
          >
            {c}
            <button
              type="button"
              onClick={() => remove(c)}
              className="text-violet-500 hover:text-violet-800 leading-none"
              aria-label={`Remove ${c}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => { onInputValueChange(e.target.value); onDropdownOpenChange(true) }}
          onFocus={() => onDropdownOpenChange(true)}
          onBlur={() => setTimeout(() => onDropdownOpenChange(false), 180)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue.trim()) {
              e.preventDefault()
              add(inputValue.trim())
            }
          }}
          placeholder={selected.length === 0 ? placeholder : 'Search or add another...'}
          className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-violet-900 placeholder:text-violet-400 py-1 text-sm"
        />
      </div>
      {dropdownOpen && (matches.length > 0 || canAddCustom) && (
        <ul className="absolute z-30 mt-1 w-full rounded-lg border border-violet-200/60 bg-white/95 backdrop-blur-md shadow-lg py-1 max-h-52 overflow-auto">
          {matches.slice(0, 10).map((c) => (
            <li key={c}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-violet-900 hover:bg-violet-50"
                onMouseDown={(e) => { e.preventDefault(); add(c) }}
              >
                {c}
              </button>
            </li>
          ))}
          {canAddCustom && (
            <li className="border-t border-violet-100">
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-violet-600 hover:bg-violet-50"
                onMouseDown={(e) => { e.preventDefault(); add(inputValue.trim()) }}
              >
                Add &quot;{inputValue.trim()}&quot; as custom condition
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

type AnalysisEntry = {
  id: string
  date: string
  currentConditions: string
  concernedConditions: string
  userDescription: string
  analysis: string
  preview?: string
}

function analysesStorageKey(userId?: string) {
  return `nutrimedai_analyses_${userId || 'guest'}`
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result || ''))
    r.onerror = () => reject(new Error('Failed to read file'))
    r.readAsDataURL(file)
  })
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .trim()
}

function extractOneLine(text: string, label: string): string | null {
  const re = new RegExp(`${label}\\s*:?\\s*\\n?\\s*([^\\n]+)`, 'i')
  const m = stripMarkdown(text).match(re)
  return m?.[1]?.trim() || null
}

function extractBlock(text: string, startLabel: string, endLabels: string[]): string | null {
  const cleaned = stripMarkdown(text)
  const endPart = endLabels.length > 0 ? `(?=\\n\\s*(?:${endLabels.join('|')})\\s*:?|$)` : '$'
  const re = new RegExp(`${startLabel}\\s*:?\\s*\\n?\\s*([\\s\\S]*?)${endPart}`, 'i')
  const m = cleaned.match(re)
  return m?.[1]?.trim() || null
}

function parseKeyMetricsLine(text: string): Array<{ label: string; value: string }> {
  const line = extractOneLine(text, 'KEY\\s*METRICS')
  if (!line) return []
  const normalized = line.replace(/\|/g, ',')
  return normalized
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const idx = chunk.indexOf(':')
      if (idx === -1) return { label: chunk, value: '' }
      return {
        label: chunk.slice(0, idx).trim(),
        value: chunk.slice(idx + 1).trim(),
      }
    })
}

function parseScore(text: string): number | null {
  const outOf100 = text.match(/(?:nutrition\s*score|NUTRITION\s*SCORE)[:\s]*(\d{1,3})\s*\/\s*100/i)
  if (outOf100) return Math.min(100, Math.max(0, parseInt(outOf100[1], 10)))
  const simple100 = text.match(/\b(\d{1,3})\s*\/\s*100\b/)
  if (simple100) return Math.min(100, Math.max(0, parseInt(simple100[1], 10)))
  const outOf10 = text.match(/(?:health\s*score|score)[:\s]*(\d{1,2})\s*\/\s*10\b/i)
  if (outOf10) return Math.min(100, Math.max(0, Math.round((parseInt(outOf10[1], 10) / 10) * 100)))
  return null
}

type InfographyParsed = { foodLines: string[]; adviceLines: { tag: string; text: string }[] }

/** Remove redundant TL;DR lines and separator-only lines from ingredient list */
function cleanTldrFoodLines(lines: string[]): string[] {
  return lines.filter((line) => {
    const t = line.trim()
    if (!t) return false
    const lower = t.toLowerCase()
    if (lower === 'tldr:' || lower === 'tl;dr:') return false
    if (lower === 'tl;dr (ingredient-wise):' || lower === 'tl;dr (ingredient-wise)') return false
    if (/^[-–—\s]+$/.test(t)) return false
    return true
  })
}

/** Split "Ingredient: takeaway" for display (ingredient emphasized) */
function splitIngredientLine(line: string): { ingredient: string; takeaway: string } | null {
  const colonIdx = line.indexOf(':')
  if (colonIdx === -1) return null
  return {
    ingredient: line.slice(0, colonIdx).trim(),
    takeaway: line.slice(colonIdx + 1).trim(),
  }
}

function parseInfographyBlock(text: string): InfographyParsed {
  const foodLines: string[] = []
  const adviceLines: { tag: string; text: string }[] = []
  const labelRegex = /^\[([^\]]+)\]\s*(.*)$/
  const parts = text.split(/\n\s*---\s*\n/)
  const hasDashed = parts.length > 1
  const beforeDashed = (parts[0] || '').trim()
  const afterDashed = parts.slice(1).join('\n---\n').trim()

  if (hasDashed) {
    beforeDashed.split('\n').forEach((line) => {
      const t = line.trim()
      if (t) foodLines.push(t)
    })
    afterDashed.split('\n').forEach((line) => {
      const t = line.trim()
      if (!t) return
      const m = t.match(labelRegex)
      if (m) adviceLines.push({ tag: m[1].trim(), text: m[2].trim() })
      else adviceLines.push({ tag: '', text: t })
    })
  } else {
    text.split('\n').forEach((line) => {
      const t = line.trim()
      if (!t) return
      const m = t.match(labelRegex)
      if (m) adviceLines.push({ tag: m[1].trim(), text: m[2].trim() })
      else foodLines.push(t)
    })
  }
  return { foodLines: cleanTldrFoodLines(foodLines), adviceLines }
}

function LoginScreen({
  onLogin,
  onRegister,
  error,
  onClearError,
  defaultTab,
  onBack,
}: {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (email: string, password: string) => Promise<void>
  error: string | null
  onClearError: () => void
  defaultTab: 'login' | 'register'
  onBack: () => void
}) {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f3ff] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-violet-200/60 bg-white/50 backdrop-blur-xl p-6 shadow-lg shadow-violet-200/30">
        <button type="button" onClick={onBack} className="text-xs text-violet-500 hover:text-violet-800 mb-4">
          ← Back to home
        </button>
        <div className="flex items-center gap-3 mb-6">
          <Logo className="h-10 w-10" />
          <h1 className="text-xl font-semibold text-violet-900">NutriMedAI</h1>
        </div>
        <p className="text-sm text-violet-600 mb-4">Sign in to your dashboard.</p>
        <div className="flex rounded-lg bg-violet-100/60 p-1 mb-4">
          <button
            type="button"
            onClick={() => { setTab('login'); onClearError(); setPassword('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'login' ? 'bg-violet-500 text-white' : 'text-violet-600 hover:text-violet-900'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); onClearError(); setPassword('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'register' ? 'bg-violet-500 text-white' : 'text-violet-600 hover:text-violet-900'}`}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-violet-800 mb-1">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-violet-200/60 bg-white/60 text-violet-900 placeholder:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-violet-800 mb-1">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={tab === 'register' ? 6 : 1}
              className="w-full px-3 py-2 rounded-lg border border-violet-200/60 bg-white/60 text-violet-900 placeholder:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
              placeholder={tab === 'register' ? 'Min 6 characters' : ''}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Please wait...' : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AboutPage({
  onBack,
  onLogin,
  onRegister,
}: {
  onBack: () => void
  onLogin: () => void
  onRegister: () => void
}) {
  return (
    <div className="min-h-screen bg-[#f5f3ff] text-violet-900">
      <header className="sticky top-0 z-[9999] bg-[#f5f3ff]/90 backdrop-blur-md border-b border-violet-200/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <span className="font-semibold text-lg text-violet-900">NutriMedAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-violet-600">
            <button type="button" onClick={onBack} className="hover:text-violet-900 transition-colors">Home</button>
            <span className="px-3 py-1 rounded-full bg-violet-200/60 text-violet-700 text-xs font-semibold">Coming Soon</span>
            <span className="text-violet-900">About</span>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onLogin} className="px-4 py-2 rounded-full text-sm font-semibold text-violet-600 hover:text-violet-900 transition-colors">Login</button>
            <button type="button" onClick={onRegister} className="px-4 py-2 rounded-full text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors">Get Started</button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-violet-900">About NutriMedAI</h1>
          <p className="mt-4 text-lg text-violet-600 max-w-2xl mx-auto">
            Personalized nutrition analysis powered by AI. We analyze your food against your health profile.
          </p>
        </div>
        <section className="rounded-2xl border border-violet-200/50 bg-white/50 backdrop-blur-xl p-6 md:p-8 mb-8 shadow-lg shadow-violet-200/20">
          <h2 className="text-2xl font-semibold text-violet-700 mb-4">How it works</h2>
          <p className="text-violet-700 leading-relaxed mb-6">
            You set two types of conditions in your profile: <strong className="text-violet-900">Current medical condition</strong> (e.g. diabetes, hypertension) and <strong className="text-violet-900">Conditions to monitor</strong>. You upload a photo of your food; our AI gives tailored analysis for both.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-violet-50/60 border border-violet-200/50 p-5">
              <h3 className="text-lg font-semibold text-violet-900 mb-2">Current medical condition</h3>
              <p className="text-sm text-violet-600">How safe and suitable this meal is for your current health.</p>
            </div>
            <div className="rounded-xl bg-violet-50/60 border border-violet-200/50 p-5">
              <h3 className="text-lg font-semibold text-violet-900 mb-2">Conditions to monitor</h3>
              <p className="text-sm text-violet-600">Advice for conditions you&apos;re watching or at risk for.</p>
            </div>
          </div>
        </section>
        <div className="text-center pt-4">
          <button type="button" onClick={onRegister} className="px-6 py-3 rounded-full bg-violet-500 text-white font-semibold hover:bg-violet-600 transition-colors">
            Get started free
          </button>
        </div>
      </main>
    </div>
  )
}

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=2000&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=2000&q=80',
]

function LandingPage({
  onLogin,
  onRegister,
  onAboutClick,
}: {
  onLogin: () => void
  onRegister: () => void
  onAboutClick: () => void
}) {
  const [heroSlide, setHeroSlide] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setHeroSlide((s) => (s + 1) % HERO_IMAGES.length), 5500)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="min-h-screen bg-[#f5f3ff] text-violet-900">
      <header className="sticky top-0 z-[9999] bg-[#f5f3ff]/90 backdrop-blur-md border-b border-violet-200/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <span className="font-semibold text-lg text-violet-900">NutriMedAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-violet-600">
            <button type="button" className="hover:text-violet-900 transition-colors">Home</button>
            <button type="button" onClick={onAboutClick} className="hover:text-violet-900 transition-colors">About</button>
            <span className="px-3 py-1 rounded-full bg-violet-200/60 text-violet-700 text-xs font-semibold">Coming Soon</span>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onLogin} className="px-4 py-2 rounded-full text-sm font-semibold text-violet-600 hover:text-violet-900 transition-colors">Login</button>
            <button type="button" onClick={onRegister} className="px-4 py-2 rounded-full text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors">Get Started</button>
          </div>
        </div>
      </header>

      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url('${src}')`,
              opacity: i === heroSlide ? 1 : 0,
              zIndex: i === heroSlide ? 1 : 0,
            }}
            aria-hidden={i !== heroSlide}
          />
        ))}
        <div
          className="absolute inset-0 z-10"
          style={{ background: 'linear-gradient(0deg, rgba(139,92,246,0.55) 0%, rgba(139,92,246,0.25) 50%, rgba(245,243,255,0.4) 100%)' }}
        />
        <div className="relative z-20 max-w-6xl mx-auto px-4 md:px-8 py-20 text-center w-full">
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight text-violet-900">Take control of your health</h1>
          <p className="mt-4 text-lg text-violet-700">Smarter nutrition. Made personal.</p>
          <button
            type="button"
            onClick={onRegister}
            className="mt-8 px-6 py-3 rounded-full bg-violet-500 text-white font-semibold hover:bg-violet-600"
          >
            Get started free
          </button>
          <div className="flex justify-center gap-2 mt-10">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setHeroSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === heroSlide ? 'w-6 bg-violet-400' : 'w-1.5 bg-violet-300/50 hover:bg-violet-300'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-violet-900">
            We focus on what fuels you. <br /> Not just the calories.
          </h2>
          <p className="mt-4 text-violet-600">
            We turn everyday food decisions into clear, personalized guidance.
          </p>
          <p className="mt-4 text-violet-500 text-sm">
            Backed by science. Powered by AI. Built for you.
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { title: 'Track your nutrition to optimize your health.', body: 'All macros + micros, in one clear snapshot.' },
              { title: 'Snap and go. AI does the rest.', body: 'Real-time photo analysis with clinical context.' },
              { title: 'See measurable progress that sticks.', body: 'Daily insights that move your goals forward.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-violet-200/50 bg-white/50 backdrop-blur-sm p-6 text-left shadow-lg shadow-violet-200/20">
                <div className="text-sm font-semibold text-violet-900">{item.title}</div>
                <div className="text-sm text-violet-600 mt-2">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-violet-200/50 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h3 className="text-2xl font-semibold text-violet-900">As Featured In</h3>
          <p className="text-violet-600 text-sm mt-2">
            Leading publications recognize NutriMedAI&apos;s AI‑powered nutrition guidance.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4 text-violet-600">
            {['The Times', 'Google', 'House of Lords', 'Healthline', 'Lifehacker'].map((logo) => (
              <div key={logo} className="rounded-xl border border-violet-200/50 bg-violet-50/60 py-3">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative py-16"
        style={{
          backgroundImage: "linear-gradient(0deg, rgba(139,92,246,0.5), rgba(245,243,255,0.6)), url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=2000&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-violet-900">Your everyday health navigator.</h2>
          <p className="mt-4 text-violet-700">
            Built to meet your body and brain where they are. Then helps you level up.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3 text-left">
            {[
              { title: 'Condition‑aware guidance', text: 'Recommendations tailored to current and monitored conditions.' },
              { title: 'Macro + micro breakdowns', text: 'Calories, protein, carbs, fat, fiber, sugar, sodium, vitamins.' },
              { title: 'Smart alternatives', text: 'Safer swaps and portion guidance for your goals.' },
            ].map((tile, idx) => (
              <div key={tile.title} className="rounded-2xl border border-violet-200/50 bg-white/50 backdrop-blur-sm p-6 shadow-lg shadow-violet-200/20">
                <div className="text-violet-500 font-semibold text-lg">{idx + 1}</div>
                <div className="mt-2 text-violet-900 font-semibold">{tile.title}</div>
                <div className="mt-2 text-violet-600 text-sm">{tile.text}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onRegister}
            className="mt-8 px-6 py-3 rounded-full bg-violet-500 text-white font-semibold hover:bg-violet-600"
          >
            Download Now
          </button>
        </div>
      </section>

      <footer className="border-t border-violet-200/50 bg-white/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          <div className="grid gap-10 md:grid-cols-4 text-sm">
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-2 text-violet-900">
                <Logo className="h-7 w-7" />
                <span className="font-semibold text-violet-900">NutriMedAI</span>
              </div>
              <p className="text-violet-600">Stay updated for our latest news &amp; insights.</p>
              <div className="flex gap-2 text-violet-600">
                <a href="#" className="p-2 rounded-lg hover:bg-violet-100 transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-lg hover:bg-violet-100 transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-lg hover:bg-violet-100 transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-lg hover:bg-violet-100 transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="email" placeholder="Enter your email" className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-white/60 border border-violet-200/60 text-violet-900 placeholder:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50" />
                <button type="button" className="px-4 py-2.5 rounded-lg bg-violet-500 text-white font-semibold hover:bg-violet-600 whitespace-nowrap">Subscribe</button>
              </div>
            </div>
            <div>
              <div className="text-violet-900 font-semibold mb-4">Individuals</div>
              <ul className="space-y-2.5 text-violet-600">
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">Nutrition tracker</button></li>
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">Meal analysis</button></li>
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">Health reports</button></li>
              </ul>
            </div>
            <div>
              <div className="text-violet-900 font-semibold mb-4">Company</div>
              <ul className="space-y-2.5 text-violet-600">
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">FAQ</button></li>
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">Contact</button></li>
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">Privacy</button></li>
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">Terms of Service</button></li>
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">Cookies</button></li>
              </ul>
            </div>
            <div>
              <div className="text-violet-900 font-semibold mb-4">Resources</div>
              <ul className="space-y-2.5 text-violet-600">
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">Community</button></li>
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">Blog</button></li>
                <li><button type="button" className="text-left hover:text-violet-900 transition-colors">Support</button></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 border-t border-violet-200/50">
          <p className="text-center text-xs text-violet-500">© 2023 – 2026 NutriMedAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const { user, loading: authLoading, login, register, logout, error: authError, clearError: clearAuthError } = useAuth()
  const [authView, setAuthView] = useState<'landing' | 'auth' | 'about'>('landing')
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [currentConditionsList, setCurrentConditionsList] = useState<string[]>([])
  const [concernedConditionsList, setConcernedConditionsList] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [concernedInput, setConcernedInput] = useState('')
  const [currentDropdownOpen, setCurrentDropdownOpen] = useState(false)
  const [concernedDropdownOpen, setConcernedDropdownOpen] = useState(false)
  const [userDescription, setUserDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysesList, setAnalysesList] = useState<AnalysisEntry[]>([])
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [showCurrentCondition, setShowCurrentCondition] = useState(true)
  const [showConcernedCondition, setShowConcernedCondition] = useState(true)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setAnalysis(null)
    setAnalysisError(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  const startNewAnalysis = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setUserDescription('')
    setAnalysis(null)
    setAnalysisError(null)
    setCurrentConditionsList([])
    setConcernedConditionsList([])
    setCurrentInput('')
    setConcernedInput('')
    setSidebarSearch('')
  }

  useEffect(() => {
    if (!user) return
    try {
      const raw = localStorage.getItem(analysesStorageKey(user.id))
      const parsed = raw ? JSON.parse(raw) as AnalysisEntry[] : []
      setAnalysesList(Array.isArray(parsed) ? parsed : [])
    } catch {
      setAnalysesList([])
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    localStorage.setItem(analysesStorageKey(user.id), JSON.stringify(analysesList))
  }, [analysesList, user])

  const currentConditionsStr = currentConditionsList.filter((c) => c !== 'None / No current conditions').join(', ') || 'No current medical conditions'
  const concernedConditionsStr = concernedConditionsList.join(', ') || 'None specified'

  const filteredHistory = analysesList.filter((entry) => {
    const q = sidebarSearch.toLowerCase().trim()
    if (!q) return true
    return (
      entry.currentConditions.toLowerCase().includes(q) ||
      entry.concernedConditions.toLowerCase().includes(q) ||
      entry.analysis.toLowerCase().includes(q)
    )
  })

  const loadHistoryEntry = (entry: AnalysisEntry) => {
    setCurrentConditionsList(entry.currentConditions ? entry.currentConditions.split(',').map((s) => s.trim()).filter(Boolean) : [])
    setConcernedConditionsList(entry.concernedConditions ? entry.concernedConditions.split(',').map((s) => s.trim()).filter(Boolean) : [])
    setUserDescription(entry.userDescription)
    setAnalysis(entry.analysis)
    setPreview(entry.preview || null)
    setFile(null)
    setAnalysisError(null)
  }

  const analyzeFood = async () => {
    if (!file) {
      setAnalysisError('Please upload an image first.')
      return
    }
    setLoadingAnalysis(true)
    setAnalysisError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('current_conditions', currentConditionsStr)
      form.append('concerned_conditions', concernedConditionsStr)
      form.append('user_description', userDescription.trim())
      const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Analysis failed')
      const nextAnalysis = data.analysis || 'No analysis returned.'
      setAnalysis(nextAnalysis)
      const persistentPreview = await toDataUrl(file)
      const entry: AnalysisEntry = {
        id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        date: new Date().toISOString(),
        currentConditions: currentConditionsStr,
        concernedConditions: concernedConditionsStr,
        userDescription: userDescription.trim(),
        analysis: nextAnalysis,
        preview: persistentPreview,
      }
      setAnalysesList((prev) => [entry, ...prev].slice(0, 50))
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const dishName = analysis ? extractOneLine(analysis, 'DISH') : null
  const foodSummary = analysis
    ? extractBlock(analysis, 'FOOD\\s*SUMMARY', ['KEY\\s*METRICS', 'CURRENT\\s*CONDITION\\s*SUMMARY', 'CONCERNED\\s*CONDITION\\s*SUMMARY'])
    : null
  const currentSummary = analysis
    ? extractBlock(analysis, 'CURRENT\\s*CONDITION\\s*SUMMARY', ['CONCERNED\\s*CONDITION\\s*SUMMARY', 'ALTERNATIVES'])
    : null
  const concernedSummary = analysis
    ? extractBlock(analysis, 'CONCERNED\\s*CONDITION\\s*SUMMARY', ['ALTERNATIVES'])
    : null
  const metrics = analysis ? parseKeyMetricsLine(analysis) : []
  const nutritionScore = analysis ? parseScore(analysis) : null
  const categoryChips = (() => {
    const words = (dishName || '')
      .split(/[\s\/,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1 && !/^(with|and|the|or|&)$/i.test(w))
    const uniq = [...new Set(words)].slice(0, 6).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    if (nutritionScore != null && nutritionScore >= 60 && !uniq.some((c) => /healthy/i.test(c))) uniq.push('Healthy')
    return uniq
  })()
  const additionalInfo = analysis
    ? extractBlock(analysis, 'ADDITIONAL\\s*INFORMATION|ADDITIONAL\\s*INFO|NOTES|TIPS', [])
    : null
  const alternatives = analysis ? extractBlock(analysis, 'ALTERNATIVES', []) : null
  const alternativesList = (() => {
    if (!alternatives) return []
    return alternatives
      .split('\n')
      .map((l) => l.trim())
      .filter((line) => {
        if (!line) return false
        if (/^[-–—\s]+$/.test(line)) return false
        if (/^(nutrition\s*score|NUTRITION\s*SCORE)\s*:?\s*\d*\s*\/\s*\d+/i.test(line)) return false
        if (/^\d+\s*\/\s*100\s*$/i.test(line)) return false
        return true
      })
  })()

  const downloadPDF = () => {
    if (!dishName && !analysis) return
    const doc = new jsPDF()
    const margin = 14
    const pageW = 210
    const contentW = pageW - margin * 2
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    const ensurePage = (y: number, need: number) => {
      if (y + need > 280) {
        doc.addPage()
        return 20
      }
      return y
    }

    let y = 20

    // ----- Header: NutriMedAI, Nutrition Report., date -----
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('NutriMedAI', margin, y)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Nutrition Report.', margin, y + 7)
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const dateDims = 'getTextDimensions' in doc && typeof (doc as { getTextDimensions: (t: string) => { w: number } }).getTextDimensions === 'function'
      ? (doc as { getTextDimensions: (t: string) => { w: number } }).getTextDimensions(reportDate).w
      : reportDate.length * 2.2
    doc.text(reportDate, pageW - margin - dateDims, y)
    doc.setTextColor(0, 0, 0)
    y += 18

    // ----- Food / meal -----
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Food / meal', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text(dishName || '—', margin, y)
    y += 6
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text('Image: ---', margin, y)
    doc.setTextColor(0, 0, 0)
    y += 12

    // ----- Nutrition score -----
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Nutrition score', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    const scoreVal = nutritionScore != null ? Math.min(100, Math.max(0, nutritionScore)) : null
    const scoreStr = scoreVal != null ? `${scoreVal}/100` : '—/100'
    doc.setFontSize(12)
    doc.text(scoreStr, margin, y)
    const barW = 100
    const barH = 5
    const barY = y - 3
    doc.setFillColor(220, 220, 220)
    doc.rect(margin + 38, barY, barW, barH, 'F')
    if (scoreVal != null && scoreVal > 0) {
      doc.setFillColor(0, 140, 130)
      doc.rect(margin + 38, barY, (barW * scoreVal) / 100, barH, 'F')
    }
    y += 12

    // ----- Key metrics (colored boxes) -----
    const metricColors: Record<string, [number, number, number]> = {
      calories: [230, 140, 80],
      protein: [200, 80, 140],
      carbs: [240, 200, 80],
      fat: [150, 200, 230],
      fiber: [40, 120, 80],
      sugar: [80, 200, 220],
      sodium: [180, 150, 220],
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Key metrics', margin, y)
    y += 7
    const boxW = (contentW - 12) / 4
    const boxH = 16
    const gap = 4
    metrics.slice(0, 7).forEach((m, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const x = margin + col * (boxW + gap)
      const boxY = y + row * (boxH + gap)
      const key = metricKey(m.label)
      const [r, g, b] = metricColors[key] || [200, 200, 200]
      doc.setFillColor(r, g, b)
      doc.rect(x, boxY, boxW, boxH, 'F')
      doc.setDrawColor(200, 200, 200)
      doc.rect(x, boxY, boxW, boxH, 'S')
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text(m.label.toUpperCase(), x + 3, boxY + 5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(m.value || '—', x + 3, boxY + 11)
      doc.setTextColor(0, 0, 0)
    })
    const metricRows = Math.ceil(Math.min(metrics.length, 7) / 4)
    y += metricRows * (boxH + gap) + 8

    // ----- Condition summary blocks with TL;DR + numbered recommendations -----
    const recNumberColors: [number, number, number][] = [
      [0, 140, 130],
      [230, 140, 60],
      [60, 120, 200],
      [160, 100, 60],
      [220, 100, 140],
    ]
    const renderConditionBlock = (title: string, rawSummary: string) => {
      y = ensurePage(y, 60)
      const blockStartY = y
      doc.setDrawColor(0, 140, 130)
      doc.setLineWidth(0.4)
      y += 5
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text(title, margin + 2, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      y += 6
      const parsed = parseInfographyBlock(rawSummary)
      if (parsed.foodLines.length > 0) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(60, 60, 60)
        doc.text('TL;DR (ingredient-wise)', margin + 2, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        const getW = (txt: string) => ('getTextDimensions' in doc && typeof (doc as { getTextDimensions: (t: string) => { w: number } }).getTextDimensions === 'function'
          ? (doc as { getTextDimensions: (t: string) => { w: number } }).getTextDimensions(txt).w
          : txt.length * 1.2)
        parsed.foodLines.forEach((line) => {
          y = ensurePage(y, 8)
          const split = splitIngredientLine(line)
          if (split) {
            const prefix = '• ' + split.ingredient + ': '
            doc.setFont('helvetica', 'bold')
            doc.text(prefix, margin + 4, y)
            const preW = getW(prefix)
            doc.setFont('helvetica', 'normal')
            const takeawayWrap = doc.splitTextToSize(split.takeaway, contentW - 12 - preW)
            if (takeawayWrap[0]) doc.text(takeawayWrap[0], margin + 4 + preW, y)
            y += 5
            for (let j = 1; j < takeawayWrap.length; j++) {
              y = ensurePage(y, 6)
              doc.text(takeawayWrap[j], margin + 4, y)
              y += 5
            }
          } else {
            const wrap = doc.splitTextToSize(line, contentW - 8)
            wrap.forEach((w: string) => {
              doc.text('• ' + w, margin + 4, y)
              y += 5
            })
          }
          y += 1
        })
        y += 4
      }
      if (parsed.adviceLines.length > 0) {
        y = ensurePage(y, 10)
        parsed.adviceLines.slice(0, 8).forEach((item, idx) => {
          y = ensurePage(y, 18)
          const num = String(idx + 1).padStart(2, '0')
          const [r, g, b] = recNumberColors[idx % recNumberColors.length]
          doc.setFillColor(r, g, b)
          doc.rect(margin + 2, y - 4, 8, 8, 'F')
          doc.setFontSize(8)
          doc.setTextColor(255, 255, 255)
          doc.setFont('helvetica', 'bold')
          doc.text(num, margin + 4.5, y + 0.5)
          doc.setTextColor(0, 0, 0)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          const lineText = item.tag ? `[${item.tag}] ${item.text}` : item.text
          const lines = doc.splitTextToSize(lineText, contentW - 18)
          lines.forEach((w: string) => {
            doc.text(w, margin + 14, y)
            y += 5
          })
          y += 3
        })
      }
      y += 4
      doc.rect(margin, blockStartY, contentW, y - blockStartY, 'S')
      y += 6
    }

    if (currentSummary) {
      renderConditionBlock('Current medical condition summary', currentSummary)
    }
    if (concernedSummary) {
      renderConditionBlock('Concerned condition summary', concernedSummary)
    }

    // ----- Alternatives (if present) -----
    const pdfAlternatives = analysis ? extractBlock(analysis, 'ALTERNATIVES', []) : null
    if (pdfAlternatives && pdfAlternatives.trim()) {
      const pdfAltLines = pdfAlternatives
        .split('\n')
        .map((l) => l.trim())
        .filter((line) => {
          if (!line) return false
          if (/^[-–—\s]+$/.test(line)) return false
          if (/^(nutrition\s*score|NUTRITION\s*SCORE)\s*:?\s*\d*\s*\/\s*\d+/i.test(line)) return false
          if (/^\d+\s*\/\s*100\s*$/i.test(line)) return false
          return true
        })
      if (pdfAltLines.length > 0) {
        y = ensurePage(y, 25)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Similar but safer', margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        pdfAltLines.forEach((line) => {
          y = ensurePage(y, 6)
          doc.text('• ' + line, margin + 2, y)
          y += 5
        })
      }
    }

    doc.save(`${(dishName || 'nutrition').replace(/[^a-z0-9-_]/gi, '_')}.pdf`)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f2f34]">
        <div className="text-white/70">Loading...</div>
      </div>
    )
  }

  if (!user) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onLogin={() => { setAuthTab('login'); setAuthView('auth') }}
          onRegister={() => { setAuthTab('register'); setAuthView('auth') }}
          onAboutClick={() => setAuthView('about')}
        />
      )
    }
    if (authView === 'about') {
      return (
        <AboutPage
          onBack={() => setAuthView('landing')}
          onLogin={() => { setAuthTab('login'); setAuthView('auth') }}
          onRegister={() => { setAuthTab('register'); setAuthView('auth') }}
        />
      )
    }
    return (
      <LoginScreen
        onLogin={login}
        onRegister={register}
        error={authError}
        onClearError={clearAuthError}
        defaultTab={authTab}
        onBack={() => setAuthView('landing')}
      />
    )
  }

  const isLightResultView = !!analysis
  return (
    <div className={`min-h-screen flex ${isLightResultView ? 'bg-[#f5f3ff] text-violet-900' : 'bg-[#f5f3ff] text-violet-900'}`}>
      <aside className="hidden md:flex w-[290px] shrink-0 border-r flex-col border-violet-200/50 bg-[#f5f3ff]">
        <div className="p-3 border-b border-violet-200/50">
          <button
            type="button"
            onClick={startNewAnalysis}
            className="w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-violet-500 text-white hover:bg-violet-600"
          >
            New analysis
          </button>
        </div>
        <div className="p-3">
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder="Search history..."
            className="w-full px-3 py-2 rounded-lg border border-violet-200/60 bg-white/50 text-violet-900 placeholder:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
          {filteredHistory.length === 0 ? (
            <p className="text-sm px-2 py-1 text-violet-600">No analyses yet.</p>
          ) : (
            filteredHistory.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => loadHistoryEntry(entry)}
                className="w-full text-left rounded-lg border border-violet-200/50 bg-white/40 hover:bg-violet-50/80 transition-colors px-2 py-2 text-violet-900"
              >
                <div className="text-xs mb-1 text-violet-600">
                  {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-sm truncate">{entry.currentConditions || 'No current condition'}</div>
                <div className="text-xs truncate text-violet-600">{entry.concernedConditions || 'No monitored conditions'}</div>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-[9999] border-b border-violet-200/50 bg-[#f5f3ff]/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo className="h-9 w-9" />
              <h1 className="text-lg font-semibold text-violet-900">NutriMedAI</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm truncate max-w-[200px] text-violet-700" title={user.email}>{user.email}</span>
              <button type="button" onClick={logout} className="px-3 py-1.5 rounded-xl text-sm font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-100 border border-violet-200/60">
                Log out
              </button>
              {analysis && (
                <button type="button" onClick={downloadPDF} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium bg-violet-500 text-white hover:bg-violet-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download PDF
                </button>
              )}
            </div>
          </div>
        </header>

        <main className={`max-w-7xl mx-auto px-4 md:px-8 py-8 w-full space-y-6 ${isLightResultView ? 'bg-[#f5f3ff]' : ''}`}>
          {!analysis && (
          <section className="rounded-2xl p-4 md:p-6 border border-violet-200/50 bg-white/50 backdrop-blur-xl shadow-lg shadow-violet-200/20">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h2 className="text-lg md:text-xl font-semibold text-violet-900">Medical profile & analysis</h2>
              <button
                type="button"
                onClick={startNewAnalysis}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-100 border border-violet-200/60"
              >
                New analysis
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ConditionMultiSelect
                label="Current medical condition"
                placeholder="Search or type a condition (e.g. Diabetes, Hypertension)"
                selected={currentConditionsList}
                onSelectedChange={setCurrentConditionsList}
                dropdownOpen={currentDropdownOpen}
                onDropdownOpenChange={setCurrentDropdownOpen}
                inputValue={currentInput}
                onInputValueChange={setCurrentInput}
                options={CONDITION_OPTIONS}
              />
              <ConditionMultiSelect
                label="Conditions to monitor"
                placeholder="Search or type a condition (e.g. Heart health, Blood sugar)"
                selected={concernedConditionsList}
                onSelectedChange={setConcernedConditionsList}
                dropdownOpen={concernedDropdownOpen}
                onDropdownOpenChange={setConcernedDropdownOpen}
                inputValue={concernedInput}
                onInputValueChange={setConcernedInput}
                options={CONDITION_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <label className="flex flex-col items-center justify-center w-full min-h-[280px] rounded-lg border border-violet-200/60 bg-white/40 cursor-pointer overflow-hidden transition-colors hover:bg-violet-50/60">
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                {preview ? (
                  <img src={preview} alt="Upload preview" className="w-full h-full min-h-[280px] max-h-[400px] object-contain bg-white/40" />
                ) : (
                  <span className="flex flex-col items-center gap-3 text-center px-4 py-8">
                    <span className="flex items-center justify-center w-11 h-11 rounded-lg bg-violet-100 text-violet-500" aria-hidden>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-violet-800">Upload food image</span>
                    <span className="text-xs text-violet-500">PNG, JPG, JPEG, GIF, WEBP</span>
                  </span>
                )}
              </label>

              <div className="flex flex-col min-h-[280px] rounded-lg border border-violet-200/60 bg-white/40 p-5">
                <label htmlFor="description-input" className="text-sm font-medium text-violet-800 mb-2 block">
                  Description (optional)
                </label>
                <input
                  id="description-input"
                  type="text"
                  placeholder="e.g. Portion size, preparation method, or your question"
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-violet-200/60 bg-white/60 text-violet-900 placeholder:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 text-sm"
                />
                <button
                  type="button"
                  onClick={analyzeFood}
                  disabled={!file || loadingAnalysis}
                  className="mt-5 w-full px-4 py-3 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
                >
                  {loadingAnalysis ? 'Analyzing...' : 'Analyze food'}
                </button>
                {analysisError && (
                  <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {analysisError}
                  </p>
                )}
              </div>
            </div>
          </section>
          )}

          {analysis && (
            <div className="flex flex-col lg:flex-row gap-6 w-full">
              {/* Left: IDENTIFIED FOOD card + circular image + Nutrition score - fixed width so it never collapses */}
              <div className="w-full lg:w-[340px] lg:flex-shrink-0 lg:min-w-[340px] space-y-4">
                <div className="bg-white/80 backdrop-blur rounded-2xl border border-violet-200/60 shadow-sm overflow-hidden">
                  <div className="bg-violet-50/80 border-b border-violet-200/60 px-4 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-800">Identified food</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-violet-900">{dishName || 'Food item'}</h3>
                    <div className="mt-4 flex justify-center">
                      {preview ? (
                        <img src={preview} alt={dishName || 'Uploaded food'} className="w-48 h-48 rounded-full object-cover border-4 border-violet-100 shadow-inner" />
                      ) : (
                        <div className="w-48 h-48 rounded-full bg-violet-50 border-4 border-violet-200 flex items-center justify-center text-violet-600 text-sm">No image</div>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-medium text-violet-800 mb-2">Nutrition score</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 rounded-full bg-violet-100 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500 transition-all animate-progress" style={{ width: `${nutritionScore != null ? Math.min(100, Math.max(0, nutritionScore)) : 0}%` }} />
                        </div>
                        <span className="text-sm font-bold text-violet-900 tabular-nums flex-shrink-0">{nutritionScore != null ? `${nutritionScore}/100` : '—/100'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Nutrition summary, metrics, concern tags, SHOW checkboxes, condition summaries */}
              <div className="flex-1 min-w-0">
                <div className="bg-white/80 backdrop-blur rounded-2xl border border-violet-200/60 shadow-sm p-5 md:p-6">
                  <h3 className="text-xl font-semibold text-violet-900 mb-3">Nutrition summary</h3>
                  <p className="text-violet-800 leading-relaxed mb-4">{foodSummary || 'Analysis generated successfully.'}</p>

                  {metrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      {metrics.map((m) => {
                        const key = metricKey(m.label)
                        return (
                          <div key={`${m.label}_${m.value}`} className={`metric-${key} metric-card-hover rounded-xl p-3 flex items-center gap-3 border border-violet-200/50`}>
                            <span className="text-violet-700 flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5">{METRIC_ICONS[key] || METRIC_ICONS.calories}</span>
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">{m.label}</div>
                              <div className="text-sm font-bold text-violet-900 truncate">{m.value || '—'}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentConditionsList.filter((c) => c && c !== 'None / No current conditions').map((c) => (
                      <span key={c} className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500 text-white">{c}</span>
                    ))}
                    {concernedConditionsList.filter(Boolean).map((c) => (
                      <span key={c} className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-900 border border-purple-200">Concern: {c}</span>
                    ))}
                    {categoryChips.length > 0 && categoryChips.map((chip) => (
                      <span key={chip} className="px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800 border border-violet-200">{chip}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-700">Show:</span>
                    <label className="flex items-center gap-2 text-sm text-violet-900 cursor-pointer">
                      <input type="checkbox" checked={showCurrentCondition} onChange={(e) => setShowCurrentCondition(e.target.checked)} className="rounded border-violet-300 text-violet-600 focus:ring-violet-500" />
                      Current condition
                    </label>
                    <label className="flex items-center gap-2 text-sm text-violet-900 cursor-pointer">
                      <input type="checkbox" checked={showConcernedCondition} onChange={(e) => setShowConcernedCondition(e.target.checked)} className="rounded border-violet-300 text-violet-600 focus:ring-violet-500" />
                      Concerned condition
                    </label>
                  </div>

                  {currentSummary && showCurrentCondition && (() => {
                    const parsed = parseInfographyBlock(currentSummary)
                    return (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 rounded-t-xl bg-violet-50/80 border border-violet-200/60 border-b-0 px-4 py-3">
                          <svg className="w-5 h-5 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-sm font-bold uppercase tracking-wide text-violet-900">Current medical condition summary</span>
                        </div>
                        <div className="rounded-b-xl border border-t-0 border-violet-200/60 bg-white/80 p-4">
                          <div className="text-xs font-semibold text-violet-700 mb-2">{parsed.adviceLines.length} POINTS</div>
                          {parsed.foodLines.length > 0 && (
                            <>
                              <div className="rounded-lg bg-violet-50/60 border border-violet-100 px-3 py-2.5 mb-4">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-violet-700 mb-2">TL;DR (ingredient-wise)</div>
                                <ul className="space-y-2">
                                  {parsed.foodLines.map((line, i) => {
                                    const split = splitIngredientLine(line)
                                    return (
                                      <li key={i} className="text-sm flex flex-wrap gap-1.5">
                                        {split ? (
                                          <>
                                            <span className="font-semibold text-violet-900">{split.ingredient}:</span>
                                            <span className="text-violet-800">{split.takeaway}</span>
                                          </>
                                        ) : (
                                          <span className="text-violet-900">{line}</span>
                                        )}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            </>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {parsed.adviceLines.map((item, i) => {
                              const tag = (item.tag || '').toLowerCase()
                              const bg = tag.includes('important') ? 'bg-red-100 border-red-200' : tag.includes('reasoning') ? 'bg-orange-100 border-orange-200' : tag.includes('action') ? 'bg-blue-100 border-blue-200' : tag.includes('benefit') ? 'bg-emerald-100 border-emerald-200' : tag.includes('ask your doctor') ? 'bg-purple-100 border-purple-200' : 'bg-gray-100 border-gray-200'
                              const icon = tag.includes('important') ? (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>) : tag.includes('reasoning') ? (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>) : tag.includes('action') ? (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>) : tag.includes('benefit') ? (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>) : tag.includes('ask your doctor') ? (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>) : null
                              return (
                                <div key={i} className={`rounded-xl border p-3 flex gap-3 ${bg}`}>
                                  {icon}
                                  <div className="min-w-0">
                                    {item.tag && <div className="text-xs font-bold uppercase text-gray-600 mb-0.5">{item.tag}</div>}
                                    <p className="text-sm text-gray-800">{item.text}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {concernedSummary && showConcernedCondition && (() => {
                    const parsed = parseInfographyBlock(concernedSummary)
                    return (
                      <div className="mb-6">
                        <div className="flex items-center gap-2 rounded-t-xl bg-purple-50/80 border border-purple-200/60 border-b-0 px-4 py-3">
                          <svg className="w-5 h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          <span className="text-sm font-bold uppercase tracking-wide text-purple-900">Concerned condition summary</span>
                        </div>
                        <div className="rounded-b-xl border border-t-0 border-purple-200/60 bg-white/80 p-4">
                          <div className="text-xs font-semibold text-purple-700 mb-2">{parsed.adviceLines.length} POINTS</div>
                          {parsed.foodLines.length > 0 && (
                            <>
                              <div className="rounded-lg bg-purple-50/60 border border-purple-100 px-3 py-2.5 mb-4">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 mb-2">TL;DR (ingredient-wise)</div>
                                <ul className="space-y-2">
                                  {parsed.foodLines.map((line, i) => {
                                    const split = splitIngredientLine(line)
                                    return (
                                      <li key={i} className="text-sm flex flex-wrap gap-1.5">
                                        {split ? (
                                          <>
                                            <span className="font-semibold text-violet-900">{split.ingredient}:</span>
                                            <span className="text-purple-800">{split.takeaway}</span>
                                          </>
                                        ) : (
                                          <span className="text-purple-900">{line}</span>
                                        )}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            </>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {parsed.adviceLines.map((item, i) => {
                              const tag = (item.tag || '').toLowerCase()
                              const bg = tag.includes('important') ? 'bg-red-100 border-red-200' : tag.includes('reasoning') ? 'bg-orange-100 border-orange-200' : tag.includes('action') ? 'bg-blue-100 border-blue-200' : tag.includes('benefit') ? 'bg-emerald-100 border-emerald-200' : tag.includes('ask your doctor') ? 'bg-purple-100 border-purple-200' : 'bg-gray-100 border-gray-200'
                              const icon = tag.includes('important') ? (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>) : tag.includes('reasoning') ? (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>) : tag.includes('action') ? (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>) : tag.includes('benefit') ? (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>) : tag.includes('ask your doctor') ? (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>) : null
                              return (
                                <div key={i} className={`rounded-xl border p-3 flex gap-3 ${bg}`}>
                                  {icon}
                                  <div className="min-w-0">
                                    {item.tag && <div className="text-xs font-bold uppercase text-gray-600 mb-0.5">{item.tag}</div>}
                                    <p className="text-sm text-gray-800">{item.text}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {alternativesList.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-bold uppercase tracking-wide text-violet-800 mb-2">Similar but safer</h4>
                      <ul className="space-y-1.5">
                        {alternativesList.map((line, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-violet-900">
                            <svg className="w-4 h-4 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {additionalInfo && (
                    <div className="mb-4 rounded-xl border border-violet-200/60 bg-violet-50/60 p-3 flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-200 flex items-center justify-center text-violet-800 text-xs font-bold">i</span>
                      <p className="text-sm text-violet-900 leading-relaxed">{additionalInfo}</p>
                    </div>
                  )}

                  {!foodSummary && metrics.length === 0 && !currentSummary && !concernedSummary && (
                    <div className="rounded-xl border border-violet-200/60 bg-violet-50/60 p-4 text-violet-900 whitespace-pre-wrap leading-relaxed text-sm">{analysis}</div>
                  )}
                </div>

                <p className="text-xs text-violet-600 text-center">General dietary guidance; not a substitute for medical advice. When in doubt, discuss with your doctor.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
