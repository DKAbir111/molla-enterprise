import { create } from 'zustand'

export type Theme = 'default' | 'dark' | 'contrast'

type ThemeStore = {
  theme: Theme
  setTheme: (t: Theme) => void
}

const THEME_KEY = 'bm_theme'

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.classList.remove('theme-default', 'theme-dark', 'theme-contrast')
  el.classList.add(`theme-${theme}`)
}

export const useTheme = create<ThemeStore>((set) => ({
  theme: (typeof window !== 'undefined' && (window.localStorage?.getItem(THEME_KEY) as Theme)) || 'default',
  setTheme: (t) => {
    try { window.localStorage?.setItem(THEME_KEY, t) } catch {}
    applyTheme(t)
    set({ theme: t })
  },
}))

// Ensure initial application on client
if (typeof window !== 'undefined') {
  const saved = (window.localStorage?.getItem(THEME_KEY) as Theme) || 'default'
  applyTheme(saved)
}

