import { useState, useEffect, useCallback } from 'react'
import { jsPDF } from 'jspdf'
import { useAuth } from './AuthContext'

const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '/api') : '/api'

const iconCl = 'w-5 h-5 flex-shrink-0'
const METRIC_ICONS: Record<string, React.ReactNode> = {
  calories: (
    <svg className={iconCl} viewBox="0 0 32 32" fill="none" filter="url(#iconShadow)">
      <defs>
        <filter id="iconShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.35" /></filter>
        <linearGradient id="flameGrad" x1="16" y1="28" x2="16" y2="4" gradientUnits="userSpaceOnUse"><stop stopColor="#f97316" /><stop offset="0.5" stopColor="#ea580c" /><stop offset="1" stopColor="#c2410c" /></linearGradient>
        <linearGradient id="flameTip" x1="16" y1="8" x2="16" y2="2" gradientUnits="userSpaceOnUse"><stop stopColor="#fed7aa" /><stop offset="1" stopColor="#fdba74" /></linearGradient>
      </defs>
      <path fill="url(#flameGrad)" d="M16 28c-4-3-8-7-8-12 0-4 2-6 4-8 0 2-2 4-2 6 0 2 2 4 4 4s4-2 4-4c0-2-2-4-2-6 2 2 4 4 4 8 0 5-4 9-8 12z" />
      <path fill="url(#flameTip)" d="M16 10c1 2 2 4 2 6 0 3-2 5-4 5s-4-2-4-5c0-2 1-4 2-6 1-1 2-2 4-2s3 1 4 2z" opacity="0.9" />
    </svg>
  ),
  protein: (
    <svg className={iconCl} viewBox="0 0 32 32" fill="none" filter="url(#iconShadow2)">
      <defs>
        <filter id="iconShadow2" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.3" /></filter>
        <radialGradient id="eggGrad" cx="50%" cy="40%" r="50%"><stop offset="0%" stopColor="#fef3c7" /><stop offset="70%" stopColor="#fde68a" /><stop offset="100%" stopColor="#d97706" /></radialGradient>
      </defs>
      <ellipse cx="16" cy="18" rx="8" ry="10" fill="url(#eggGrad)" stroke="#b45309" strokeWidth="0.8" />
      <ellipse cx="16" cy="10" rx="4" ry="4" fill="url(#eggGrad)" stroke="#b45309" strokeWidth="0.6" opacity="0.95" />
    </svg>
  ),
  carbs: (
    <svg className={iconCl} viewBox="0 0 32 32" fill="none" filter="url(#iconShadow3)">
      <defs>
        <filter id="iconShadow3" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.3" /></filter>
        <linearGradient id="wheatGrad" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox"><stop stopColor="#a16207" /><stop offset="0.5" stopColor="#ca8a04" /><stop offset="1" stopColor="#eab308" /></linearGradient>
      </defs>
      <path fill="url(#wheatGrad)" d="M8 8v14h3V12l2 10h2l2-10v10h3V8h-3l-2 8-2-8H11V8H8z" />
      <ellipse cx="8" cy="8" rx="2.5" ry="2" fill="#fef08a" />
      <ellipse cx="14" cy="8" rx="2.5" ry="2" fill="#fef08a" />
      <ellipse cx="20" cy="8" rx="2.5" ry="2" fill="#fef08a" />
      <path fill="url(#wheatGrad)" d="M14 8v2h4V8h-4z" opacity="0.8" />
    </svg>
  ),
  fat: (
    <svg className={iconCl} viewBox="0 0 32 32" fill="none" filter="url(#iconShadow4)">
      <defs>
        <filter id="iconShadow4" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.3" /></filter>
        <linearGradient id="dropGrad" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse"><stop stopColor="#fde047" /><stop offset="0.5" stopColor="#facc15" /><stop offset="1" stopColor="#eab308" /></linearGradient>
        <linearGradient id="dropShine" x1="10" y1="8" x2="20" y2="16" gradientUnits="userSpaceOnUse"><stop stopColor="#fef9c3" stopOpacity="0.8" /><stop offset="1" stopColor="transparent" /></linearGradient>
      </defs>
      <path fill="url(#dropGrad)" d="M16 4c-6 8-10 14-10 20a10 10 0 0020 0c0-6-4-12-10-20z" stroke="#ca8a04" strokeWidth="0.6" />
      <ellipse cx="13" cy="12" rx="4" ry="5" fill="url(#dropShine)" />
    </svg>
  ),
  fiber: (
    <svg className={iconCl} viewBox="0 0 32 32" fill="none" filter="url(#iconShadow5)">
      <defs>
        <filter id="iconShadow5" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.3" /></filter>
        <linearGradient id="leafGrad" x1="0" y1="1" x2="1" y2="0" gradientUnits="objectBoundingBox"><stop stopColor="#15803d" /><stop offset="0.5" stopColor="#22c55e" /><stop offset="1" stopColor="#4ade80" /></linearGradient>
        <linearGradient id="leafVein" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox"><stop stopColor="#14532d" /><stop offset="1" stopColor="#166534" /></linearGradient>
      </defs>
      <path fill="url(#leafGrad)" d="M16 4c-2 4-6 8-6 14 0 4 3 8 6 10 3-2 6-6 6-10 0-6-4-10-6-14z" stroke="#166534" strokeWidth="0.6" />
      <path fill="url(#leafVein)" d="M16 6v20M13 10l3 4 3-4M14 16l2 4 2-4" strokeWidth="0.5" opacity="0.7" />
    </svg>
  ),
  sugar: (
    <svg className={iconCl} viewBox="0 0 32 32" fill="none" filter="url(#iconShadow6)">
      <defs>
        <filter id="iconShadow6" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.3" /></filter>
        <linearGradient id="candyGrad" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#fda4af" /><stop offset="0.4" stopColor="#f43f5e" /><stop offset="1" stopColor="#be123c" /></linearGradient>
        <linearGradient id="candyWrap" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#fecdd3" /><stop offset="1" stopColor="#fda4af" /></linearGradient>
      </defs>
      <rect x="8" y="10" width="16" height="14" rx="2" fill="url(#candyWrap)" stroke="#e11d48" strokeWidth="0.8" />
      <rect x="10" y="12" width="12" height="10" rx="1" fill="url(#candyGrad)" />
      <circle cx="14" cy="17" r="2" fill="#fff" opacity="0.5" />
    </svg>
  ),
  sodium: (
    <svg className={iconCl} viewBox="0 0 32 32" fill="none" filter="url(#iconShadow7)">
      <defs>
        <filter id="iconShadow7" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.3" /></filter>
        <linearGradient id="saltGrad" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#e0f2fe" /><stop offset="0.5" stopColor="#7dd3fc" /><stop offset="1" stopColor="#0ea5e9" /></linearGradient>
        <linearGradient id="saltCap" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#f0f9ff" /><stop offset="1" stopColor="#bae6fd" /></linearGradient>
      </defs>
      <path fill="url(#saltGrad)" d="M12 8h8v16h-8V8z" stroke="#0284c7" strokeWidth="0.8" />
      <rect x="11" y="4" width="10" height="5" rx="1" fill="url(#saltCap)" stroke="#0ea5e9" strokeWidth="0.6" />
      <circle cx="14" cy="6" r="0.8" fill="#0c4a6e" />
      <circle cx="18" cy="6" r="0.8" fill="#0c4a6e" />
    </svg>
  ),
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

/** "Launching soon" badge with exciting popover content */
function LaunchSoonBadge() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-200/80 to-violet-300/70 text-violet-800 text-xs font-bold hover:from-violet-300/90 hover:to-violet-400/80 transition-all border border-violet-200/60 shadow-sm"
      >
        Launching soon 🚀
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full mt-2 z-[9999] w-80 rounded-2xl border-2 border-violet-200/60 bg-white/95 backdrop-blur-md shadow-xl shadow-violet-300/40 p-5 text-left">
            <p className="text-base font-bold text-violet-900">Something exciting is almost here.</p>
            <p className="text-sm text-violet-700 mt-2 leading-relaxed">
              We're launching NutriMedAI very soon — your everyday health navigator. AI-powered nutrition, personalized insights, and food analysis that actually gets you.
            </p>
            <p className="text-sm font-semibold text-violet-800 mt-3">
              Smarter nutrition. Made personal. Don't miss it — get ready. 🚀
            </p>
            <button type="button" onClick={() => setOpen(false)} className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-900">
              Close
            </button>
          </div>
        </>
      )}
    </div>
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

