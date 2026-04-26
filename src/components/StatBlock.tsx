import { cn } from '@/lib/utils'

interface StatBlockProps {
  label: string
  value: string | number
  sub?: string
  className?: string
  valueClassName?: string
}

export function StatBlock({ label, value, sub, className, valueClassName }: StatBlockProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="text-xs text-text-muted uppercase tracking-wide">{label}</span>
      <span className={cn('text-lg font-semibold text-text-primary', valueClassName)}>{value}</span>
      {sub && <span className="text-xs text-text-secondary">{sub}</span>}
    </div>
  )
}
