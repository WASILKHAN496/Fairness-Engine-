import Link from 'next/link'
import {
  FaCircleCheck,
  FaArrowRightToBracket,
  FaHouse,
  FaShieldHalved,
} from 'react-icons/fa6'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#77738a] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-[#211d2f] shadow-2xl lg:grid-cols-[1fr_1fr]">
        <div className="relative hidden min-h-[560px] overflow-hidden bg-[#2d2942] p-8 lg:block">
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
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-2xl text-green-300 shadow-xl backdrop-blur">
                <FaShieldHalved />
              </div>

              <h2 className="max-w-sm text-3xl font-semibold leading-tight text-white">
                Account Created,
                <br />
                Ready to Login
              </h2>

              <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
                Your Fairness Engine account has been created successfully.
                Continue to login and access your role-based workspace.
              </p>

              <div className="mt-8 flex gap-3">
                <span className="h-1 w-10 rounded-full bg-white/30" />
                <span className="h-1 w-10 rounded-full bg-white/30" />
                <span className="h-1 w-10 rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[560px] items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-green-300/20 bg-green-400/15 text-5xl text-green-300 shadow-xl shadow-green-500/10">
              <FaCircleCheck />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/45">
              Signup Successful
            </p>

            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Account created successfully!
            </h1>

            <p className="mt-4 text-sm leading-6 text-white/60">
              Your account is ready. Please login with the same email and
              password. After login, you will be redirected automatically to your
              Teacher or Student workspace.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/auth/login"
                className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:opacity-95"
              >
                <FaArrowRightToBracket />
                Go to Login
              </Link>

              <Link
                href="/"
                className="flex h-13 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                <FaHouse />
                Back Home
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-sm font-semibold text-white">Next step</p>
              <p className="mt-1 text-sm leading-6 text-white/55">
                Login with your account credentials. Your role will decide
                whether you enter the Teacher Dashboard or Student Dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}