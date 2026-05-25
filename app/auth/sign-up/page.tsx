'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function FloatingInput({
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
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur?.(e.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder=" "
        className="peer h-14 w-full rounded-2xl border border-white/10 bg-white/8 px-4 pt-5 text-sm text-white outline-none transition placeholder:text-transparent focus:border-primary focus:bg-white/12 focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/50 transition-all duration-200 peer-not-placeholder-shown:top-3 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-white/60 peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary"
      >
        {label}
      </label>
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
    <div className="flex min-h-svh items-center justify-center bg-[#77738a] px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-[#211d2f] shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[680px] overflow-hidden bg-[#2d2942] p-8 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.55),transparent_35%),linear-gradient(145deg,rgba(109,80,201,0.55),rgba(15,12,24,0.9))]" />

          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-[-10%] top-[38%] h-72 w-[120%] rotate-[-12deg] rounded-[50%] bg-black/30 blur-sm" />
            <div className="absolute left-[5%] top-[45%] h-56 w-[110%] rotate-[-8deg] rounded-[50%] bg-black/35 blur-md" />
            <div className="absolute left-[20%] top-[52%] h-44 w-[90%] rotate-[-4deg] rounded-[50%] bg-black/30 blur-lg" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="text-2xl font-black tracking-[0.25em] text-white"
              >
                FE
              </Link>

              <Link
                href="/"
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-white/20"
              >
                Back to website →
              </Link>
            </div>

            <div className="pb-8">
              <h2 className="max-w-sm text-3xl font-semibold leading-tight text-white">
                Build Fair Groups,
                <br />
                Measure Real Effort
              </h2>

              <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
                Create projects, submit work logs, collect peer feedback, and
                generate transparent fairness scores.
              </p>

              <div className="mt-8 flex gap-3">
                <span className="h-1 w-10 rounded-full bg-white/30" />
                <span className="h-1 w-10 rounded-full bg-white" />
                <span className="h-1 w-10 rounded-full bg-white/30" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[680px] items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-4xl font-semibold tracking-tight text-white">
                Create an account
              </h1>

              <p className="mt-3 text-sm text-white/50">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FloatingInput
                id="name"
                label="Full name"
                value={name}
                onChange={setName}
                disabled={loading}
                autoComplete="name"
              />

              <FloatingInput
                id="email"
                label="Email"
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
                  className="mb-2 block text-xs font-medium text-white/50"
                >
                  Account role
                </label>

                <select
                  id="role"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as 'student' | 'teacher')
                  }
                  disabled={loading}
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/8 px-4 text-sm text-white outline-none transition focus:border-primary focus:bg-white/12 focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option className="bg-[#211d2f]" value="student">
                    Student
                  </option>
                  <option className="bg-[#211d2f]" value="teacher">
                    Teacher
                  </option>
                </select>
              </div>

              <FloatingInput
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                disabled={loading}
                autoComplete="new-password"
              />

              <FloatingInput
                id="repeat-password"
                label="Repeat password"
                type="password"
                value={repeatPassword}
                onChange={setRepeatPassword}
                disabled={loading}
                autoComplete="new-password"
              />

              <label className="flex cursor-pointer items-start gap-3 text-xs text-white/55">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/10"
                />

                <span>
                  I agree to the{' '}
                  <span className="text-primary underline-offset-4 hover:underline">
                    Terms & Conditions
                  </span>
                </span>
              </label>

              {error && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-14 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              <div className="flex items-center gap-4 py-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/35">or register with</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/40"
                >
                  Google soon
                </button>

                <button
                  type="button"
                  onClick={handleDemoSignup}
                  disabled={loading}
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/75 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Creating...' : 'Demo account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}