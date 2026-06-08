import { create } from 'zustand'
import type { Command, ChatMessage, CustomCommand } from '../../../shared/types'

interface OverlayState {
  originalText: string
  messages: ChatMessage[]
  currentResult: string | null
  activeCommand: Command | null
  isLoading: boolean
  error: string | null
  customCommands: CustomCommand[]

  setText: (text: string) => void
  addMessage: (msg: ChatMessage) => void
  replaceLastAssistantMessage: (content: string) => void
  setCurrentResult: (result: string | null) => void
  setActiveCommand: (cmd: Command | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void

  setCustomCommands: (commands: CustomCommand[]) => void
  addOrUpdateCustomCommand: (cmd: CustomCommand) => void
  removeCustomCommand: (id: string) => void
}

export const useOverlayStore = create<OverlayState>((set) => ({
  originalText: '',
  messages: [],
  currentResult: null,
  activeCommand: null,
  isLoading: false,
  error: null,
  customCommands: [],

  setText: (text) =>
    set({ originalText: text, messages: [], currentResult: null, error: null, activeCommand: null }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
      ...(msg.role === 'assistant'
        ? { currentResult: msg.content, isLoading: false, error: null }
        : {}),
    })),

  replaceLastAssistantMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages]
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
        msgs[msgs.length - 1] = { role: 'assistant', content }
      }
      return { messages: msgs, currentResult: content, isLoading: false, error: null }
    }),

  setCurrentResult: (currentResult) => set({ currentResult }),
  setActiveCommand: (activeCommand) => set({ activeCommand }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  reset: () =>
    set({ originalText: '', messages: [], currentResult: null, activeCommand: null, isLoading: false, error: null }),

  setCustomCommands: (customCommands) => set({ customCommands }),
  addOrUpdateCustomCommand: (cmd) =>
    set((state) => {
      const idx = state.customCommands.findIndex((c) => c.id === cmd.id)
      const updated = [...state.customCommands]
      if (idx >= 0) updated[idx] = cmd
      else updated.push(cmd)
      return { customCommands: updated }
    }),
  removeCustomCommand: (id) =>
    set((state) => ({ customCommands: state.customCommands.filter((c) => c.id !== id) })),
}))
