'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {  useState } from 'react'

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

export default function LoginPage() {
  
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /*useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])
*/
  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
    <div className="flex min-h-svh items-center justify-center bg-[#77738a] px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-[#211d2f] shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-[#2d2942] p-8 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.55),transparent_35%),linear-gradient(145deg,rgba(109,80,201,0.55),rgba(15,12,24,0.9))]" />

          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-[-10%] top-[38%] h-72 w-[120%] rotate-[-12deg] rounded-[50%] bg-black/30 blur-sm" />
            <div className="absolute left-[5%] top-[45%] h-56 w-[110%] rotate-[-8deg] rounded-[50%] bg-black/35 blur-md" />
            <div className="absolute left-[20%] top-[52%] h-44 w-[90%] rotate-[-4deg] rounded-[50%] bg-black/30 blur-lg" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-black tracking-[0.25em] text-white">
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
                Fair Group Work,
                <br />
                Transparent Scores
              </h2>

              <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">
                Track contribution, peer ratings, work logs, disputes, and fairness
                reports from one clean platform.
              </p>

              <div className="mt-8 flex gap-3">
                <span className="h-1 w-10 rounded-full bg-white/30" />
                <span className="h-1 w-10 rounded-full bg-white/30" />
                <span className="h-1 w-10 rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[620px] items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <h1 className="text-4xl font-semibold tracking-tight text-white">
                Welcome back
              </h1>

              <p className="mt-3 text-sm text-white/50">
                Don&apos;t have an account?{' '}
                <Link href="/auth/sign-up" className="text-primary underline-offset-4 hover:underline">
                  Create one
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FloatingInput
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                onBlur={(value) => setEmail(value.trim().toLowerCase())}
                disabled={loading}
                autoComplete="off"
              />

              <FloatingInput
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                disabled={loading}
                autoComplete="new-password"
              />

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
                {loading ? 'Signing in...' : 'Sign in'}
              </button>

              <div className="flex items-center gap-4 py-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/35">Secure access</span>
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
                  disabled
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/40"
                >
                  GitHub soon
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}