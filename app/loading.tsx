export default function Loading() {
    return (
      <div className="flex min-h-svh items-center justify-center overflow-hidden bg-[#302b43] px-4 text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(139,92,246,0.45),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.25),transparent_32%),linear-gradient(135deg,rgba(74,68,99,1),rgba(28,24,42,1))]" />
  
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-8 flex h-44 w-44 items-center justify-center">
            <div className="absolute inset-0 rounded-[2rem] bg-white/10 blur-2xl" />
  
            <div className="relative h-36 w-36 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <svg
                viewBox="0 0 160 160"
                className="h-full w-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M38 132V61C38 54.3726 43.3726 49 50 49H110C116.627 49 122 54.3726 122 61V132"
                  className="loading-line"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
  
                <path
                  d="M62 49V37C62 32.5817 65.5817 29 70 29H90C94.4183 29 98 32.5817 98 37V49"
                  className="loading-line loading-delay-1"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
  
                <path
                  d="M56 75H68V87H56V75Z"
                  className="loading-box loading-delay-1"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
  
                <path
                  d="M74 75H86V87H74V75Z"
                  className="loading-box loading-delay-2"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
  
                <path
                  d="M92 75H104V87H92V75Z"
                  className="loading-box loading-delay-3"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
  
                <path
                  d="M56 99H68V111H56V99Z"
                  className="loading-box loading-delay-2"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
  
                <path
                  d="M74 99H86V111H74V99Z"
                  className="loading-box loading-delay-3"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
  
                <path
                  d="M92 99H104V111H92V99Z"
                  className="loading-box loading-delay-4"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
  
                <path
                  d="M70 132V118C70 113.582 73.5817 110 78 110H82C86.4183 110 90 113.582 90 118V132"
                  className="loading-line loading-delay-3"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
  
                <path
                  d="M30 132H130"
                  className="loading-line loading-delay-4"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
  
                <circle
                  cx="112"
                  cy="38"
                  r="5"
                  className="loading-dot loading-delay-1"
                  fill="currentColor"
                />
                <circle
                  cx="124"
                  cy="38"
                  r="5"
                  className="loading-dot loading-delay-2"
                  fill="currentColor"
                />
                <circle
                  cx="136"
                  cy="38"
                  r="5"
                  className="loading-dot loading-delay-3"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
  
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/50">
            Fairness Engine
          </p>
  
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Preparing workspace
          </h1>
  
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">
            Loading projects, fairness scores, reports, and role-based dashboard.
          </p>
  
          <div className="mt-8 flex gap-2">
            <span className="loading-pill" />
            <span className="loading-pill loading-delay-2" />
            <span className="loading-pill loading-delay-3" />
          </div>
        </div>
      </div>
    )
  }