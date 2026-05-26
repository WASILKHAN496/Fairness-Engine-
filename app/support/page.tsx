'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  FaBookOpen,
  FaChartLine,
  FaEnvelope,
  FaFileCircleQuestion,
  FaGraduationCap,
  FaHeadset,
  FaLifeRing,
  FaMessage,
  FaPeopleGroup,
  FaPersonChalkboard,
  FaRegCircleQuestion,
  FaShieldHalved,
  FaTicket,
  FaUserGear,
  FaVideo,
  FaWandMagicSparkles,
} from 'react-icons/fa6'

const quickCards = [
  {
    title: 'Teacher Help',
    description: 'Create projects, groups, evaluations, and reports.',
    color: 'bg-cyan-500',
    icon: FaPersonChalkboard,
  },
  {
    title: 'Student Help',
    description: 'Submit work logs, peer ratings, and disputes.',
    color: 'bg-orange-500',
    icon: FaGraduationCap,
  },
  {
    title: 'Admin Guide',
    description: 'Manage users, alerts, and dispute decisions.',
    color: 'bg-emerald-500',
    icon: FaUserGear,
  },
  {
    title: 'Fairness Score',
    description: 'Understand how score components are calculated.',
    color: 'bg-purple-500',
    icon: FaChartLine,
  },
]

const topics = [
  'How is the fairness score calculated?',
  'How can a teacher create a project?',
  'How can students submit weekly work logs?',
  'How do peer ratings affect the final score?',
  'How can a student create a dispute?',
  'How does an admin resolve a dispute?',
]

const contactOptions = [
  {
    title: 'Live Chat',
    icon: FaMessage,
  },
  {
    title: 'Help Ticket',
    icon: FaTicket,
  },
  {
    title: 'Email Support',
    icon: FaEnvelope,
  },
  {
    title: 'Report Issue',
    icon: FaLifeRing,
  },
  {
    title: 'Feature Request',
    icon: FaFileCircleQuestion,
  },
  {
    title: 'Documentation',
    icon: FaBookOpen,
  },
]

const tutorials = [
  {
    title: 'Create and manage a project',
    text: 'Learn how teachers can create projects, set deadlines, and manage groups.',
  },
  {
    title: 'Submit work logs',
    text: 'Learn how students can submit weekly contribution evidence.',
  },
  {
    title: 'Review fairness reports',
    text: 'Understand score breakdowns and contribution analytics.',
  },
]

