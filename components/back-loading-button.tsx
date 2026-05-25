'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ReactNode, useState } from 'react'

type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'

function CubeLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-svh items-center justify-center bg-white px-4">
      <div className="wrapper-grid">
        <div className="cube">
          <div className="face face-front">L</div>
          <div className="face face-back" />
          <div className="face face-right" />
          <div className="face face-left" />
          <div className="face face-top" />
          <div className="face face-bottom" />
        </div>

        <div className="cube">
          <div className="face face-front">O</div>
          <div className="face face-back" />
          <div className="face face-right" />
          <div className="face face-left" />
          <div className="face face-top" />
          <div className="face face-bottom" />
        </div>

        <div className="cube">
          <div className="face face-front">A</div>
          <div className="face face-back" />
          <div className="face face-right" />
          <div className="face face-left" />
          <div className="face face-top" />
          <div className="face face-bottom" />
        </div>

        <div className="cube">
          <div className="face face-front">D</div>
          <div className="face face-back" />
          <div className="face face-right" />
          <div className="face face-left" />
          <div className="face face-top" />
          <div className="face face-bottom" />
        </div>

        <div className="cube">
          <div className="face face-front">I</div>
          <div className="face face-back" />
          <div className="face face-right" />
          <div className="face face-left" />
          <div className="face face-top" />
          <div className="face face-bottom" />
        </div>

        <div className="cube">
          <div className="face face-front">N</div>
          <div className="face face-back" />
          <div className="face face-right" />
          <div className="face face-left" />
          <div className="face face-top" />
          <div className="face face-bottom" />
        </div>

        <div className="cube">
          <div className="face face-front">G</div>
          <div className="face face-back" />
          <div className="face face-right" />
          <div className="face face-left" />
          <div className="face face-top" />
          <div className="face face-bottom" />
        </div>
      </div>
    </div>
  )
}

export default function BackLoadingButton({
  href,
  children,
  variant = 'outline',
  className = 'rounded-xl',
}: {
  href: string
  children: ReactNode
  variant?: ButtonVariant
  className?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    setLoading(true)
    router.push(href)
  }

  return (
    <>
      {loading && <CubeLoader />}

      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={handleClick}
        disabled={loading}
      >
        {children}
      </Button>
    </>
  )
}