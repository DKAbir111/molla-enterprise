import { create } from 'zustand'

type UIStore = {
  customerSearch: string
  setCustomerSearch: (q: string) => void
  addCustomerOpen: boolean
  setAddCustomerOpen: (v: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
}

export const useUI = create<UIStore>((set) => ({
  customerSearch: '',
  setCustomerSearch: (q) => set({ customerSearch: q }),
  addCustomerOpen: false,
  setAddCustomerOpen: (v) => set({ addCustomerOpen: v }),
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((prev) => ({ sidebarOpen: !prev.sidebarOpen })),
}))
