'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

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
      <label htmlFor={id} className="mb-2 block text-xs font-medium text-slate-600">
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
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-200/60 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  )
}

function SignupVisualPanel() {
  return (
    <div className="relative hidden min-h-[650px] overflow-hidden rounded-[2rem] bg-[#24105f] lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.55),transparent_20%),radial-gradient(circle_at_82%_28%,rgba(168,85,247,0.42),transparent_22%),linear-gradient(145deg,#24105f,#12072f)]" />

      <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-cyan-400/70 blur-sm" />
      <div className="absolute -right-24 top-32 h-72 w-72 rounded-full border-[34px] border-violet-400/30" />
      <div className="absolute bottom-[-100px] left-[-50px] h-80 w-80 rounded-full bg-pink-400" />
      <div className="absolute bottom-[-115px] left-[110px] h-72 w-72 rounded-full bg-fuchsia-400" />
      <div className="absolute bottom-[-110px] right-[-30px] h-72 w-72 rounded-full bg-pink-300" />
      <div className="absolute bottom-[-125px] left-[260px] h-60 w-60 rounded-full bg-cyan-300" />

      <div className="absolute inset-0 opacity-50">
        <div className="absolute left-10 top-16 h-2 w-2 rounded-full bg-white" />
        <div className="absolute left-24 top-44 h-1.5 w-1.5 rounded-full bg-white" />
        <div className="absolute right-24 top-20 h-2 w-2 rounded-full bg-white" />
        <div className="absolute right-14 top-64 h-1.5 w-1.5 rounded-full bg-white" />
        <div className="absolute left-72 top-80 h-1.5 w-1.5 rounded-full bg-white" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-9">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Fairness Engine
          </Link>

          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-bold text-slate-900 shadow-lg transition hover:scale-105 hover:bg-violet-100"
            aria-label="Back to home"
          >
            ×
          </Link>
        </div>

        <div className="mb-28 max-w-md rounded-3xl border border-white/25 bg-white/15 p-7 text-white shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-100">
            Fairness Network
          </p>

          <h2 className="mt-5 text-3xl font-bold leading-tight">
            Join a smarter way to evaluate group work.
          </h2>

          <p className="mt-4 text-sm leading-6 text-white/80">
            Create projects, submit work logs, rate peers, resolve disputes, and
            generate transparent fairness scores.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [acceptedTerms, setAcceptedTerms] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    try {
      if (!trimmedName) {
        throw new Error('Please enter your full name.')
      }

      if (!trimmedEmail) {
        throw new Error('Please enter your email.')
      }

      if (!isValidEmail(trimmedEmail)) {
        throw new Error('Please enter a valid email address.')
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters.')
      }

      if (password !== repeatPassword) {
        throw new Error('Passwords do not match.')
      }

      if (!acceptedTerms) {
        throw new Error('Please accept the terms before creating an account.')
      }

      const supabase = createClient()

      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: trimmedName,
            role,
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      await supabase.auth.signOut()
      router.replace('/auth/sign-up-success')
      router.refresh()
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(
          'Could not connect to Supabase. Check your project URL, internet connection, DNS, VPN, firewall, or browser extensions.'
        )
      } else {
        setError(err instanceof Error ? err.message : 'Could not create account.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoSignup = async () => {
    setError(null)
    setLoading(true)

    const demoEmail = `demo.user.${Date.now()}@demo.test`
    const demoPassword = 'DemoPassword@123'

    try {
      const supabase = createClient()

      const { error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: 'Demo User',
            role: 'student',
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      await supabase.auth.signOut()

      alert(
        `Demo account created!\n\nEmail: ${demoEmail}\nPassword: ${demoPassword}\n\nUse these credentials to log in.`
      )

      router.replace(`/auth/login?email=${encodeURIComponent(demoEmail)}`)
      router.refresh()
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(
          'Could not connect to Supabase. Check your project URL, internet connection, DNS, VPN, firewall, or browser extensions.'
        )
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to create demo account.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#bbb4df] px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center">
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white p-5 shadow-2xl lg:grid-cols-[1fr_0.95fr]">
          <SignupVisualPanel />

          <div className="flex min-h-[650px] items-center justify-center px-5 py-10 sm:px-10">
            <div className="w-full max-w-md">
              <div className="mb-7 text-center">
                <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950">
                  Create an account
                </h1>

                <p className="mt-3 text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-violet-700 underline-offset-4 hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <AuthInput
                  id="name"
                  label="Full name"
                  value={name}
                  onChange={setName}
                  disabled={loading}
                  autoComplete="name"
                />

                <AuthInput
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onBlur={(value) => setEmail(value.trim().toLowerCase())}
                  disabled={loading}
                  autoComplete="email"
                />

                <div>
                  <label
                    htmlFor="role"
                    className="mb-2 block text-xs font-medium text-slate-600"
                  >
                    Account role
                  </label>

                  <select
                    id="role"
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value as 'student' | 'teacher')
                    }
                    disabled={loading}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-200/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>

                <AuthInput
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  disabled={loading}
                  autoComplete="new-password"
                />

                <AuthInput
                  id="repeat-password"
                  label="Repeat password"
                  type="password"
                  value={repeatPassword}
                  onChange={setRepeatPassword}
                  disabled={loading}
                  autoComplete="new-password"
                />

                <label className="flex cursor-pointer items-start gap-3 pt-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    disabled={loading}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-violet-600"
                  />

                  <span>
                    I agree to the{' '}
                    <span className="font-semibold text-violet-700 underline-offset-4 hover:underline">
                      Terms & Conditions
                    </span>
                  </span>
                </label>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-12 w-full rounded-2xl bg-violet-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:scale-[1.01] hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-400">or register with</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled
                    className="h-11 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-500"
                  >
                    Google soon
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoSignup}
                    disabled={loading}
                    className="h-11 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Creating...' : 'Demo account'}
                  </button>
                </div>
              </form>

              <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                <Link href="/" className="underline">
                  Back home
                </Link>

                <Link href="/auth/login" className="font-semibold text-violet-700 underline">
                  Login instead
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}