export default function SupportPage() {
  const [question, setQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState<string | null>(null)
  const [aiSource, setAiSource] = useState<string | null>(null)
  const [aiNote, setAiNote] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const handleAskAi = async (customQuestion?: string) => {
    const finalQuestion = (customQuestion ?? question).trim()

    if (!finalQuestion) {
      setAiError('Please write a support question first.')
      return
    }

    setQuestion(finalQuestion)
    setAiLoading(true)
    setAiAnswer(null)
    setAiSource(null)
    setAiNote(null)
    setAiError(null)

    try {
      const res = await fetch('/api/ai/support-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: finalQuestion,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to get AI support answer')
      }

      setAiAnswer(payload.answer || 'No support answer generated.')
      setAiSource(payload.source || null)
      setAiNote(payload.note || null)
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : 'Failed to get AI support answer'
      )
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#f5f5f7] text-slate-950">
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4b0082] text-sm font-bold text-white">
              FE
            </div>

            <div>
              <p className="font-bold leading-none">Fairness Engine</p>
              <p className="mt-1 text-xs text-slate-500">Support Center</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Home
            </Link>

            <Link
              href="/auth/login"
              className="rounded-xl bg-[#4b0082] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a0066]"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <section
        className="relative overflow-hidden bg-[#19002e] bg-cover bg-center"
        style={{
          backgroundImage: "url('/customer.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#250044]/95 via-[#4b0082]/75 to-[#000000]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(236,72,153,0.35),transparent_28%),radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.35),transparent_28%)]" />

        <div className="absolute left-20 top-24 hidden text-6xl text-white/85 md:block">
          <FaHeadset />
        </div>

        <div className="absolute right-24 top-20 hidden text-6xl text-white/85 md:block">
          <FaShieldHalved />
        </div>

        <div className="relative mx-auto flex min-h-[430px] max-w-7xl items-center justify-center px-4 py-20 text-center">
          <div className="w-full max-w-2xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-3xl text-white backdrop-blur">
              <FaHeadset />
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              How can we help?
            </h1>
            <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
  AI Powered
</span>
            <p className="mt-3 text-sm leading-6 text-white/80">
              Ask the AI Support Assistant or search guides, tutorials, and
              support topics for Fairness Engine.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAskAi()
              }}
              className="mx-auto mt-7 flex max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl"
            >
              <input
                type="text"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value)
                  setAiError(null)
                }}
                placeholder="Ask AI: How do I submit a dispute?"
                className="h-13 flex-1 border-0 px-4 text-sm text-slate-800 outline-none"
              />

              <button
                type="submit"
                disabled={aiLoading}
                className="flex items-center gap-2 bg-[#ff2f6d] px-6 text-sm font-semibold text-white hover:bg-[#e2255f] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <FaWandMagicSparkles />
                {aiLoading ? 'Asking...' : 'Ask AI'}
              </button>
            </form>

            <div className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-2">
              {topics.slice(0, 3).map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleAskAi(topic)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur transition hover:bg-white/20"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {(aiAnswer || aiError || aiLoading) && (
          <section className="relative z-20 -mt-20 mb-10">
            <div className="rounded-2xl border border-white/70 bg-white p-5 shadow-2xl shadow-slate-900/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#4b0082]">
                    <FaWandMagicSparkles />
                    <h2 className="text-sm font-bold">
                      AI Support Assistant
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Smart help for teacher, student, admin, reports, disputes,
                    and fairness score questions.
                  </p>
                </div>

                {aiSource && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                    Source: {aiSource}
                  </span>
                )}
              </div>

              {aiLoading && (
                <div className="mt-5 rounded-xl border bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Generating support answer...
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Reviewing your question and matching it with Fairness Engine
                    workflows.
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-1/2 rounded-full bg-[#ff2f6d] loading-progress" />
                  </div>
                </div>
              )}

              {aiError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {aiError}
                </div>
              )}

              {aiAnswer && (
                <div className="mt-5 rounded-xl border bg-slate-50 p-4">
                  {aiNote && (
                    <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                      {aiNote}
                    </div>
                  )}

                  <div className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {aiAnswer}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="relative z-10 -mt-16">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Let&apos;s help you</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {quickCards.map((card) => {
              const Icon = card.icon

              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => handleAskAi(card.title)}
                  className={`${card.color} min-h-32 rounded-xl p-5 text-left text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-xl">
                        <Icon />
                      </div>

                      <h3 className="font-bold">{card.title}</h3>

                      <p className="mt-3 text-xs leading-5 text-white/90">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Trending Topics</h2>

            <button className="text-xs font-semibold text-[#ff2f6d]">
              VIEW ALL
            </button>
          </div>

          <div className="mt-4 grid gap-x-8 border-t md:grid-cols-2">
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => handleAskAi(topic)}
                className="flex items-center justify-between border-b py-4 text-left text-sm font-medium text-slate-700 hover:text-[#4b0082]"
              >
                <span>{topic}</span>
                <span>›</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-bold">How to reach us</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-6">
            {contactOptions.map((option) => {
              const Icon = option.icon

              return (
                <div
                  key={option.title}
                  className="flex min-h-28 flex-col items-center justify-center rounded-xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-3 text-2xl text-[#ff2f6d]">
                    <Icon />
                  </div>

                  <p className="text-xs font-semibold">{option.title}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Video Tutorials</h2>

            <button className="text-xs font-semibold text-[#ff2f6d]">
              VIEW ALL
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {tutorials.map((item, index) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[#4b0082] to-[#ff2f6d] text-4xl text-white">
                  <FaVideo />
                </div>

                <div className="p-4">
                  <p className="text-xs font-semibold text-[#ff2f6d]">
                    Tutorial {index + 1}
                  </p>

                  <h3 className="mt-1 text-sm font-bold">{item.title}</h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="min-h-44 rounded-xl bg-[#ff2f6d] p-6 text-white shadow-lg">
            <div className="mb-4 text-3xl">
              <FaHeadset />
            </div>

            <h2 className="text-xl font-bold">Need direct support?</h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
              Facing an issue with score calculation, project access, group
              members, or disputes? Send a request and our support team will
              guide you.
            </p>

            <button
              type="button"
              onClick={() =>
                handleAskAi(
                  'I need direct support with score calculation, project access, group members, or disputes.'
                )
              }
              className="mt-6 bg-white px-5 py-2 text-xs font-bold text-[#ff2f6d]"
            >
              REQUEST HELP
            </button>
          </div>

          <div className="min-h-44 rounded-xl bg-[#4b0082] p-6 text-white shadow-lg">
            <div className="mb-4 text-3xl">
              <FaRegCircleQuestion />
            </div>

            <h2 className="text-xl font-bold">Fairness documentation</h2>

            <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
              Learn how peer ratings, effort score, teacher evaluation, and
              disputes work together inside Fairness Engine.
            </p>

            <button
              type="button"
              onClick={() =>
                handleAskAi(
                  'Explain how peer ratings, effort score, teacher evaluation, and disputes work together.'
                )
              }
              className="mt-6 bg-white px-5 py-2 text-xs font-bold text-[#4b0082]"
            >
              OPEN GUIDE
            </button>
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-slate-500 md:flex-row">
          <p>Fairness Engine Support © 2026</p>

          <div className="flex gap-4">
            <Link href="/">Home</Link>
            <Link href="/auth/login">Login</Link>
            <Link href="/auth/sign-up">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}