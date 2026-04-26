import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Scroll, BarChart3, RefreshCw, Settings, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useData } from '@/lib/dataStore'
import { useSettings } from '@/lib/settings'

const navItems = [
  { to: '/', label: 'Runs', icon: Scroll, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cards', label: 'Card Stats', icon: BarChart3 },
]

export function Sidebar() {
  const { reload, loading } = useData()
  const { settings } = useSettings()
  const [collapsed, setCollapsed] = useState(false)

  // Text label that fades in/out while the icon stays perfectly still.
  // overflow-hidden on the aside clips it once the sidebar is narrow enough.
  const labelCls = cn(
    'whitespace-nowrap transition-opacity duration-150',
    collapsed ? 'opacity-0' : 'opacity-100',
  )

  return (
    <aside className={cn(
      'bg-bg-secondary border-r border-border-default flex flex-col shrink-0',
      'overflow-hidden transition-[width] duration-200',
      collapsed ? 'w-12' : 'w-52',
    )}>
      {/* Nav — padding/gap never changes, so icons never move */}
      <nav className="flex-1 p-2 pt-3 flex flex-col gap-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-accent-gold/10 text-accent-gold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
              )
            }
          >
            <Icon size={16} className="shrink-0" />
            <span className={labelCls}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Reload + Settings + Collapse */}
      <div className="p-2 border-t border-border-default flex flex-col gap-0.5">
        <button
          onClick={reload}
          disabled={loading}
          title={collapsed ? 'Reload Data' : undefined}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={cn('shrink-0', loading && 'animate-spin')} />
          <span className={labelCls}>Reload Data</span>
        </button>

        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-accent-gold/10 text-accent-gold'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
            )
          }
        >
          <Settings size={14} className="shrink-0" />
          <span className={labelCls}>Settings</span>
          {settings.customSavePath && (
            <span
              className={cn('w-1.5 h-1.5 rounded-full bg-accent-gold transition-opacity duration-150 ml-auto', collapsed && 'opacity-0')}
              title="Custom save path active"
            />
          )}
        </NavLink>

        {/* Collapse button — chevron rotates in place, no layout change */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand menu' : undefined}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-sm text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <ChevronLeft
            size={14}
            className={cn('shrink-0 transition-transform duration-200', collapsed && 'rotate-180')}
          />
          <span className={labelCls}>Collapse menu</span>
        </button>
      </div>
    </aside>
  )
}
