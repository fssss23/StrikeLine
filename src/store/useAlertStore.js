import { create } from 'zustand'
import { mockAlertHistory } from '../data/mockData'

export const useAlertStore = create((set) => ({
  alertHistory: mockAlertHistory,
  activeAlerts: mockAlertHistory.filter(a => !a.read).length,
  addAlertEvent: (alert) => set((state) => {
    const newHistory = [{...alert, id: Date.now(), read: false}, ...state.alertHistory];
    return {
      alertHistory: newHistory,
      activeAlerts: newHistory.filter(a => !a.read).length
    }
  }),
  markAsRead: (id) => set((state) => {
    const newHistory = state.alertHistory.map(a => a.id === id ? { ...a, read: true } : a);
    return {
      alertHistory: newHistory,
      activeAlerts: newHistory.filter(a => !a.read).length
    }
  })
}))
