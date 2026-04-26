import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'gold' | 'red' | 'green' | 'blue' | 'purple' | 'muted'
  className?: string
}

const variants = {
  default: 'bg-bg-card text-text-secondary border border-border-default',
  gold: 'bg-accent-gold/10 text-accent-gold border border-accent-gold/30',
  red: 'bg-accent-red/10 text-accent-red border border-accent-red/30',
  green: 'bg-accent-green/10 text-accent-green border border-accent-green/30',
  blue: 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30',
  purple: 'bg-accent-purple/10 text-accent-purple border border-accent-purple/30',
  muted: 'bg-bg-secondary text-text-muted border border-border-default',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
