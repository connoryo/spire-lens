import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('animate-spin rounded-full border-2 border-text-muted border-t-accent-gold', className)} />
  )
}
