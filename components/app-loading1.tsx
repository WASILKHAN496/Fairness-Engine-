export default function AppLoading() {
    return (
      <div className="fixed inset-0 z-[9999] flex min-h-svh items-center justify-center bg-white px-4">
        <div className="wrapper-grid">
          {['L', 'O', 'A', 'D', 'I', 'N', 'G'].map((letter) => (
            <div className="cube" key={letter}>
              <div className="face face-front">{letter}</div>
              <div className="face face-back" />
              <div className="face face-right" />
              <div className="face face-left" />
              <div className="face face-top" />
              <div className="face face-bottom" />
            </div>
          ))}
        </div>
      </div>
    )
  }