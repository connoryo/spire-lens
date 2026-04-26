import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface TooltipProps {
  text?: string
  content?: React.ReactNode
  children: React.ReactNode
  className?: string
  side?: 'top' | 'left' | 'right'
  maxWidth?: number
}

type ActualSide = 'top' | 'bottom' | 'left' | 'right'

interface Placement {
  // Raw unclamped position from computePlacement — used as the measurement baseline
  style: React.CSSProperties
  side: ActualSide
}

const GAP = 10

function computePlacement(r: DOMRect, preferred: 'top' | 'left' | 'right', maxWidth: number): Placement {
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (preferred === 'left' || preferred === 'right') {
    // For 'left': prefer left, flip to right when there isn't room.
    // For 'right': prefer right, flip to left when there isn't room.
    const fitsRight = r.right + GAP + maxWidth <= vw - GAP
    const fitsLeft  = r.left  - GAP >= maxWidth + GAP
    const actualSide: ActualSide =
      preferred === 'right'
        ? (fitsRight ? 'right' : 'left')
        : (fitsLeft  ? 'left'  : 'right')
    const centerY = r.top + r.height / 2
    return {
      style: actualSide === 'left'
        ? { top: centerY, right: vw - r.left + GAP, transform: 'translateY(-50%)', maxWidth }
        : { top: centerY, left: r.right  + GAP,     transform: 'translateY(-50%)', maxWidth },
      side: actualSide,
    }
  } else {
    const centerX = r.left + r.width / 2
    const left = Math.max(maxWidth / 2 + GAP, Math.min(centerX, vw - maxWidth / 2 - GAP))
    const actualSide: ActualSide = r.top - GAP >= 200 ? 'top' : 'bottom'
    return {
      style: actualSide === 'top'
        ? { top: r.top    - GAP, left, transform: 'translateX(-50%) translateY(-100%)', maxWidth }
        : { top: r.bottom + GAP, left, transform: 'translateX(-50%)',                   maxWidth },
      side: actualSide,
    }
  }
}

const ARROW: Record<ActualSide, string> = {
  left:   'absolute left-full  top-1/2 -translate-y-1/2 border-4 border-transparent border-l-border-default',
  right:  'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-border-default',
  top:    'absolute top-full   left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border-default',
  bottom: 'absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-border-default',
}

// ── TooltipPopup ──────────────────────────────────────────────────────────────
//
// Two-phase rendering to keep the tooltip inside the viewport without ever
// mutating the DOM directly (direct mutation gets overwritten by React on the
// next reconciliation, which is exactly what causes the off-screen flicker).
//
// Phase 1 — when `placement` changes, apply the unclamped position with
//            visibility:hidden so the element is in the DOM but not visible.
//
// Phase 2 — after React commits phase-1's style to the DOM, measure the actual
//            bounding rect and compute any needed correction, then set the final
//            visible style as React state.  Both phases complete before the
//            browser gets a chance to paint, so the user only ever sees the
//            final corrected position.

function TooltipPopup({ placement, body }: { placement: Placement; body: React.ReactNode }) {
  const popupRef = useRef<HTMLDivElement>(null)

  // `displayStyle` is what we actually hand to React — starts hidden so we can
  // measure without the user seeing the unclamped position.
  const [displayStyle, setDisplayStyle] = useState<React.CSSProperties>(
    () => ({ ...placement.style, visibility: 'hidden' as const })
  )

  // Phase 1 — reset to the new placement (hidden) whenever placement changes.
  useLayoutEffect(() => {
    setDisplayStyle({ ...placement.style, visibility: 'hidden' as const })
  }, [placement])

  // Phase 2 — after `displayStyle` is committed to the DOM, measure and clamp.
  // The visibility check gates this so it only runs on the hidden phase, not
  // again after we've already revealed the corrected position.
  useLayoutEffect(() => {
    const el = popupRef.current
    if (!el || el.style.visibility !== 'hidden') return

    const rect = el.getBoundingClientRect()
    const vh   = window.innerHeight
    const vw   = window.innerWidth

    // Vertical correction
    let topDelta = 0
    if (rect.bottom > vh - GAP) topDelta = rect.bottom - (vh - GAP)
    if (rect.top    < GAP)      topDelta = rect.top    -       GAP   // negative → shift down

    // Horizontal correction (e.g. right-side tooltip near screen edge)
    let leftDelta = 0
    if (typeof placement.style.left === 'number') {
      if (rect.right > vw - GAP) leftDelta = rect.right - (vw - GAP)
      if (rect.left  < GAP)      leftDelta = rect.left  -       GAP
    }

    const baseTop  = typeof placement.style.top  === 'number' ? placement.style.top  : parseFloat(String(placement.style.top  ?? 0))
    const baseLeft = typeof placement.style.left === 'number' ? placement.style.left : parseFloat(String(placement.style.left ?? 0))

    const corrected: React.CSSProperties = { ...placement.style, visibility: 'visible' as const }
    if (Math.abs(topDelta)  > 0.5) corrected.top  = baseTop  - topDelta
    if (Math.abs(leftDelta) > 0.5) corrected.left = baseLeft - leftDelta

    setDisplayStyle(corrected)
  }, [displayStyle, placement])

  return createPortal(
    <div
      ref={popupRef}
      className={cn(
        'fixed z-[9999] rounded-md text-xs text-text-primary',
        'bg-bg-card border border-border-default shadow-xl pointer-events-none',
        'whitespace-normal leading-snug overflow-hidden',
      )}
      style={displayStyle}
    >
      {body}
      <span className={ARROW[placement.side]} />
    </div>,
    document.body,
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

export function Tooltip({
  text,
  content,
  children,
  className,
  side = 'top',
  maxWidth = 240,
}: TooltipProps) {
  const body = content ?? text
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)

  const show = useCallback(() => {
    const el = anchorRef.current
    if (!el || !body) return
    setPlacement(computePlacement(el.getBoundingClientRect(), side, maxWidth))
  }, [body, side, maxWidth])

  const hide = useCallback(() => setPlacement(null), [])

  useEffect(() => {
    if (!placement) return
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [placement, hide])

  if (!body) return <>{children}</>

  return (
    <span
      ref={anchorRef}
      className={cn('inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {placement && <TooltipPopup placement={placement} body={body} />}
    </span>
  )
}
