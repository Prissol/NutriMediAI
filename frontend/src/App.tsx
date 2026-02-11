import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const API_BASE = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '/api') : '/api'

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
    <div className="min-h-screen flex items-center justify-center bg-[#0f2f34] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#123740] p-6 shadow-xl">
        <button type="button" onClick={onBack} className="text-xs text-white/60 hover:text-white mb-4">
          ← Back to home
        </button>
        <div className="flex items-center gap-3 mb-6">
          <img src="/logo.svg" alt="" className="h-10 w-10" />
          <h1 className="text-xl font-semibold text-white">NutriMedAI</h1>
        </div>
        <p className="text-sm text-white/70 mb-4">Sign in to your dashboard.</p>
        <div className="flex rounded-lg bg-white/10 p-1 mb-4">
          <button
            type="button"
            onClick={() => { setTab('login'); onClearError(); setPassword('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'login' ? 'bg-emerald-500 text-[#0f2f34]' : 'text-white/70 hover:text-white'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); onClearError(); setPassword('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'register' ? 'bg-emerald-500 text-[#0f2f34]' : 'text-white/70 hover:text-white'}`}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-white/80 mb-1">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-white/80 mb-1">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={tab === 'register' ? 6 : 1}
              className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder={tab === 'register' ? 'Min 6 characters' : ''}
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-emerald-500 text-[#0f2f34] font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
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
    <div className="min-h-screen bg-[#0f2f34] text-white">
      <header className="sticky top-0 z-[9999] bg-[#0f2f34]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-9 w-9" />
            <span className="font-semibold text-lg">NutriMedAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <button type="button" onClick={onBack} className="hover:text-white transition-colors">Home</button>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold">Coming Soon</span>
            <span className="text-white">About</span>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onLogin} className="px-4 py-2 rounded-full text-sm font-semibold text-white/80 hover:text-white transition-colors">Login</button>
            <button type="button" onClick={onRegister} className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500 text-[#0f2f34] hover:bg-emerald-400 transition-colors">Get Started</button>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">About NutriMedAI</h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
            Personalized nutrition analysis powered by AI. We analyze your food against your health profile.
          </p>
        </div>
        <section className="rounded-2xl bg-[#123740] border border-white/10 p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-semibold text-emerald-200 mb-4">How it works</h2>
          <p className="text-white/80 leading-relaxed mb-6">
            You set two types of conditions in your profile: <strong className="text-white">Current medical condition</strong> (e.g. diabetes, hypertension) and <strong className="text-white">Conditions to monitor</strong>. You upload a photo of your food; our AI gives tailored analysis for both.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-lg font-semibold text-white mb-2">Current medical condition</h3>
              <p className="text-sm text-white/70">How safe and suitable this meal is for your current health.</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-lg font-semibold text-white mb-2">Conditions to monitor</h3>
              <p className="text-sm text-white/70">Advice for conditions you&apos;re watching or at risk for.</p>
            </div>
          </div>
        </section>
        <div className="text-center pt-4">
          <button type="button" onClick={onRegister} className="px-6 py-3 rounded-full bg-emerald-500 text-[#0f2f34] font-semibold hover:bg-emerald-400">
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
    <div className="min-h-screen bg-[#0f2f34] text-white">
      <header className="sticky top-0 z-[9999] bg-[#0f2f34]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-9 w-9" />
            <span className="font-semibold text-lg">NutriMedAI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <button type="button" className="hover:text-white transition-colors">Home</button>
            <button type="button" onClick={onAboutClick} className="hover:text-white transition-colors">About</button>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold">Coming Soon</span>
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onLogin} className="px-4 py-2 rounded-full text-sm font-semibold text-white/80 hover:text-white transition-colors">Login</button>
            <button type="button" onClick={onRegister} className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500 text-[#0f2f34] hover:bg-emerald-400 transition-colors">Get Started</button>
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
          style={{ background: 'linear-gradient(0deg, rgba(15,47,52,0.72) 0%, rgba(15,47,52,0.4) 50%, rgba(15,47,52,0.35) 100%)' }}
        />
        <div className="relative z-20 max-w-6xl mx-auto px-4 md:px-8 py-20 text-center w-full">
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight">Take control of your health</h1>
          <p className="mt-4 text-lg text-white/80">Smarter nutrition. Made personal.</p>
          <button
            type="button"
            onClick={onRegister}
            className="mt-8 px-6 py-3 rounded-full bg-emerald-500 text-[#0f2f34] font-semibold hover:bg-emerald-400"
          >
            Get started free
          </button>
          <div className="flex justify-center gap-2 mt-10">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setHeroSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === heroSlide ? 'w-6 bg-emerald-400' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">
            We focus on what fuels you. <br /> Not just the calories.
          </h2>
          <p className="mt-4 text-white/70">
            We turn everyday food decisions into clear, personalized guidance.
          </p>
          <p className="mt-4 text-white/60 text-sm">
            Backed by science. Powered by AI. Built for you.
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { title: 'Track your nutrition to optimize your health.', body: 'All macros + micros, in one clear snapshot.' },
              { title: 'Snap and go. AI does the rest.', body: 'Real-time photo analysis with clinical context.' },
              { title: 'See measurable progress that sticks.', body: 'Daily insights that move your goals forward.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white/10 border border-white/10 p-6 text-left">
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="text-sm text-white/70 mt-2">{item.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#123740] border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h3 className="text-2xl font-semibold">As Featured In</h3>
          <p className="text-white/70 text-sm mt-2">
            Leading publications recognize NutriMedAI&apos;s AI‑powered nutrition guidance.
          </p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4 text-white/70">
            {['The Times', 'Google', 'House of Lords', 'Healthline', 'Lifehacker'].map((logo) => (
              <div key={logo} className="rounded-xl border border-white/10 bg-white/5 py-3">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative py-16"
        style={{
          backgroundImage: "linear-gradient(0deg, rgba(15,47,52,0.75), rgba(15,47,52,0.75)), url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=2000&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">Your everyday health navigator.</h2>
          <p className="mt-4 text-white/70">
            Built to meet your body and brain where they are. Then helps you level up.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3 text-left">
            {[
              { title: 'Condition‑aware guidance', text: 'Recommendations tailored to current and monitored conditions.' },
              { title: 'Macro + micro breakdowns', text: 'Calories, protein, carbs, fat, fiber, sugar, sodium, vitamins.' },
              { title: 'Smart alternatives', text: 'Safer swaps and portion guidance for your goals.' },
            ].map((tile, idx) => (
              <div key={tile.title} className="rounded-2xl bg-white/10 border border-white/10 p-6">
                <div className="text-emerald-300 font-semibold text-lg">{idx + 1}</div>
                <div className="mt-2 text-white font-semibold">{tile.title}</div>
                <div className="mt-2 text-white/70 text-sm">{tile.text}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onRegister}
            className="mt-8 px-6 py-3 rounded-full bg-emerald-500 text-[#0f2f34] font-semibold hover:bg-emerald-400"
          >
            Download Now
          </button>
        </div>
      </section>

      <footer className="bg-[#123740] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          <div className="grid gap-10 md:grid-cols-4 text-sm">
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-2 text-white">
                <img src="/logo.svg" alt="" className="h-7 w-7" />
                <span className="font-semibold text-white">NutriMedAI</span>
              </div>
              <p className="text-white/70">Stay updated for our latest news &amp; insights.</p>
              <div className="flex gap-2 text-white/80">
                <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="email" placeholder="Enter your email" className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                <button type="button" className="px-4 py-2.5 rounded-lg bg-emerald-500 text-[#0f2f34] font-semibold hover:bg-emerald-400 whitespace-nowrap">Subscribe</button>
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-4">Individuals</div>
              <ul className="space-y-2.5 text-white/70">
                <li><button type="button" className="text-left hover:text-white transition-colors">Nutrition tracker</button></li>
                <li><button type="button" className="text-left hover:text-white transition-colors">Meal analysis</button></li>
                <li><button type="button" className="text-left hover:text-white transition-colors">Health reports</button></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-4">Company</div>
              <ul className="space-y-2.5 text-white/70">
                <li><button type="button" className="text-left hover:text-white transition-colors">FAQ</button></li>
                <li><button type="button" className="text-left hover:text-white transition-colors">Contact</button></li>
                <li><button type="button" className="text-left hover:text-white transition-colors">Privacy</button></li>
                <li><button type="button" className="text-left hover:text-white transition-colors">Terms of Service</button></li>
                <li><button type="button" className="text-left hover:text-white transition-colors">Cookies</button></li>
              </ul>
            </div>
            <div>
              <div className="text-white font-semibold mb-4">Resources</div>
              <ul className="space-y-2.5 text-white/70">
                <li><button type="button" className="text-left hover:text-white transition-colors">Community</button></li>
                <li><button type="button" className="text-left hover:text-white transition-colors">Blog</button></li>
                <li><button type="button" className="text-left hover:text-white transition-colors">Support</button></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 border-t border-white/10">
          <p className="text-center text-xs text-white/50">© 2023 – 2026 NutriMedAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const { user, loading: authLoading, login, register, logout, error: authError, clearError: clearAuthError } = useAuth()
  const [authView, setAuthView] = useState<'landing' | 'auth' | 'about'>('landing')
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [currentConditions, setCurrentConditions] = useState('')
  const [concernedConditions, setConcernedConditions] = useState('')
  const [userDescription, setUserDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

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
      form.append('current_conditions', currentConditions.trim() || 'No current medical conditions')
      form.append('concerned_conditions', concernedConditions.trim() || 'None specified')
      form.append('user_description', userDescription.trim())
      const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Analysis failed')
      setAnalysis(data.analysis || 'No analysis returned.')
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoadingAnalysis(false)
    }
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

  return (
    <div className="min-h-screen bg-[#0f2f34] text-white flex flex-col">
      <header className="sticky top-0 z-[9999] border-b border-white/10 bg-[#0f2f34]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-9 w-9" />
            <h1 className="text-lg font-semibold">NutriMedAI</h1>
          </div>
          <span className="text-sm text-white/70 truncate max-w-[200px]" title={user.email}>{user.email}</span>
          <button type="button" onClick={logout} className="px-3 py-1.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 border border-white/20">
            Log out
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full space-y-6">
        <section className="rounded-2xl bg-[#123740] border border-white/10 p-4 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-lg md:text-xl font-semibold">Medical profile & analysis</h2>
            <button
              type="button"
              onClick={startNewAnalysis}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 border border-white/20"
            >
              New analysis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Current medical condition</label>
              <input
                type="text"
                value={currentConditions}
                onChange={(e) => setCurrentConditions(e.target.value)}
                placeholder="e.g. Diabetes, Hypertension"
                className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Conditions to monitor</label>
              <input
                type="text"
                value={concernedConditions}
                onChange={(e) => setConcernedConditions(e.target.value)}
                placeholder="e.g. Heart health, Blood sugar"
                className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            <label className="flex flex-col items-center justify-center w-full min-h-[280px] rounded-lg border border-white/20 bg-white/5 cursor-pointer overflow-hidden transition-colors hover:bg-white/10">
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              {preview ? (
                <img src={preview} alt="Upload preview" className="w-full h-full min-h-[280px] max-h-[400px] object-contain bg-white/5" />
              ) : (
                <span className="flex flex-col items-center gap-3 text-center px-4 py-8">
                  <span className="flex items-center justify-center w-11 h-11 rounded-lg bg-white/10 text-white/60" aria-hidden>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-white/80">Upload food image</span>
                  <span className="text-xs text-white/50">PNG, JPG, JPEG, GIF, WEBP</span>
                </span>
              )}
            </label>

            <div className="flex flex-col min-h-[280px] rounded-lg border border-white/20 bg-white/5 p-5">
              <label htmlFor="description-input" className="text-sm font-medium text-white/80 mb-2 block">
                Description (optional)
              </label>
              <input
                id="description-input"
                type="text"
                placeholder="e.g. Portion size, preparation method, or your question"
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
              <button
                type="button"
                onClick={analyzeFood}
                disabled={!file || loadingAnalysis}
                className="mt-5 w-full px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#0f2f34] font-medium text-sm transition-colors"
              >
                {loadingAnalysis ? 'Analyzing...' : 'Analyze food'}
              </button>
              {analysisError && (
                <p className="mt-3 text-sm text-red-200 bg-red-500/20 border border-red-400/40 rounded-lg px-3 py-2">
                  {analysisError}
                </p>
              )}
            </div>
          </div>
        </section>

        {analysis && (
          <section className="rounded-2xl bg-[#123740] border border-white/10 p-5 md:p-6">
            <h3 className="text-lg font-semibold mb-3">Nutrition summary</h3>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/85 whitespace-pre-wrap leading-relaxed">
              {analysis}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
