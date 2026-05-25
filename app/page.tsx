'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const features = [
  {
    title: 'Project Management',
    description:
      'Teachers can create projects, set deadlines, manage groups, and track project status from one clean dashboard.',
  },
  {
    title: 'Work Logs',
    description:
      'Students submit weekly contribution logs with evidence links for transparent effort tracking.',
  },
  {
    title: 'Peer Ratings',
    description:
      'Group members rate each other to capture contribution quality, collaboration, and consistency.',
  },
  {
    title: 'Fairness Scores',
    description:
      'The system combines peer ratings, work logs, and teacher evaluations into a clear fairness score.',
  },
  {
    title: 'Dispute Resolution',
    description:
      'Students can raise disputes with evidence, while admins review and resolve fairness-related claims.',
  },
  {
    title: 'Reports & Analytics',
    description:
      'Teachers can view polished reports showing score breakdowns, risk areas, and student performance.',
  },
]

const roles = [
  {
    title: 'For Teachers',
    text: 'Create projects, build groups, evaluate students, review reports, and monitor fairness.',
  },
  {
    title: 'For Students',
    text: 'Submit work logs, rate peers, view fairness scores, and raise disputes when needed.',
  },
  {
    title: 'For Admins',
    text: 'Manage users, monitor alerts, handle disputes, and keep the system reliable.',
  },
]

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

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
      <div className="flex min-h-svh items-center justify-center bg-[#302b43]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-white/25" />
          <h1 className="text-2xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-svh overflow-hidden bg-[#302b43] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(139,92,246,0.45),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.28),transparent_32%),linear-gradient(135deg,rgba(74,68,99,1),rgba(28,24,42,1))]" />

      <header className="relative z-10 border-b border-white/15 bg-[#1f1a31]/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-5">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-black text-[#211d2f] shadow-lg transition group-hover:scale-105">
              FE
            </div>

            <div>
              <p className="text-lg font-bold leading-none tracking-tight text-white">
                Fairness Engine
              </p>
              <p className="mt-1 text-xs text-white/65">
                Fair group project management
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
          <Link href="/support">
  <Button
    variant="ghost"
    className="rounded-xl text-white hover:bg-white/12 hover:text-white"
  >
    Support
  </Button>
</Link>
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="rounded-xl text-white hover:bg-white/12 hover:text-white"
              >
                Login
              </Button>
            </Link>

            <Link href="/auth/sign-up">
              <Button className="rounded-xl bg-white px-5 text-[#211d2f] shadow-lg shadow-black/15 hover:bg-white/90">
                Sign Up
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="slide-up">
              <div className="mb-6 inline-flex rounded-full border border-white/20 bg-white/14 px-4 py-2 text-sm font-medium text-white/85 shadow-lg backdrop-blur">
                Transparent scoring for group projects
              </div>

              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white text-foreground md:text-7xl">
                Fair teamwork,
                <br />
                <span className="text-white/82 text-foreground">measurable effort.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg   leading-8 text-white/78">
                Fairness Engine helps teachers and students manage group
                projects with work logs, peer ratings, teacher evaluations,
                dispute handling, and clear fairness scores.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/auth/sign-up">
                  <Button
                    size="lg"
                    className="h-12 rounded-2xl bg-white px-7 font-semibold text-[#211d2f] shadow-xl shadow-black/25 hover:bg-white/90"
                  >
                    Get Started
                  </Button>
                </Link>

                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-2xl border-white/25 bg-white/8 px-7 font-semibold text-white hover:bg-white/15 hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/20 bg-white/14 p-4 shadow-lg backdrop-blur">
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="mt-1 text-xs text-white/65">User roles</p>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/14 p-4 shadow-lg backdrop-blur">
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="mt-1 text-xs text-white/65">Score clarity</p>
                </div>

                <div className="rounded-2xl border border-white/20 bg-white/14 p-4 shadow-lg backdrop-blur">
                  <p className="text-2xl font-bold text-white">Live</p>
                  <p className="mt-1 text-xs text-white/65">Reports</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-7 rounded-[2rem] bg-violet-300/18 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/18 bg-[#171326] p-5 shadow-2xl shadow-black/35">
                <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#2d2942] p-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.65),transparent_35%),linear-gradient(145deg,rgba(109,80,201,0.55),rgba(15,12,24,0.95))]" />

                  <div className="relative z-10">
                    <div className="mb-8 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/65">
                          Project Health
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold text-white">
                          AI Research Group
                        </h2>
                      </div>

                      <span className="rounded-full border border-green-300/20 bg-green-400/20 px-3 py-1 text-xs font-semibold text-green-100">
                        Healthy
                      </span>
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-white/18 bg-white/14 p-4 shadow-lg backdrop-blur">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white/65">
                              Average fairness
                            </p>
                            <p className="mt-1 text-3xl font-bold text-white">
                              82/100
                            </p>
                          </div>

                          <div className="h-16 w-16 rounded-full border-8 border-white/18 border-t-green-300" />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/18 bg-white/12 p-4">
                          <p className="text-xs text-white/58">Peer</p>
                          <p className="mt-1 text-xl font-bold text-white">
                            78
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/18 bg-white/12 p-4">
                          <p className="text-xs text-white/58">Effort</p>
                          <p className="mt-1 text-xl font-bold text-white">
                            86
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/18 bg-white/12 p-4">
                          <p className="text-xs text-white/58">Teacher</p>
                          <p className="mt-1 text-xl font-bold text-white">
                            90
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/18 bg-white/12 p-4">
                        <div className="mb-2 flex justify-between text-xs text-white/65">
                          <span>Contribution progress</span>
                          <span>82%</span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/15">
                          <div className="h-full w-[82%] rounded-full bg-white" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-center gap-3">
                      <span className="h-1 w-10 rounded-full bg-white/35" />
                      <span className="h-1 w-10 rounded-full bg-white" />
                      <span className="h-1 w-10 rounded-full bg-white/35" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
              Platform Features
            </p>

            <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">
              Everything needed for fair group assessment
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/72">
              Designed around real classroom workflows: teachers manage,
              students contribute, and admins resolve issues.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="border-white/18 bg-white/12 text-white shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:border-white/30 hover:bg-white/16"
                style={{
                  animationDelay: `${index * 70}ms`,
                }}
              >
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/14 text-sm font-bold text-white">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>

                <CardContent>
                  <p className="text-sm leading-6 text-white/72">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="rounded-[2rem] border border-white/18 bg-[#211d2f]/82 p-6 shadow-2xl shadow-black/25 backdrop-blur md:p-10">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
                  Role Based System
                </p>

                <h2 className="mt-2 text-3xl font-semibold text-white">
                  One platform, three focused workspaces.
                </h2>

                <p className="mt-4 text-sm leading-6 text-white/72">
                  Each role gets a dedicated dashboard so the workflow stays
                  simple, clear, and professional.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {roles.map((role) => (
                  <div
                    key={role.title}
                    className="rounded-2xl border border-white/18 bg-white/12 p-5 shadow-lg shadow-black/10"
                  >
                    <h3 className="font-semibold text-white">{role.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/72">
                      {role.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="overflow-hidden rounded-[2rem] border border-white/18 bg-white/14 p-8 text-center shadow-2xl shadow-black/25 backdrop-blur md:p-12">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              Ready to make group projects fair?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/72">
              Start with a teacher or student account and experience transparent
              contribution tracking in minutes.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <Link href="/auth/sign-up">
                <Button className="rounded-2xl bg-white text-[#211d2f] shadow-lg shadow-black/20 hover:bg-white/90">
                  Create Account
                </Button>
              </Link>

              <Link href="/auth/login">
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/25 bg-white/8 text-white hover:bg-white/15 hover:text-white"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/15 bg-[#1f1a31]/70 py-8 backdrop-blur-xl">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-white/65 md:flex-row">
          <p>Fairness Engine © 2026. All rights reserved.</p>

          <div className="flex gap-4">
            <Link href="/auth/login" className="hover:text-white">
              Login
            </Link>

            <Link href="/auth/sign-up" className="hover:text-white">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}