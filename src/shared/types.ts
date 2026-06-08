export type Command = '/fix' | '/rewrite' | '/shorten' | '/expand' | '/continue' | '/add emoji' | '/tone pro' | '/tone casual' | '/tone formal'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CustomCommand {
  id: string
  name: string    // without slash — "translate"
  value: string   // with slash — "/translate"
  prompt: string  // AI instruction
  createdAt: number
}

export interface AppConfig {
  groqApiKey?: string          // legacy plain text — kept only for migration
  groqApiKeyEncrypted?: string // safeStorage encrypted, base64
  hotkey: string
  customCommands?: CustomCommand[]
}
