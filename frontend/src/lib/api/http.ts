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
  } catch {}
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
  } catch {}
}

export function clearAuthToken() {
  setAuthToken(null)
}

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

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
    if (err?.response?.status === 401) {
      // Optionally clear on unauthorized
      // clearAuthToken()
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

