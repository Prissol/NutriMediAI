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
          <h2 className="text-3xl md:text-4xl font-semibold">We focus on what fuels you. Not just the calories.</h2>
          <p className="mt-4 text-white/70">We turn everyday food decisions into clear, personalized guidance.</p>
        </div>
      </section>

      <footer className="bg-[#123740] border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center text-sm text-white/60">
          © 2023 – 2026 NutriMedAI. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const { user, loading: authLoading, login, register, logout, error: authError, clearError: clearAuthError } = useAuth()
  const [authView, setAuthView] = useState<'landing' | 'auth' | 'about'>('landing')
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')

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
      <main className="max-w-4xl mx-auto px-4 py-8 w-full">
        <p className="text-white/80">You&apos;re logged in. Dashboard and food analysis will load here.</p>
      </main>
    </div>
  )
}
