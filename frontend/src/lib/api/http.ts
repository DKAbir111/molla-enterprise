import axios from 'axios'

const isBrowser = typeof window !== 'undefined'
const TOKEN_KEY = 'bm_token'

export function getAuthToken(): string | null {
  try {
    if (isBrowser && window.localStorage) {
      const t = window.localStorage.getItem(TOKEN_KEY)
      if (t) return t
    }
    if (isBrowser && typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )' + TOKEN_KEY + '=([^;]+)'))
      return match ? decodeURIComponent(match[2]) : null
    }
  } catch { }
  return null
}

export function setAuthToken(token: string | null) {
  try {
    if (!isBrowser) return
    if (token) {
      window.localStorage?.setItem(TOKEN_KEY, token)
      document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=2592000`
    } else {
      window.localStorage?.removeItem(TOKEN_KEY)
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`
    }
  } catch { }
}

export function clearAuthToken() {
  setAuthToken(null)
}

const baseURL = process.env.NEXT_PUBLIC_API_URL

export const api = axios.create({
  baseURL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // A 401 means the token is gone or expired (they last 7d). Without this the
    // stale token stays in storage, every later request fails, and the user is
    // stranded on a silently broken screen with no way back to login.
    //
    // Only act when a token actually existed: a logged-out visitor also gets
    // 401s, and telling them their "session expired" would be a lie. Let
    // AppShell's own no-token redirect handle that case.
    if (err?.response?.status === 401 && isBrowser && getAuthToken()) {
      const onAuthPage = /\/(login|register|forgot-password|reset-password)(\/|$|\?)/.test(
        window.location.pathname,
      )
      if (!onAuthPage) {
        clearAuthToken()
        // Preserve where they were so login can send them back.
        const from = encodeURIComponent(window.location.pathname + window.location.search)
        const locale = window.location.pathname.split('/')[1] || 'en'
        window.location.replace(`/${locale}/login?session=expired&from=${from}`)
      }
    }
    return Promise.reject(err)
  },
)

export type ApiError = {
  status?: number
  message?: string
  data?: any
}

export function toNumber(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') return parseFloat(v)
  return Number(v ?? 0)
}