const PREVIEW_MAX_SIZE = 480
const PREVIEW_JPEG_QUALITY = 0.72

/** Compressed data URL for storage (avoids mobile crash from huge base64). */
function toCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        let w = img.width
        let h = img.height
        if (w > PREVIEW_MAX_SIZE || h > PREVIEW_MAX_SIZE) {
          if (w > h) {
            h = Math.round((h * PREVIEW_MAX_SIZE) / w)
            w = PREVIEW_MAX_SIZE
          } else {
            w = Math.round((w * PREVIEW_MAX_SIZE) / h)
            h = PREVIEW_MAX_SIZE
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          toDataUrl(file).then(resolve).catch(reject)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', PREVIEW_JPEG_QUALITY)
        resolve(dataUrl)
      } catch (e) {
        toDataUrl(file).then(resolve).catch(reject)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      toDataUrl(file).then(resolve).catch(reject)
    }
    img.src = url
  })
}

function stripMarkdown(text: string): string {
  if (text == null || typeof text !== 'string') return ''
  try {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .trim()
  } catch {
    return String(text).trim()
  }
}

function extractOneLine(text: string, label: string): string | null {
  if (text == null || typeof text !== 'string') return null
  try {
    const re = new RegExp(`${label}\\s*:?\\s*\\n?\\s*([^\\n]+)`, 'i')
    const m = stripMarkdown(text).match(re)
    return m?.[1]?.trim() || null
  } catch {
    return null
  }
}

