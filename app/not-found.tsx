import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#302b43] px-4 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(139,92,246,0.45),transparent_34%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.28),transparent_32%),linear-gradient(135deg,rgba(74,68,99,1),rgba(28,24,42,1))]" />

      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-[#211d2f]/85 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden min-h-[520px] overflow-hidden bg-[#2d2942] p-8 lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.6),transparent_35%),linear-gradient(145deg,rgba(109,80,201,0.55),rgba(15,12,24,0.95))]" />

            <div className="absolute inset-0 opacity-70">
              <div className="absolute left-[-10%] top-[38%] h-72 w-[120%] rotate-[-12deg] rounded-[50%] bg-black/30 blur-sm" />
              <div className="absolute left-[5%] top-[45%] h-56 w-[110%] rotate-[-8deg] rounded-[50%] bg-black/35 blur-md" />
              <div className="absolute left-[20%] top-[52%] h-44 w-[90%] rotate-[-4deg] rounded-[50%] bg-black/30 blur-lg" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between">
              <Link
                href="/"
                className="text-2xl font-black tracking-[0.25em] text-white"
              >
                FE
              </Link>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-white/45">
                  Page Missing
                </p>

                <h2 className="mt-3 max-w-sm text-3xl font-semibold leading-tight text-white">
                  This route does not exist in Fairness Engine.
                </h2>

                <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
                  The page may have been moved, deleted, or the URL may be
                  incorrect.
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-h-[520px] items-center justify-center px-6 py-12 sm:px-12">
            <div className="w-full max-w-md text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-4xl font-bold shadow-xl">
                404
              </div>

              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/45">
                Not Found
              </p>

              <h1 className="text-4xl font-semibold tracking-tight text-white">
                Page not found
              </h1>

              <p className="mt-4 text-sm leading-6 text-white/65">
                The page you are trying to open is not available. Go back to the
                home page or sign in to access your dashboard.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/"
                  className="flex h-13 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-[#211d2f] shadow-lg shadow-black/20 transition hover:scale-[1.01] hover:bg-white/90"
                >
                  Go Home
                </Link>

                <Link
                  href="/auth/login"
                  className="flex h-13 items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Sign In
                </Link>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                <p className="text-sm font-semibold text-white">
                  Tip
                </p>
                <p className="mt-1 text-sm leading-6 text-white/55">
                  Check the URL spelling. Dashboard pages are role-based:
                  teacher, student, and admin have separate routes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}