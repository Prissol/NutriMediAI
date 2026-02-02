import { useState, useCallback } from 'react'
import { jsPDF } from 'jspdf'

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

const API_BASE = import.meta.env.DEV ? '/api' : 'http://localhost:8000'

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
    sections.push({ title: 'Current condition summary', body: stripMarkdown(currentBody) })
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

// Split section body into points; filter out section headers and extract health score
function bodyToPoints(body: string): { points: string[]; healthScoreLine: string | null } {
  const trimmed = body.trim()
  if (!trimmed) return { points: [], healthScoreLine: null }
  const byNewline = trimmed.split(/\n+/).map((s) => s.trim()).filter(Boolean)
  let lines = byNewline.length > 1 ? byNewline : trimmed.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  if (lines.length < 1) lines = [trimmed]

  const healthScoreMatch = lines.find((l) => /Health score\s*:\s*\d+\s*\/\s*10/i.test(l))
  const points = lines.filter(
    (line) =>
      !SECTION_HEADER_REG.test(line) &&
      !/^\s*---\s*$/.test(line) &&
      line !== healthScoreMatch
  )
  return { points, healthScoreLine: healthScoreMatch ?? null }
}

/* Step-style infographic colors (teal, orange, blue, brown, pink) */
const STEP_COLORS = [
  { bg: 'bg-teal-500', text: 'text-white', step: '01' },
  { bg: 'bg-orange-500', text: 'text-white', step: '02' },
  { bg: 'bg-blue-500', text: 'text-white', step: '03' },
  { bg: 'bg-amber-600', text: 'text-white', step: '04' },
  { bg: 'bg-pink-500', text: 'text-white', step: '05' },
  { bg: 'bg-teal-600', text: 'text-white', step: '06' },
  { bg: 'bg-orange-600', text: 'text-white', step: '07' },
  { bg: 'bg-blue-600', text: 'text-white', step: '08' },
  { bg: 'bg-amber-700', text: 'text-white', step: '09' },
]
/* No emojis – professional numbered steps only */

export default function App() {
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
      setAnalysis(data.analysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

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
      const { points } = bodyToPoints(sec.body)
      if (points.length > 0) {
        for (let i = 0; i < points.length; i++) {
          if (y > 268) y = pushPage()
          const [r, g, b] = stepColors[i % stepColors.length]
          const stepNum = String(i + 1).padStart(2, '0')
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
          const stepLines = doc.splitTextToSize(points[i], textW)
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
  const dishName = analysis ? parseDishName(analysis) : null
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

  return (
    <div className="min-h-screen text-slate-800">
      {/* Liquid Glass header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="" className="h-9 w-9 object-contain" aria-hidden />
            <h1 className="text-lg font-semibold text-slate-800 tracking-tight">NutriMedAI</h1>
          </div>
          <div className="flex items-center gap-2">
            {analysis && (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white/60 border border-slate-200/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Download PDF
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Input card – professional layout */}
        <section className="card p-6 md:p-8">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">
            Medical profile
          </h2>

          <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Current conditions */}
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current conditions</label>
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

            {/* Conditions to monitor */}
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Conditions to monitor</label>
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
                  <img src={preview} alt="Upload" className="w-full h-full min-h-[280px] max-h-[400px] object-cover" />
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
        {analysis && preview && (
          <section className="card overflow-hidden animate-fade-in">
            <div className="grid md:grid-cols-[320px_1fr] gap-0">
              {/* Left: identified dish + image + Nutrition Score – glass */}
              <div className="p-5 bg-white/40 border-r border-slate-200/60">
                {dishName && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-teal-50 border border-teal-200">
                    <p className="text-xs font-medium text-teal-700 uppercase tracking-wide">Identified food</p>
                    <p className="text-sm font-semibold text-slate-800 mt-0.5">{dishName}</p>
                  </div>
                )}
                <img
                  src={preview}
                  alt={dishName || 'Uploaded dish'}
                  className="w-full max-h-[200px] object-cover object-center rounded-xl mb-4 shadow-md"
                />
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
              <div className="p-5 md:p-6 flex flex-col max-h-[70vh] min-h-0">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex-shrink-0">Nutrition summary</h3>

                <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
                  {/* Colorful nutrition overview cards – animated */}
                  {metricCards.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      {metricCards.map((m, idx) => (
                        <div
                          key={m.key}
                          className={`rounded-xl border p-3 metric-card-hover animate-scale-in ${m.className}`}
                          style={{ animationDelay: `${idx * 50}ms`, opacity: 0 }}
                        >
                          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                            {m.label}
                          </div>
                          <div className="text-sm font-semibold text-slate-800 mt-0.5">
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

                  {/* Petal-style infographic (hub + petals, scrollable) */}
                  {sections.map((sec, secIdx) => {
                    const { points, healthScoreLine } = bodyToPoints(sec.body)
                    const stepColors = STEP_COLORS
                    const sectionScore = healthScoreLine ? parseScore(healthScoreLine) : null
                    const isCurrent = sec.title.toLowerCase().includes('current')
                    return (
                      <div key={sec.title} className="infographic-block animate-fade-in-up" style={{ animationDelay: `${secIdx * 80}ms`, opacity: 0 }}>
                        {/* Central hub – title, optional score bar, point count */}
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
                        {points.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {points.map((point, i) => {
                              const step = stepColors[i % stepColors.length]
                              const stepNum = String(i + 1).padStart(2, '0')
                              return (
                                <div
                                  key={i}
                                  className={`petal-card rounded-2xl ${step.bg} ${step.text} p-4 shadow-md animate-fade-in-up hover:shadow-lg transition-shadow flex flex-col min-h-0`}
                                  style={{ animationDelay: `${100 + secIdx * 80 + i * 60}ms`, opacity: 0 }}
                                >
                                  <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                                    <span className="text-lg font-bold leading-none">{stepNum}</span>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest opacity-90">Step</span>
                                  </div>
                                  <p className="text-sm leading-relaxed opacity-95 flex-1 min-h-0">
                                    {point}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 pl-3 border-l-2 border-slate-200 animate-fade-in">
                            {sec.body}
                          </p>
                        )}
                      </div>
                    )
                  })}
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
  )
}
