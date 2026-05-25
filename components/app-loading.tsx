export default function AppLoading({
    title = 'Preparing workspace',
    subtitle = 'Loading projects, fairness scores, reports, and role-based dashboard.',
  }: {
    title?: string
    subtitle?: string
  }) {
    return (
      <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#181326] px-4 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(139,92,246,0.55),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.32),transparent_32%),linear-gradient(135deg,rgba(62,55,88,1),rgba(19,15,32,1))]" />
  
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl loading-orb" />
        <div className="absolute left-[12%] top-[18%] h-24 w-24 rounded-full bg-blue-400/10 blur-2xl loading-float-slow" />
        <div className="absolute bottom-[16%] right-[14%] h-32 w-32 rounded-full bg-purple-400/10 blur-2xl loading-float" />
  
        <div className="relative z-10 w-full max-w-lg">
          <div className="loading-card rounded-[2rem] border border-white/15 bg-white/10 p-8 text-center shadow-2xl shadow-black/35 backdrop-blur-2xl">
            <div className="mx-auto mb-8 flex h-52 w-52 items-center justify-center">
              <div className="relative flex h-44 w-44 items-center justify-center">
                <div className="absolute inset-0 rounded-[2rem] bg-white/10 blur-2xl" />
                <div className="absolute inset-0 rounded-full border border-white/10 loading-spin-slow" />
                <div className="absolute h-40 w-40 rounded-full border-4 border-white/10 border-t-white/80 loading-spin" />
  
                <div className="relative flex h-32 w-32 items-center justify-center rounded-[1.7rem] border border-white/15 bg-[#211d2f]/80 shadow-2xl backdrop-blur-xl loading-icon-float">
                  <div className="tap-hand-loader">
                    <div className="tap-finger" />
                    <div className="tap-finger" />
                    <div className="tap-finger" />
                    <div className="tap-finger" />
                    <div className="tap-palm" />
                    <div className="tap-thumb" />
                  </div>
                </div>
              </div>
            </div>
  
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/50">
              Fairness Engine
            </p>
  
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              {title}
            </h1>
  
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/65">
              {subtitle}
            </p>
  
            <div className="mx-auto mt-8 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 rounded-full bg-white/80 loading-progress" />
            </div>
  
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="loading-pill" />
              <span className="loading-pill loading-delay-2" />
              <span className="loading-pill loading-delay-3" />
            </div>
          </div>
        </div>
      </div>
    )
  }