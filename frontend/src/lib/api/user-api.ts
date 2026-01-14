import { api } from './http'

export type TeamMemberRole = 'owner' | 'admin' | 'member'

export type TeamMember = {
  id: string
  name: string
  email: string
  role: TeamMemberRole
  createdAt: string
  lastLoginAt?: string | null
}

export type TeamMembersResponse = {
  currentUserId: string
  currentUserRole: TeamMemberRole
  members: TeamMember[]
}

export type CreateTeamMemberInput = {
  name: string
  email: string
  temporaryPassword: string
  role?: TeamMemberRole
}

export type UpdateTeamMemberInput = Partial<Pick<CreateTeamMemberInput, 'name' | 'role'>>

export async function listTeamMembers<T = TeamMembersResponse>(): Promise<T> {
  const res = await api.get<T>('/users/team')
  return res.data
}

export async function createTeamMember<T = TeamMember>(data: CreateTeamMemberInput): Promise<T> {
  const res = await api.post<T>('/users/team', data)
  return res.data
}

export async function updateTeamMember<T = TeamMember>(userId: string, data: UpdateTeamMemberInput): Promise<T> {
  const res = await api.patch<T>(`/users/team/${userId}`, data)
  return res.data
}

export async function deleteTeamMember(userId: string): Promise<{ ok: boolean }> {
  const res = await api.delete<{ ok: boolean }>(`/users/team/${userId}`)
  return res.data
}

export async function changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ ok: boolean }> {
  const res = await api.post<{ ok: boolean }>('/users/me/change-password', data)
  return res.data
}

export type LoginActivityEntry = {
  id: string
  ipAddress?: string | null
  userAgent?: string | null
  deviceLabel?: string | null
  location?: string | null
  createdAt: string
  lastSeenAt: string
}

export async function fetchLoginActivity(limit = 20): Promise<LoginActivityEntry[]> {
  const res = await api.get<LoginActivityEntry[]>('/users/me/login-activity', { params: { limit } })
  return res.data
}
