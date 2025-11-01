import { create } from 'zustand'

type UIStore = {
  customerSearch: string
  setCustomerSearch: (q: string) => void
  addCustomerOpen: boolean
  setAddCustomerOpen: (v: boolean) => void
}

export const useUI = create<UIStore>((set) => ({
  customerSearch: '',
  setCustomerSearch: (q) => set({ customerSearch: q }),
  addCustomerOpen: false,
  setAddCustomerOpen: (v) => set({ addCustomerOpen: v }),
}))

