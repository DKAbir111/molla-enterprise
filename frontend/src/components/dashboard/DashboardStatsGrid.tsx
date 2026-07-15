'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useLocale } from 'next-intl'

interface StatItem {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  positive?: boolean;
  toggle?: () => void;
  toggleIcon?: React.ElementType;
}

interface DashboardStatsGridProps {
  stats: StatItem[];
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  const t = useTranslations('dashboard')

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="flex items-center">
              {stat.toggle && stat.toggleIcon && (
                <button onClick={stat.toggle} className="mr-2">
                  <stat.toggleIcon className="h-4 w-4 text-subtle-foreground" />
                </button>
              )}
              <stat.icon className="h-4 w-4 text-subtle-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {typeof stat.change !== 'undefined' && typeof stat.positive !== 'undefined' && (
              <div className="flex items-center text-xs">
                {stat.positive ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-danger" />
                )}
                <span className={stat.positive ? 'text-success' : 'text-danger'}>
                  {stat.change}
                </span>
                <span className="text-subtle-foreground ml-1">{t('fromLastMonth')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
