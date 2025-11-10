import { create } from 'zustand'
import { getMyOrganization } from '@/lib/api/organization-api'
import type { Organization } from '@/types'

type OrgState = {
  organization: Organization | null | undefined
  loading: boolean
  error: string | null
  fetchOrganization: (opts?: { force?: boolean }) => Promise<Organization | null>
  setOrganization: (org: Organization | null) => void
  clearOrganization: () => void
}

let inflight: Promise<Organization | null> | null = null

export const useOrganizationStore = create<OrgState>((set, get) => ({
  organization: undefined,
  loading: false,
  error: null,
  fetchOrganization: async ({ force } = {}) => {
    const state = get()
    if (!force && state.organization !== undefined) {
      return state.organization
    }
    if (!force && inflight) {
      return inflight
    }
    const request = getMyOrganization<Organization | null>()
      .then((org) => {
        set({ organization: org ?? null, loading: false, error: null })
        return org ?? null
      })
      .catch((err) => {
        set({
          error: err?.message ?? 'Failed to load organization',
          loading: false,
        })
        throw err
      })
      .finally(() => {
        inflight = null
      })
    inflight = request
    set({ loading: true })
    return request
  },
  setOrganization: (org) => {
    inflight = null
    set({ organization: org ?? null, loading: false, error: null })
  },
  clearOrganization: () => {
    inflight = null
    set({ organization: null, loading: false, error: null })
  },
}))