function extractBlock(text: string, startLabel: string, endLabels: string[]): string | null {
  if (text == null || typeof text !== 'string') return null
  try {
    const cleaned = stripMarkdown(text)
    const endPart = endLabels.length > 0 ? `(?=\\n\\s*(?:${endLabels.join('|')})\\s*:?|$)` : '$'
    const re = new RegExp(`${startLabel}\\s*:?\\s*\\n?\\s*([\\s\\S]*?)${endPart}`, 'i')
    const m = cleaned.match(re)
    return m?.[1]?.trim() || null
  } catch {
    return null
  }
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
  if (text == null || typeof text !== 'string') return null
  try {
    const outOf100 = text.match(/(?:nutrition\s*score|NUTRITION\s*SCORE)[:\s]*(\d{1,3})\s*\/\s*100/i)
    if (outOf100) return Math.min(100, Math.max(0, parseInt(outOf100[1], 10)))
    const simple100 = text.match(/\b(\d{1,3})\s*\/\s*100\b/)
    if (simple100) return Math.min(100, Math.max(0, parseInt(simple100[1], 10)))
    const outOf10 = text.match(/(?:health\s*score|score)[:\s]*(\d{1,2})\s*\/\s*10\b/i)
    if (outOf10) return Math.min(100, Math.max(0, Math.round((parseInt(outOf10[1], 10) / 10) * 100)))
    return null
  } catch {
    return null
  }
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
  const SHOW_REGISTER_TAB = true // set false to hide Register tab again
  const [tab, setTab] = useState<'login' | 'register'>(SHOW_REGISTER_TAB ? defaultTab : 'login')
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
        {SHOW_REGISTER_TAB && (
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
        )}
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
  const steps = [
    { n: 1, title: 'Set your profile', desc: 'Add your current medical condition (e.g. diabetes, hypertension) and any conditions you want to monitor.' },
    { n: 2, title: 'Upload a photo', desc: 'Snap or upload a picture of your meal. Add an optional note like portion size or preparation.' },
    { n: 3, title: 'Get tailored insights', desc: 'Receive a nutrition score, summary, key metrics, and condition-specific advice in seconds.' },
  ]
  const features = [
    { title: 'Nutrition score', desc: 'A clear 0–100 score so you know at a glance how the meal fits your goals.' },
    { title: 'Condition-aware advice', desc: 'Recommendations for your current condition and for conditions you’re monitoring.' },
    { title: 'TL;DR by ingredient', desc: 'Quick takeaways per ingredient so you know what to watch or enjoy.' },
    { title: 'Similar but safer', desc: 'Suggestions for swaps or tweaks to make the meal better for you.' },
    { title: 'Downloadable report', desc: 'Export your analysis as a PDF to share with your care team or keep for later.' },
  ]
  const forYou = [
    'Managing diabetes, hypertension, heart health, or other diet-sensitive conditions',
    'Watching sodium, sugar, carbs, or calories with clear numbers and guidance',
    'Exploring healthier swaps without giving up the foods you love',
    'Keeping a simple record of what you eat and how it fits your profile',
  ]
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
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
            <LaunchSoonBadge />
            <span className="text-violet-900">About</span>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onLogin} className="px-4 py-2 rounded-full text-sm font-semibold text-violet-600 hover:text-violet-900 transition-colors">Login</button>
            <button type="button" onClick={onRegister} className="px-4 py-2 rounded-full text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors">Get Started</button>
            <button
              type="button"
              onClick={() => setMobileNavOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-violet-700 hover:bg-violet-100/80 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{mobileNavOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg>
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="md:hidden border-t border-violet-200/50 bg-[#f5f3ff]/98 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
            <button type="button" onClick={() => { onBack(); setMobileNavOpen(false) }} className="text-left py-2.5 px-3 rounded-lg text-sm font-medium text-violet-600 hover:text-violet-900 hover:bg-violet-100/60 transition-colors">Home</button>
            <div className="py-2.5 px-3" onClick={() => setMobileNavOpen(false)}><LaunchSoonBadge /></div>
            <span className="py-2.5 px-3 text-sm font-medium text-violet-900">About</span>
          </div>
        )}
      </header>
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-violet-900">About NutriMedAI</h1>
          <p className="mt-4 text-lg text-violet-600 max-w-2xl mx-auto">
            Personalized nutrition analysis powered by AI. We analyze your food against your health profile so you can eat with confidence.
          </p>
          <p className="mt-2 text-sm text-violet-500 max-w-xl mx-auto">
            Not just calories — condition-aware guidance, key metrics, and actionable advice in one place.
          </p>
        </div>

        <section className="rounded-2xl border border-violet-200/50 bg-white/60 backdrop-blur-xl p-6 md:p-8 mb-8 shadow-lg shadow-violet-200/20">
          <h2 className="text-xl font-semibold text-violet-800 mb-1">How it works</h2>
          <p className="text-sm text-violet-600 mb-6">Three steps from profile to personalized insights.</p>
          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-4 rounded-xl bg-violet-50/60 border border-violet-200/50 p-4">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-500 text-white font-bold text-sm flex items-center justify-center">{s.n}</span>
                <div>
                  <h3 className="font-semibold text-violet-900">{s.title}</h3>
                  <p className="text-sm text-violet-600 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-violet-200/50 bg-white/60 backdrop-blur-xl p-6 md:p-8 mb-8 shadow-lg shadow-violet-200/20">
          <h2 className="text-xl font-semibold text-violet-800 mb-1">What you get</h2>
          <p className="text-sm text-violet-600 mb-6">Every analysis includes:</p>
          <ul className="grid md:grid-cols-2 gap-3">
            {features.map((f) => (
              <li key={f.title} className="flex gap-3 rounded-lg bg-violet-50/50 border border-violet-200/40 p-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-200/60 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </span>
                <div>
                  <h3 className="font-semibold text-violet-900 text-sm">{f.title}</h3>
                  <p className="text-xs text-violet-600 mt-0.5">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-violet-200/50 bg-white/60 backdrop-blur-xl p-6 md:p-8 mb-8 shadow-lg shadow-violet-200/20">
          <h2 className="text-xl font-semibold text-violet-800 mb-1">Who it's for</h2>
          <p className="text-sm text-violet-600 mb-4">NutriMedAI helps when you’re:</p>
          <ul className="space-y-2">
            {forYou.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-violet-700">
                <span className="text-violet-400 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-violet-200/50 bg-violet-50/60 p-6 mb-10 text-center">
          <p className="text-sm text-violet-700">
            Built with AI to support your choices. NutriMedAI is for guidance only and is not a substitute for professional medical or dietary advice.
          </p>
        </section>

        <div className="text-center">
          <button type="button" onClick={onRegister} className="px-6 py-3 rounded-full bg-violet-500 text-white font-semibold hover:bg-violet-600 transition-colors shadow-lg shadow-violet-200/30">
            Get started free
          </button>
        </div>
      </main>
    </div>
  )
}

// Hero: first slide = someone photographing food to analyze; others = food variety
const HERO_IMAGES = [
  'https://images.pexels.com/photos/4910312/pexels-photo-4910312.jpeg?auto=compress&cs=tinysrgb&w=2000&q=80',
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
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
            <LaunchSoonBadge />
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onLogin} className="px-4 py-2 rounded-full text-sm font-semibold text-violet-600 hover:text-violet-900 transition-colors">Login</button>
            <button type="button" onClick={onRegister} className="px-4 py-2 rounded-full text-sm font-semibold bg-violet-500 text-white hover:bg-violet-600 transition-colors">Get Started</button>
            <button
              type="button"
              onClick={() => setMobileNavOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-violet-700 hover:bg-violet-100/80 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{mobileNavOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg>
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="md:hidden border-t border-violet-200/50 bg-[#f5f3ff]/98 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
            <button type="button" className="text-left py-2.5 px-3 rounded-lg text-sm font-medium text-violet-600 hover:text-violet-900 hover:bg-violet-100/60 transition-colors">Home</button>
            <button type="button" onClick={() => { onAboutClick(); setMobileNavOpen(false) }} className="text-left py-2.5 px-3 rounded-lg text-sm font-medium text-violet-600 hover:text-violet-900 hover:bg-violet-100/60 transition-colors">About</button>
            <div className="py-2.5 px-3" onClick={() => setMobileNavOpen(false)}><LaunchSoonBadge /></div>
          </div>
        )}
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
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight text-white drop-shadow-md" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}>Take control of your health</h1>
          <p className="mt-4 text-lg text-white font-medium" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.5)' }}>Smarter nutrition. Made personal.</p>
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
          <h2 className="text-3xl md:text-4xl font-semibold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}>Your everyday health navigator.</h2>
          <p className="mt-4 text-white font-medium" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.5)' }}>
            Built to meet your body and brain where they are. Then helps you level up.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3 text-left">
            {[
              { title: 'Condition‑aware guidance', text: 'Recommendations tailored to current and monitored conditions.' },
              { title: 'Macro + micro breakdowns', text: 'Calories, protein, carbs, fat, fiber, sugar, sodium, vitamins.' },
              { title: 'Smart alternatives', text: 'Safer swaps and portion guidance for your goals.' },
            ].map((tile, idx) => (
              <div key={tile.title} className="rounded-2xl border border-violet-200/50 bg-white/70 backdrop-blur-sm p-6 shadow-lg shadow-violet-200/20">
                <div className="text-violet-600 font-semibold text-lg">{idx + 1}</div>
                <div className="mt-2 text-violet-900 font-semibold">{tile.title}</div>
                <div className="mt-2 text-violet-900 text-sm">{tile.text}</div>
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
  const { user, token, loading: authLoading, login, register, logout, error: authError, clearError: clearAuthError } = useAuth()
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
  const [conditionTab, setConditionTab] = useState<'current' | 'concerned'>('current')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  const ANALYSIS_LOADING_MESSAGES = [
    "Asking the food what it's made of...",
    "Counting calories (we're judging just a little)...",
    "Consulting the nutrition council...",
    "Your meal is in the hot seat...",
    "Almost there... your plate is blushing.",
    "Decoding those delicious secrets...",
    "Running it past the health police...",
    "One sec — checking if it's too good to be true...",
    "The AI is drooling over your photo...",
    "Turning pixels into advice...",
  ]

  useEffect(() => {
    if (!loadingAnalysis) return
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % ANALYSIS_LOADING_MESSAGES.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [loadingAnalysis])

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

  const fetchAnalysesFromServer = useCallback(async () => {
    if (!user || !token) return
    try {
      const res = await fetch(`${API_BASE}/analyses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const list = await res.json()
        const entries: AnalysisEntry[] = (Array.isArray(list) ? list : []).map((r: { id: string; date: string; analysis: string; preview?: string; currentConditions?: string; concernedConditions?: string; userDescription?: string }) => ({
          id: r.id,
          date: r.date,
          currentConditions: r.currentConditions ?? '',
          concernedConditions: r.concernedConditions ?? '',
          userDescription: r.userDescription ?? '',
          analysis: r.analysis,
          preview: r.preview ?? undefined,
        }))
        setAnalysesList(entries)
      }
    } catch {
      /* keep current list */
    }
  }, [user, token])

  useEffect(() => {
    if (!user) return
    const loadAnalyses = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_BASE}/analyses`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const list = await res.json()
            const entries: AnalysisEntry[] = (Array.isArray(list) ? list : []).map((r: { id: string; date: string; analysis: string; preview?: string; currentConditions?: string; concernedConditions?: string; userDescription?: string }) => ({
              id: r.id,
              date: r.date,
              currentConditions: r.currentConditions ?? '',
              concernedConditions: r.concernedConditions ?? '',
              userDescription: r.userDescription ?? '',
              analysis: r.analysis,
              preview: r.preview ?? undefined,
            }))
            setAnalysesList(entries)
            return
          }
        } catch {
          /* fall back to localStorage */
        }
      }
      try {
        const raw = localStorage.getItem(analysesStorageKey(user.id))
        const parsed = raw ? (JSON.parse(raw) as AnalysisEntry[]) : []
        setAnalysesList(Array.isArray(parsed) ? parsed : [])
      } catch {
        setAnalysesList([])
      }
    }
    loadAnalyses()
  }, [user, token])

  useEffect(() => {
    if (!user || !token) return
    const onFocus = () => fetchAnalysesFromServer()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user, token, fetchAnalysesFromServer])

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

  const deleteHistoryEntry = (e: React.MouseEvent, entry: AnalysisEntry) => {
    e.stopPropagation()
    if (token) {
      fetch(`${API_BASE}/analyses/${encodeURIComponent(entry.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
    setAnalysesList((prev) => prev.filter((x) => x.id !== entry.id))
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
      const persistentPreview = await toCompressedDataUrl(file)
      setAnalysis(nextAnalysis)
      setPreview(persistentPreview)
      const now = new Date().toISOString()
      const tempId = `temp_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
      const entry: AnalysisEntry = {
        id: tempId,
        date: now,
        currentConditions: currentConditionsStr,
        concernedConditions: concernedConditionsStr,
        userDescription: userDescription.trim(),
        analysis: nextAnalysis,
        preview: persistentPreview,
      }
      setAnalysesList((prev) => [entry, ...prev].slice(0, 50))

      if (token) {
        const dishNameForApi = extractOneLine(nextAnalysis, 'DISH') || 'Food'
        try {
          const createRes = await fetch(`${API_BASE}/analyses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              dish_name: dishNameForApi,
              analysis: nextAnalysis,
              preview: persistentPreview,
              current_conditions: currentConditionsStr,
              concerned_conditions: concernedConditionsStr,
              user_description: userDescription.trim(),
            }),
          })
          if (createRes.ok) {
            const created = await createRes.json()
            setAnalysesList((prev) =>
              prev.map((e) =>
                e.id === tempId
                  ? {
                      id: created.id,
                      date: created.date,
                      currentConditions: created.currentConditions ?? currentConditionsStr,
                      concernedConditions: created.concernedConditions ?? concernedConditionsStr,
                      userDescription: created.userDescription ?? userDescription.trim(),
                      analysis: created.analysis,
                      preview: created.preview ?? persistentPreview,
                    }
                  : e
              )
            )
          }
        } catch {
          /* keep local entry with temp id; it's already in the list */
        }
      }
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

  useEffect(() => {
    if (analysis && !currentSummary && concernedSummary) setConditionTab('concerned')
  }, [analysis, currentSummary, concernedSummary])

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
        <div className="p-3 border-b border-violet-200/50 flex gap-2">
          <button
            type="button"
            onClick={startNewAnalysis}
            className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-violet-500 text-white hover:bg-violet-600"
          >
            New analysis
          </button>
          {token && (
            <button
              type="button"
              onClick={() => fetchAnalysesFromServer()}
              className="p-2.5 rounded-lg text-violet-600 hover:bg-violet-100 border border-violet-200/60 flex-shrink-0"
              title="Sync from other devices"
              aria-label="Sync history"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          )}
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
              <div
                key={entry.id}
                className="flex items-stretch gap-1 rounded-lg border border-violet-200/50 bg-white/40 hover:bg-violet-50/80 transition-colors overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => loadHistoryEntry(entry)}
                  className="flex-1 min-w-0 text-left px-2 py-2 text-violet-900"
                >
                  <div className="text-xs mb-1 text-violet-600">
                    {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-sm font-medium truncate">{extractOneLine(entry.analysis, 'DISH') || 'Food analysis'}</div>
                  <div className="text-xs truncate text-violet-600">{entry.currentConditions || 'No condition'} · {entry.concernedConditions || '—'}</div>
                </button>
                <button
                  type="button"
                  onClick={(e) => deleteHistoryEntry(e, entry)}
                  className="p-2 text-violet-500 hover:text-red-600 hover:bg-red-50/80 flex-shrink-0"
                  aria-label="Delete this entry"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Mobile history drawer */}
      {mobileSidebarOpen && (
        <>
          <div className="fixed inset-0 z-[10000] bg-black/40 md:hidden" aria-hidden onClick={() => setMobileSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 bottom-0 z-[10001] w-[min(320px,85vw)] flex flex-col border-r border-violet-200/50 bg-[#f5f3ff] shadow-xl md:hidden">
            <div className="p-3 border-b border-violet-200/50 flex items-center justify-between">
              <span className="text-sm font-semibold text-violet-900">Recent history</span>
              <button type="button" onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-lg text-violet-600 hover:bg-violet-100" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-3 border-b border-violet-200/50 flex gap-2">
              <button
                type="button"
                onClick={() => { startNewAnalysis(); setMobileSidebarOpen(false) }}
                className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-violet-500 text-white hover:bg-violet-600"
              >
                New analysis
              </button>
              {token && (
                <button
                  type="button"
                  onClick={() => fetchAnalysesFromServer()}
                  className="p-2.5 rounded-lg text-violet-600 hover:bg-violet-100 border border-violet-200/60 flex-shrink-0"
                  title="Sync from other devices"
                  aria-label="Sync history"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              )}
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
                  <div
                    key={entry.id}
                    className="flex items-stretch gap-1 rounded-lg border border-violet-200/50 bg-white/40 hover:bg-violet-50/80 transition-colors overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => { loadHistoryEntry(entry); setMobileSidebarOpen(false) }}
                      className="flex-1 min-w-0 text-left px-2 py-2 text-violet-900"
                    >
                      <div className="text-xs mb-1 text-violet-600">
                        {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-sm font-medium truncate">{extractOneLine(entry.analysis, 'DISH') || 'Food analysis'}</div>
                      <div className="text-xs truncate text-violet-600">{entry.currentConditions || 'No condition'} · {entry.concernedConditions || '—'}</div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => deleteHistoryEntry(e, entry)}
                      className="p-2 text-violet-500 hover:text-red-600 hover:bg-red-50/80 flex-shrink-0"
                      aria-label="Delete this entry"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-[9999] border-b border-violet-200/50 bg-[#f5f3ff]/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 min-h-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 -ml-1 rounded-lg text-violet-700 hover:bg-violet-100/80 transition-colors"
                aria-label="Open history"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
              <Logo className="h-9 w-9" />
              <h1 className="text-lg font-semibold text-violet-900 truncate">NutriMedAI</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-sm truncate max-w-[140px] sm:max-w-[200px] text-violet-700" title={user.email}>{user.email}</span>
              <button type="button" onClick={logout} className="flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-100 border border-violet-200/60">
                Log out
              </button>
              {analysis && (
                <button type="button" onClick={downloadPDF} className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-sm font-medium bg-violet-500 text-white hover:bg-violet-600" title="Download PDF">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className={`max-w-7xl mx-auto px-4 md:px-8 w-full ${isLightResultView ? 'bg-[#f5f3ff] py-4 space-y-4' : 'py-8 space-y-6'}`}>
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

            {loadingAnalysis && (
              <div className="mb-6 rounded-2xl border-2 border-violet-200/70 bg-white/80 backdrop-blur-xl p-6 md:p-8 shadow-lg shadow-violet-200/25">
                <div className="flex flex-col items-center text-center max-w-md mx-auto">
                  <span className="analysis-loading-emoji text-4xl mb-4" role="img" aria-hidden>🍳</span>
                  <p className="text-violet-900 font-medium mb-1">
                    {ANALYSIS_LOADING_MESSAGES[loadingMessageIndex]}
                  </p>
                  <div className="flex gap-1 mb-4">
                    <span className="analysis-loading-dot w-2 h-2 rounded-full bg-violet-400" />
                    <span className="analysis-loading-dot w-2 h-2 rounded-full bg-violet-500" />
                    <span className="analysis-loading-dot w-2 h-2 rounded-full bg-violet-600" />
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-violet-100 overflow-hidden">
                    <div className="analysis-loading-bar h-full rounded-full bg-gradient-to-r from-violet-400 via-violet-500 to-violet-600" />
                  </div>
                  <p className="mt-3 text-xs text-violet-500">Grab a sip of water. We’re almost there.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <label className={`flex flex-col items-center justify-center w-full min-h-[280px] rounded-lg border border-violet-200/60 bg-white/40 cursor-pointer overflow-hidden transition-colors hover:bg-violet-50/60 ${loadingAnalysis ? 'opacity-60 pointer-events-none' : ''}`}>
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
            <div className="flex flex-col lg:flex-row gap-4 w-full">
              {/* Left: IDENTIFIED FOOD — compact */}
              <div className="w-full lg:w-[260px] lg:flex-shrink-0 lg:min-w-[260px]">
                <div className="bg-white/80 backdrop-blur rounded-xl border border-violet-200/60 shadow-sm overflow-hidden">
                  <div className="bg-violet-50/80 border-b border-violet-200/60 px-3 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-800">Identified food</span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-base font-bold text-violet-900 truncate">{dishName || 'Food item'}</h3>
                    <div className="mt-2 flex justify-center">
                      {preview ? (
                        <img src={preview} alt={dishName || 'Uploaded food'} className="w-28 h-28 rounded-full object-cover border-2 border-violet-100 shadow-inner" />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-violet-50 border-2 border-violet-200 flex items-center justify-center text-violet-600 text-xs">No image</div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-medium text-violet-800 mb-1">Nutrition score</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-violet-100 overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500 transition-all animate-progress" style={{ width: `${nutritionScore != null ? Math.min(100, Math.max(0, nutritionScore)) : 0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-violet-900 tabular-nums flex-shrink-0">{nutritionScore != null ? `${nutritionScore}/100` : '—/100'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Insights — dense layout to minimize scroll */}
              <div className="flex-1 min-w-0">
                <div className="bg-white/80 backdrop-blur rounded-xl border border-violet-200/60 shadow-sm p-4">
                  <h3 className="text-lg font-semibold text-violet-900 mb-1">Nutrition summary</h3>
                  {(() => {
                    const summary = foodSummary || 'Analysis generated successfully.'
                    const isErrorLike = /sorry|can't help|error|unable/i.test(summary)
                    return (
                      <p className={`text-sm leading-snug mb-2 ${isErrorLike ? 'rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 px-3 py-2' : 'text-violet-800'}`}>
                        {summary}
                      </p>
                    )
                  })()}

                  {metrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-2">
                      {metrics.map((m) => {
                        const key = metricKey(m.label)
                        return (
                          <div key={`${m.label}_${m.value}`} className={`metric-${key} metric-card-hover rounded-lg p-2 flex items-center gap-2 border border-violet-200/50`}>
                            <span className="text-violet-700 flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4">{METRIC_ICONS[key] || METRIC_ICONS.calories}</span>
                            <div className="min-w-0">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">{m.label}</div>
                              <div className="text-xs font-bold text-violet-900 truncate">{m.value || '—'}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {currentConditionsList.filter((c) => c && c !== 'None / No current conditions').map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500 text-white">{c}</span>
                    ))}
                    {concernedConditionsList.filter(Boolean).map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-900 border border-purple-200">Concern: {c}</span>
                    ))}
                    {categoryChips.length > 0 && categoryChips.map((chip) => (
                      <span key={chip} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-800 border border-violet-200">{chip}</span>
                    ))}
                  </div>

                  {(currentSummary || concernedSummary) && (
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-violet-100/60 border border-violet-200/50 mb-2">
                      {currentSummary && (
                        <button
                          type="button"
                          onClick={() => setConditionTab('current')}
                          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors ${conditionTab === 'current' ? 'bg-violet-500 text-white shadow-sm' : 'text-violet-700 hover:bg-violet-200/60'}`}
                        >
                          Current condition
                        </button>
                      )}
                      {concernedSummary && (
                        <button
                          type="button"
                          onClick={() => setConditionTab('concerned')}
                          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors ${conditionTab === 'concerned' ? 'bg-violet-500 text-white shadow-sm' : 'text-violet-700 hover:bg-violet-200/60'}`}
                        >
                          Concerned condition
                        </button>
                      )}
                    </div>
                  )}

                  {currentSummary && conditionTab === 'current' && (() => {
                    const parsed = parseInfographyBlock(currentSummary)
                    return (
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 rounded-t-lg bg-violet-50/80 border border-violet-200/60 border-b-0 px-3 py-2">
                          <svg className="w-4 h-4 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <span className="text-xs font-bold uppercase tracking-wide text-violet-900">Current condition</span>
                        </div>
                        <div className="rounded-b-lg border border-t-0 border-violet-200/60 bg-white/80 p-3">
                          <div className="text-[10px] font-semibold text-violet-700 mb-1">{parsed.adviceLines.length} points</div>
                          {parsed.foodLines.length > 0 && (
                            <>
                              <div className="rounded-md bg-violet-50/60 border border-violet-100 px-2.5 py-1.5 mb-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-violet-700 mb-1">TL;DR</div>
                                <ul className="space-y-0.5">
                                  {parsed.foodLines.map((line, i) => {
                                    const split = splitIngredientLine(line)
                                    return (
                                      <li key={i} className="text-xs flex flex-wrap gap-1">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {parsed.adviceLines.map((item, i) => {
                              const tag = (item.tag || '').toLowerCase()
                              const bg = tag.includes('important') ? 'bg-red-100 border-red-200' : tag.includes('reasoning') ? 'bg-orange-100 border-orange-200' : tag.includes('action') ? 'bg-blue-100 border-blue-200' : tag.includes('benefit') ? 'bg-emerald-100 border-emerald-200' : tag.includes('ask your doctor') ? 'bg-purple-100 border-purple-200' : 'bg-gray-100 border-gray-200'
                              const icon = tag.includes('important') ? (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>) : tag.includes('reasoning') ? (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>) : tag.includes('action') ? (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>) : tag.includes('benefit') ? (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>) : tag.includes('ask your doctor') ? (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>) : null
                              return (
                                <div key={i} className={`rounded-lg border p-2 flex gap-2 ${bg}`}>
                                  {icon}
                                  <div className="min-w-0">
                                    {item.tag && <div className="text-[10px] font-bold uppercase text-gray-600">{item.tag}</div>}
                                    <p className="text-xs text-gray-800 leading-snug">{item.text}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {concernedSummary && conditionTab === 'concerned' && (() => {
                    const parsed = parseInfographyBlock(concernedSummary)
                    return (
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 rounded-t-lg bg-purple-50/80 border border-purple-200/60 border-b-0 px-3 py-2">
                          <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          <span className="text-xs font-bold uppercase tracking-wide text-purple-900">Concerned condition</span>
                        </div>
                        <div className="rounded-b-lg border border-t-0 border-purple-200/60 bg-white/80 p-3">
                          <div className="text-[10px] font-semibold text-purple-700 mb-1">{parsed.adviceLines.length} points</div>
                          {parsed.foodLines.length > 0 && (
                            <>
                              <div className="rounded-md bg-purple-50/60 border border-purple-100 px-2.5 py-1.5 mb-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-1">TL;DR</div>
                                <ul className="space-y-0.5">
                                  {parsed.foodLines.map((line, i) => {
                                    const split = splitIngredientLine(line)
                                    return (
                                      <li key={i} className="text-xs flex flex-wrap gap-1">
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {parsed.adviceLines.map((item, i) => {
                              const tag = (item.tag || '').toLowerCase()
                              const bg = tag.includes('important') ? 'bg-red-100 border-red-200' : tag.includes('reasoning') ? 'bg-orange-100 border-orange-200' : tag.includes('action') ? 'bg-blue-100 border-blue-200' : tag.includes('benefit') ? 'bg-emerald-100 border-emerald-200' : tag.includes('ask your doctor') ? 'bg-purple-100 border-purple-200' : 'bg-gray-100 border-gray-200'
                              const icon = tag.includes('important') ? (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>) : tag.includes('reasoning') ? (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>) : tag.includes('action') ? (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>) : tag.includes('benefit') ? (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>) : tag.includes('ask your doctor') ? (<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>) : null
                              return (
                                <div key={i} className={`rounded-lg border p-2 flex gap-2 ${bg}`}>
                                  {icon}
                                  <div className="min-w-0">
                                    {item.tag && <div className="text-[10px] font-bold uppercase text-gray-600">{item.tag}</div>}
                                    <p className="text-xs text-gray-800 leading-snug">{item.text}</p>
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
                    <div className="mb-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wide text-violet-800 mb-1">Similar but safer</h4>
                      <ul className="space-y-0.5">
                        {alternativesList.map((line, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-xs text-violet-900">
                            <svg className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {additionalInfo && (
                    <div className="mb-2 rounded-lg border border-violet-200/60 bg-violet-50/60 p-2 flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-200 flex items-center justify-center text-violet-800 text-[10px] font-bold">i</span>
                      <p className="text-xs text-violet-900 leading-snug">{additionalInfo}</p>
                    </div>
                  )}

                  {!foodSummary && metrics.length === 0 && !currentSummary && !concernedSummary && (
                    <div className="rounded-lg border border-violet-200/60 bg-violet-50/60 p-3 text-violet-900 whitespace-pre-wrap leading-relaxed text-xs">{analysis}</div>
                  )}
                </div>

                <p className="text-[10px] text-violet-600 text-center mt-1">General dietary guidance; not a substitute for medical advice. When in doubt, discuss with your doctor.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
