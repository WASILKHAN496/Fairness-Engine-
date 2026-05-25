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

function ProjectCubeLoader() {
  return (
    <div className="project-cube-loader-screen">
      <div className="project-wrapper-grid">
        {['L', 'O', 'A', 'D', 'I', 'N', 'G'].map((letter) => (
          <div className="project-cube" key={letter}>
            <div className="project-face project-face-front">{letter}</div>
            <div className="project-face project-face-back" />
            <div className="project-face project-face-right" />
            <div className="project-face project-face-left" />
            <div className="project-face project-face-top" />
            <div className="project-face project-face-bottom" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProjectNavLoadingButton({
  href,
  children,
  variant = 'ghost',
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
      {loading && <ProjectCubeLoader />}

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