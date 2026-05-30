'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const adminNavItems = [
  {
    label: 'Dashboard',
    href: '/dashboard/admin',
    helper: 'System overview',
  },
  {
    label: 'Projects',
    href: '/dashboard/admin/projects',
    helper: 'Project monitoring',
  },
  {
    label: 'Activity',
    href: '/dashboard/admin/activity',
    helper: 'System logs',
  },
  {
    label: 'Users',
    href: '/dashboard/admin/users',
    helper: 'Manage accounts',
  },
  {
    label: 'Disputes',
    href: '/dashboard/admin/disputes',
    helper: 'Review claims',
  },
  {
    label: 'Alerts',
    href: '/dashboard/admin/alerts',
    helper: 'Risk warnings',
  },
  {
    label: 'Notifications',
    href: '/dashboard/admin/notifications',
    helper: 'Admin updates',
  },
  {
    label: 'Reports',
    href: '/dashboard/admin/reports',
    helper: 'System analytics',
  },
  {
    label: 'Profile',
    href: '/dashboard/admin/profile',
    helper: 'Admin account',
  },
]

export default function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const initialTheme = savedTheme || 'light'

    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const toggleSidebar = () => {
    setSidebarOpen((current) => !current)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

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

  return (
    <>
      <nav className="sticky top-0 z-[10000] border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex min-h-20 items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-xl font-bold text-foreground shadow-sm transition hover:bg-muted"
              aria-label="Toggle admin sidebar"
            >
              {sidebarOpen ? '×' : '☰'}
            </button>

            <Link
              href="/dashboard/admin"
              className="group flex min-w-0 items-center gap-3"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name || user.email || 'Admin profile'}
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
                  {user?.name
                    ? `${user.name} • Admin Control Center`
                    : 'Admin Control Center'}
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop navbar links */}
          <div className="hidden items-center gap-2 overflow-x-auto xl:flex">
            {adminNavItems.map((item) => (
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

          {/* Tablet/mobile quick actions */}
          <div className="flex items-center gap-2 xl:hidden">
            <Button
              variant="outline"
              onClick={toggleTheme}
              className="hidden rounded-xl sm:inline-flex"
              type="button"
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="hidden rounded-xl sm:inline-flex"
              type="button"
            >
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <>
          <button
            type="button"
            aria-label="Close admin sidebar background"
            onClick={closeSidebar}
            className="fixed inset-x-0 bottom-0 top-20 z-[9998] bg-transparent"
          />

          <aside className="fixed left-0 top-20 z-[9999] h-[calc(100vh-5rem)] w-[86vw] max-w-[320px] border-r border-border/80 bg-background text-foreground shadow-2xl">
            <div className="admin-sidebar-scroll h-full overflow-y-scroll">
              <div className="border-b border-border bg-primary p-6 text-primary-foreground">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || user.email || 'Admin profile'}
                        className="h-12 w-12 shrink-0 rounded-2xl border border-white/30 object-cover shadow-md"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-sm font-black shadow-md">
                        {getInitials()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                        Admin
                      </p>
                      <p className="truncate text-lg font-bold leading-tight text-white">
                        Control Panel
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeSidebar}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xl font-bold text-primary shadow-sm transition hover:scale-105 hover:bg-white/90"
                    aria-label="Close admin sidebar"
                  >
                    ×
                  </button>
                </div>

                <p className="mt-5 text-sm leading-6 text-white/90">
                  Monitor users, fairness activity, alerts, reports, disputes,
                  and system health from one place.
                </p>
              </div>

              <div className="px-4 py-5">
                <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Admin Menu
                </p>

                <div className="space-y-2">
                  {adminNavItems.map((item) => {
                    const active = isActive(item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSidebar}
                      >
                        <div
                          className={`rounded-2xl border p-4 transition ${
                            active
                              ? 'border-primary bg-primary text-primary-foreground shadow-md'
                              : 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/60 hover:shadow-sm'
                          }`}
                        >
                          <p
                            className={`text-sm font-semibold ${
                              active
                                ? 'text-primary-foreground'
                                : 'text-foreground'
                            }`}
                          >
                            {item.label}
                          </p>

                          <p
                            className={`mt-1 text-xs ${
                              active
                                ? 'text-primary-foreground/75'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {item.helper}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                <div className="mt-5 rounded-2xl border bg-muted/30 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {user?.email}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 xl:hidden">
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

                <div className="h-10" />
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}