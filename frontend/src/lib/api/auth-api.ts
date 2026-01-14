import { api, setAuthToken } from './http'

export type AuthUser = {
  id: string
  email: string
  name: string
  organizationId?: string | null
  role?: 'owner' | 'admin' | 'member'
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string | null
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

export async function register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', data)
  setAuthToken(res.data.token)
  return res.data
}

export async function login(data: { email: string; password: string }): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login', data)
  setAuthToken(res.data.token)
  return res.data
}

export async function forgotPassword(data: { email: string }): Promise<{ ok: boolean; token?: string }> {
  const res = await api.post('/auth/forgot-password', data)
  return res.data
}

export async function resetPassword(data: { token: string; newPassword: string }): Promise<{ ok: boolean }> {
  const res = await api.post('/auth/reset-password', data)
  return res.data
}

export function logout() {
  setAuthToken(null)
}
