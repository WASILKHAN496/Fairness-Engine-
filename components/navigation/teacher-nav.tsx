'use client'


import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TeacherNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const initialTheme = savedTheme || 'light'

    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'

    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/auth/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/teacher') {
      return (
        pathname === href ||
        pathname.startsWith('/dashboard/teacher/project/')
      )
    }
  
    return pathname === href || pathname.startsWith(`${href}/`)
  }


  

  

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/dashboard/teacher" className="group flex items-center gap-3">
        {user?.avatar_url ? (
  <img
    src={user.avatar_url}
    alt={user.name || user.email || 'Profile'}
    className="h-10 w-10 rounded-2xl border object-cover shadow-sm transition-transform group-hover:scale-105"
  />
) : (
  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
    {user?.name
      ? user.name
          .split(' ')
          .map((word) => word[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'FE'}
  </div>
)}

          <div>
            <p className="text-lg font-bold leading-none tracking-tight">
              Fairness Engine
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Teacher Workspace
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/teacher">
            <Button
              variant={isActive('/dashboard/teacher') ? 'default' : 'ghost'}
              className="rounded-xl"
            >
              Projects
            </Button>
          </Link>

          <Link href="/dashboard/teacher/reports">
            <Button
              variant={
                isActive('/dashboard/teacher/reports') ? 'default' : 'ghost'
              }
              className="rounded-xl"
            >
              Reports
            </Button>
          </Link>
          <Link href="/dashboard/teacher/notifications">
  <Button
    variant={
      isActive('/dashboard/teacher/notifications') ? 'default' : 'ghost'
    }
    className="rounded-xl"
  >
    Notifications
  </Button>
</Link>




          <Link href="/dashboard/teacher/profile">
  <Button
    variant={
      isActive('/dashboard/teacher/profile') ? 'default' : 'ghost'
    }
    className="rounded-xl"
  >
    Profile
  </Button>
</Link>

          <Button
            variant="outline"
            onClick={toggleTheme}
            className="rounded-xl"
            type="button"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="rounded-xl"
            type="button"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}