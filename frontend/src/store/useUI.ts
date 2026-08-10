import { create } from 'zustand'

type UIStore = {
  customerSearch: string
  setCustomerSearch: (q: string) => void
  addCustomerOpen: boolean
  setAddCustomerOpen: (v: boolean) => void
}

// The mobile slide-out drawer state that used to live here is gone: phones now
// navigate through the bottom tab bar (BottomNav), which owns its own open
// state for the "More" sheet, and desktop renders a permanent sidebar.
export const useUI = create<UIStore>((set) => ({
  customerSearch: '',
  setCustomerSearch: (q) => set({ customerSearch: q }),
  addCustomerOpen: false,
  setAddCustomerOpen: (v) => set({ addCustomerOpen: v }),
}))
