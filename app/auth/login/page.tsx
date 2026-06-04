'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { FormEvent, useEffect, useState } from 'react'
function AuthInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  disabled,
  autoComplete,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  onBlur?: (value: string) => void
  disabled?: boolean
  autoComplete?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-medium text-slate-500">
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur?.(event.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={label}
       className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 selection:bg-yellow-200 selection:text-slate-950 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-200/60 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  )
}
function VisualPanel() {
  return (
    <div className="relative hidden min-h-[620px] overflow-hidden rounded-[2rem] bg-slate-900 lg:block">
      <img
        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c"
        alt="Team collaboration workspace"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/55 to-slate-950/75" />

      <div className="absolute left-8 top-8 rounded-2xl bg-yellow-300 px-5 py-3 text-xs font-semibold text-slate-900 shadow-xl">
        Task Review With Team
        <p className="mt-1 text-[10px] font-medium text-slate-700">
          09:30am - 10:00am
        </p>
      </div>

      <Link
  href="/"
  className="absolute right-8 top-8 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-900 shadow-lg transition hover:scale-105 hover:bg-yellow-300"
  aria-label="Back to home"
>
  ×
</Link>

      <div className="absolute bottom-8 right-8 rounded-3xl bg-white/15 p-5 text-white shadow-2xl backdrop-blur-md">
        <p className="text-xs text-white/70">This Week</p>

        <div className="mt-3 grid grid-cols-6 gap-3 text-center text-xs">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
            <div key={day}>
              <p className="text-white/60">{day}</p>
              <p
                className={`mt-1 rounded-full px-2 py-1 ${
                  index === 2
                    ? 'bg-yellow-300 text-slate-900'
                    : 'text-white'
                }`}
              >
                {22 + index}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end p-9">
        <div className="max-w-md pb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-300">
            Smart Evaluation
          </p>

          <h2 className="mt-4 text-4xl font-bold leading-tight text-white">
            Fair group work with transparent contribution tracking.
          </h2>

          <p className="mt-4 text-sm leading-6 text-white/80">
            Manage projects, work logs, peer ratings, disputes, teacher reviews,
            and fairness reports from one clean workspace.
          </p>
        </div>
      </div>
    </div>
  )
}


export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
 useEffect(() => {
  setPassword('')
}, [])
  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const trimmedEmail = email.trim().toLowerCase()

      if (!trimmedEmail) {
        throw new Error('Please enter your email.')
      }

      if (!validateEmail(trimmedEmail)) {
        throw new Error('Please enter a valid email address.')
      }

      if (!password) {
        throw new Error('Please enter your password.')
      }

      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (loginError) {
        if (loginError.message.toLowerCase().includes('email not confirmed')) {
          throw new Error(
            'Email is not confirmed. Please confirm your email or disable email confirmation in Supabase for development.'
          )
        }

        throw loginError
      }

      if (!data.user) {
        throw new Error('Login failed. Please try again.')
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      const userRole = userData?.role || data.user.user_metadata?.role || 'student'

      if (userRole === 'teacher') {
        router.replace('/dashboard/teacher')
      } else if (userRole === 'admin') {
        router.replace('/dashboard/admin')
      } else {
        router.replace('/dashboard/student')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#aab0ba] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex min-h-[calc(100svh-3rem)] items-center justify-center">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-[#f7f5e7] p-5 shadow-2xl lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex min-h-[620px] flex-col justify-between rounded-[1.7rem] px-6 py-7 sm:px-10">
            <div>
              <Link
                href="/"
                className="inline-flex rounded-full border border-slate-300 bg-white/50 px-5 py-2 text-sm font-medium text-slate-700 shadow-sm"
              >
                Fairness Engine
              </Link>
            </div>

            <div className="mx-auto w-full max-w-sm">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Welcome back
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Sign in to continue your workspace
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AuthInput
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onBlur={(value) => setEmail(value.trim().toLowerCase())}
                  disabled={loading}
                  autoComplete="email"
                />

                <AuthInput
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  disabled={loading}
                  autoComplete="new-password"
                />

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-yellow-300 text-sm font-bold text-slate-900 shadow-lg shadow-yellow-300/20 transition hover:scale-[1.01] hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled
                  className="h-11 rounded-2xl border border-slate-300 bg-white/40 text-sm font-medium text-slate-500"
                >
                  Google soon
                </button>

                <button
                  type="button"
                  disabled
                  className="h-11 rounded-2xl border border-slate-300 bg-white/40 text-sm font-medium text-slate-500"
                >
                  GitHub soon
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <p>
                No account?{' '}
                <Link href="/auth/sign-up" className="font-semibold text-slate-900 underline">
                  Create one
                </Link>
              </p>

              <Link href="/" className="underline">
                Back home
              </Link>
            </div>
          </div>

          <VisualPanel />
        </div>
      </div>
    </div>
  )
}