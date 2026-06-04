'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const features = [
  {
    title: 'Project Management',
    description:
      'Teachers create projects, set deadlines, manage groups, and track project health.',
  },
  {
    title: 'Work Logs',
    description:
      'Students submit weekly work logs with evidence links for transparent contribution tracking.',
  },
  {
    title: 'Peer Ratings',
    description:
      'Group members rate each other to measure teamwork, consistency, and effort.',
  },
  {
    title: 'Fairness Scores',
    description:
      'Peer ratings, work logs, and teacher evaluations combine into clear fairness scores.',
  },
  {
    title: 'Dispute Resolution',
    description:
      'Students raise disputes with evidence while admins review and resolve claims.',
  },
  {
    title: 'Reports & Analytics',
    description:
      'Teachers and admins view polished reports with score breakdowns and risk areas.',
  },
]

const roles = [
  {
    title: 'For Teachers',
    text: 'Create projects, manage groups, evaluate students, and review reports.',
  },
  {
    title: 'For Students',
    text: 'Submit work logs, rate peers, view scores, and raise disputes.',
  },
  {
    title: 'For Admins',
    text: 'Manage users, monitor alerts, review disputes, and control the system.',
  },
]

function FloatingPreviewCards() {
  return (
    <div className="relative min-h-[540px] w-full">
      <div className="absolute -right-8 top-0 h-80 w-80 rounded-full bg-violet-400/30 blur-3xl" />
      <div className="absolute left-10 top-28 h-44 w-44 rounded-full bg-blue-400/20 blur-2xl" />
<div className="absolute -right-3 top-[235px] z-30 hidden w-[245px] items-center gap-3 rounded-2xl border border-violet-200/60 bg-white p-3 text-slate-900 shadow-2xl shadow-black/20 md:flex">
  <img
    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
    alt="Student profile"
    className="h-12 w-12 rounded-2xl border border-violet-100 object-cover"
  />

  <div className="min-w-0">
    <p className="text-xs font-semibold text-slate-500">Student Profile</p>
    <p className="truncate text-sm font-bold text-slate-950">
      Fairness Score 92%
    </p>
  </div>
</div>
      <div className="absolute right-0 top-0 w-[330px] rounded-2xl border border-white/15 bg-white shadow-2xl shadow-black/30 sm:w-[390px]">
        <div className="rounded-t-2xl bg-[#21137a] p-4 text-white">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold">Fairness Analytics</p>
            <span className="rounded-full bg-violet-400 px-2 py-1 text-[10px]">
              Live
            </span>
          </div>

          <h3 className="text-xl font-bold leading-tight">
            Monitor group effort through smart analytics
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-3 p-4 text-center">
          {[
            ['82%', 'Score'],
            ['24', 'Logs'],
            ['18', 'Ratings'],
            ['3', 'Alerts'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-slate-100 p-3">
              <p className="text-sm font-bold text-[#21137a]">{value}</p>
              <p className="mt-1 text-[10px] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-0 top-28 w-[320px] rounded-2xl border border-white/15 bg-white p-5 shadow-2xl shadow-black/30 sm:w-[390px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Advanced analytics
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              Fairness score dashboard
            </h3>
          </div>

          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
            AI
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[78, 86, 90].map((score, index) => (
            <div key={score} className="rounded-xl bg-violet-50 p-3">
              <div className="mx-auto h-12 w-12 rounded-full border-[7px] border-violet-200 border-t-violet-600" />
              <p className="mt-2 text-center text-xs font-semibold text-slate-700">
                {index === 0 ? 'Peer' : index === 1 ? 'Effort' : 'Teacher'}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          <div className="h-2 rounded-full bg-violet-100">
            <div className="h-full w-[82%] rounded-full bg-violet-600" />
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-full w-[64%] rounded-full bg-blue-500" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-8 w-[320px] rounded-2xl border border-white/15 bg-white p-5 shadow-2xl shadow-black/30 sm:w-[390px]">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
          Integrated tools
        </p>

        <h3 className="mt-2 text-lg font-bold text-slate-900">
          Everything needed for fair group assessment
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {['Work Logs', 'Peer Ratings', 'Reports', 'Disputes'].map((item) => (
            <div key={item} className="rounded-xl border bg-slate-50 p-3">
              <div className="mb-2 h-7 w-7 rounded-lg bg-violet-100" />
              <p className="text-xs font-semibold text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'teacher') {
        router.push('/dashboard/teacher')
      } else if (user.role === 'student') {
        router.push('/dashboard/student')
      } else if (user.role === 'admin') {
        router.push('/dashboard/admin')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#1d1570]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-white/25" />
          <h1 className="text-2xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-svh overflow-x-hidden bg-white text-slate-900">
      <section className="relative min-h-svh overflow-hidden bg-[#201185] text-white">
  <div className="hero-animated-bg" />
  <div className="hero-grid-bg" />
  <div className="hero-orb hero-orb-one" />
  <div className="hero-orb hero-orb-two" />
  <div className="hero-orb hero-orb-three" />
       

        <div className="absolute bottom-[-1px] left-0 right-0 h-28 bg-white [clip-path:polygon(0_55%,100%_0,100%_100%,0_100%)]" />

        <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#201185]/80 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
            <Link href="/" className="flex items-center gap-3">
  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
    <img
      src="/fairness-logo.png"
      alt="Fairness Engine Logo"
      className="h-full w-full object-cover"
    />
  </div>

  <p className="text-xl font-bold">Fairness Engine</p>
</Link>

            <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
              <Link href="/" className="hover:text-violet-200">
                Home
              </Link>

              <a href="#features" className="hover:text-violet-200">
                Features
              </a>

              <a href="#roles" className="hover:text-violet-200">
                Roles
              </a>

              <Link href="/support" className="hover:text-violet-200">
                Support
              </Link>

              <Link href="/auth/login" className="hover:text-violet-200">
                Login
              </Link>

              <Link href="/auth/sign-up">
                <Button className="rounded-lg bg-violet-500 px-7 text-white hover:bg-violet-400">
                  Get Started
                </Button>
              </Link>
            </nav>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-xl font-bold md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '×' : '☰'}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mx-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur md:hidden">
              <div className="space-y-2">
                {[
                  ['Features', '#features'],
                  ['Roles', '#roles'],
                  ['Support', '/support'],
                  ['Login', '/auth/login'],
                ].map(([label, href]) =>
                  href.startsWith('#') ? (
                    <a
                      key={label}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-xl bg-white/10 p-3 text-sm font-semibold"
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-xl bg-white/10 p-3 text-sm font-semibold"
                    >
                      {label}
                    </Link>
                  )
                )}

                <Link
                  href="/auth/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="mt-2 w-full rounded-xl bg-white text-[#201185] hover:bg-white/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </header>

       <main className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 pb-28 pt-32 lg:grid-cols-[0.9fr_1.1fr] lg:pb-36 lg:pt-36">
          <div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl xl:text-8xl">
  <span className="block drop-shadow-[0_10px_35px_rgba(255,255,255,0.12)]">
    Fairness
  </span>
  <span className="block bg-gradient-to-r from-white via-violet-100 to-violet-300 bg-clip-text text-transparent drop-shadow-[0_10px_35px_rgba(139,92,246,0.35)]">
    Engine
  </span>
  <span className="block text-white/95">
    Smart Evaluation
  </span>
</h1>

            <p className="mt-7 max-w-xl text-base font-medium leading-8 tracking-wide text-violet-100/80 sm:text-lg">
  A modern platform for fair group projects, transparent contribution
  tracking, peer ratings, work logs, disputes, and performance reports.
</p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link href="/auth/sign-up">
                <Button className="h-12 w-full rounded-lg bg-violet-500 px-8 font-semibold text-white hover:bg-violet-400 sm:w-auto">
                  Get Started
                </Button>
              </Link>

              <Link href="/auth/login">
                <Button className="h-12 w-full rounded-lg bg-white px-8 font-semibold text-[#201185] hover:bg-white/90 sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <FloatingPreviewCards />
          </div>
        </main>
      </section>

      <section id="features" className="relative bg-white px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-600">
              Platform Features
            </p>

            <h2 className="mx-auto mt-3 max-w-4xl text-4xl font-black leading-tight tracking-[-0.04em] text-slate-950 md:text-6xl">
  Everything needed for{' '}
  <span className="bg-gradient-to-r from-violet-700 to-blue-600 bg-clip-text text-transparent">
    fair group assessment
  </span>
</h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              Teachers manage, students contribute, and admins resolve issues
              from one professional system.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <Card
  key={feature.title}
  className="border-slate-200 bg-white text-slate-950 shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-2xl"
>
  <CardHeader>
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-sm font-bold text-violet-700">
      {String(index + 1).padStart(2, '0')}
    </div>

    <CardTitle className="text-lg font-black text-slate-950">
      {feature.title}
    </CardTitle>
  </CardHeader>

  <CardContent>
    <p className="text-sm font-medium leading-6 text-slate-700">
      {feature.description}
    </p>
  </CardContent>
</Card>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border bg-white p-6 shadow-xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-600">
                Role Based System
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">
                One platform, three focused workspaces.
              </h2>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Each role gets a dedicated dashboard so the workflow stays
                simple, clear, and professional.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {roles.map((role) => (
                <div
                  key={role.title}
                  className="rounded-2xl border bg-slate-50 p-5"
                >
                  <h3 className="font-semibold text-slate-950">
                    {role.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {role.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#201185] p-8 text-center text-white shadow-2xl md:p-12">
          <h2 className="text-3xl font-black md:text-5xl">
            Ready to make group projects fair?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/75">
            Start with a teacher or student account and experience transparent
            contribution tracking in minutes.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/auth/sign-up">
              <Button className="w-full rounded-xl bg-white px-7 text-[#201185] hover:bg-white/90 sm:w-auto">
                Create Account
              </Button>
            </Link>

            <Link href="/auth/login">
              <Button
                variant="outline"
                className="w-full rounded-xl border-white/25 bg-white/10 px-7 text-white hover:bg-white/15 hover:text-white sm:w-auto"
              >
                Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-600 md:flex-row">
          <p>Fairness Engine © 2026. All rights reserved.</p>

          <div className="flex gap-4">
            <Link href="/support" className="hover:text-[#201185]">
              Support
            </Link>

            <Link href="/auth/login" className="hover:text-[#201185]">
              Login
            </Link>

            <Link href="/auth/sign-up" className="hover:text-[#201185]">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}