'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Clock, Settings } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { 
      href: '/', 
      icon: Home, 
      label: 'Home',
      active: pathname === '/'
    },
    { 
      href: '/analytics', 
      icon: BarChart3, 
      label: 'Analytics',
      active: pathname === '/analytics'
    },
    { 
      href: '/history', 
      icon: Clock, 
      label: 'History',
      active: pathname === '/history'
    },
    { 
      href: '/settings', 
      icon: Settings, 
      label: 'Settings',
      active: pathname === '/settings'
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 py-1 safe-area-pb bg-white border-t border-gray-100">
      <div className="flex justify-around items-center">
        {navItems.map(({ href, icon: Icon, label, active }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-3 py-2 transition-colors"
            style={{ 
              color: active ? 'var(--ios-active)' : 'var(--secondary-text)'
            }}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}