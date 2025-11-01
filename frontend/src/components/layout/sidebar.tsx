'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Truck,
  Calculator,
  Droplet,
  BarChart3,
  Settings,
  Building2,
} from 'lucide-react'

const navigation = [
  { name: 'dashboard', href: '/', icon: LayoutDashboard },
  { name: 'products', href: '/products', icon: Package },
  { name: 'customers', href: '/customers', icon: Users },
  { name: 'orders', href: '/orders', icon: ShoppingCart },
  // Removed: invoices, delivery
  { name: 'accounts', href: '/accounts', icon: Calculator },
  // Removed: oil
  { name: 'reports', href: '/reports', icon: BarChart3 },
  { name: 'organization', href: '/organization', icon: Building2 },
  { name: 'settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations('nav')
  const locale = pathname.split('/')[1]

  return (
    <aside className="w-64 border-r border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <h2 className="text-lg font-bold gradient-text">Business Manager</h2>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const href = `/${locale}${item.href}`
            const isActive = pathname === href || (item.href !== '/' && pathname.startsWith(href))
            
            return (
              <Link
                key={item.name}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {t(item.name)}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
