import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CHARACTER_COLORS: Record<string, string> = {
  Ironclad: '#c94040',
  Silent: '#4caf7a',
  Defect: '#4a7fc1',
  Watcher: '#8b5cf6',
  Regent: '#c9a84c',
  Necrobinder: '#9e95b0',
}

export function characterColor(name: string): string {
  return CHARACTER_COLORS[name] ?? '#9e95b0'
}
