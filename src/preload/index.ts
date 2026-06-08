import { contextBridge, ipcRenderer } from 'electron'
import type { ChatMessage, CustomCommand } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  transformText: (originalText: string, instruction: string, history: ChatMessage[]) =>
    ipcRenderer.invoke('ai:transform', originalText, instruction, history),

  captureText: () =>
    ipcRenderer.invoke('clipboard:capture'),

  injectText: (text: string) =>
    ipcRenderer.invoke('injection:inject', text),

  hideWindow: () =>
    ipcRenderer.send('window:hide'),

  getConfig: () =>
    ipcRenderer.invoke('config:get'),

  setApiKey: (key: string) =>
    ipcRenderer.invoke('config:setApiKey', key),

  onInit: (callback: (data: { text: string }) => void) => {
    ipcRenderer.on('overlay:init', (_event, data) => callback(data))
  },

  openExternal: (url: string) =>
    ipcRenderer.invoke('shell:openExternal', url),

  listCustomCommands: () =>
    ipcRenderer.invoke('commands:list'),

  saveCustomCommand: (cmd: CustomCommand) =>
    ipcRenderer.invoke('commands:save', cmd),

  deleteCustomCommand: (id: string) =>
    ipcRenderer.invoke('commands:delete', id),
})
