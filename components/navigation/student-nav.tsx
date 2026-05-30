'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function StudentNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const initialTheme = savedTheme || 'light'

    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

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
    if (href === '/dashboard/student') {
      return pathname === href
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    }

    return 'FE'
  }

  const navLinks = [
    {
      label: 'Projects',
      href: '/dashboard/student',
    },
    {
      label: 'Profile',
      href: '/dashboard/student/profile',
    },
    {
      label: 'Notifications',
      href: '/dashboard/student/notifications',
    },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/dashboard/student"
          className="group flex min-w-0 items-center gap-3"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || user.email || 'Profile'}
              className="h-10 w-10 shrink-0 rounded-2xl border object-cover shadow-sm transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              {getInitials()}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-none tracking-tight">
              Fairness Engine
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Student Workspace
            </p>
          </div>
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center justify-end gap-2 md:flex">
          {navLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive(item.href) ? 'default' : 'ghost'}
                className="rounded-xl"
              >
                {item.label}
              </Button>
            </Link>
          ))}

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

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-background text-xl font-bold shadow-sm md:hidden"
          aria-label="Toggle student menu"
        >
          {menuOpen ? '×' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t bg-background px-4 py-4 shadow-sm md:hidden">
          <div className="space-y-2">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={`rounded-2xl border p-4 ${
                    isActive(item.href)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground'
                  }`}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                </div>
              </Link>
            ))}

            <div className="grid grid-cols-2 gap-2 pt-2">
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
        </div>
      )}
    </nav>
  )
}