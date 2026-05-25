'use client'

import AppLoading from '@/components/app-loading'
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

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export default function RouteLoadingButton({
  href,
  children,
  variant = 'default',
  size = 'default',
  className = '',
  title = 'Loading',
  subtitle = 'Please wait while we open the next page.',
}: {
  href: string
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  title?: string
  subtitle?: string
}) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleNavigate = () => {
    setIsNavigating(true)
    router.push(href)
  }

  return (
    <>
      {isNavigating && (
        <div className="fixed inset-0 z-[9999]">
          <AppLoading title={title} subtitle={subtitle} />
        </div>
      )}

      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={handleNavigate}
        disabled={isNavigating}
      >
        {children}
      </Button>
    </>
  )
}