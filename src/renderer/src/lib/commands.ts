import type { Command, CustomCommand } from '../../../shared/types'

export const COMMAND_DESCRIPTIONS: Record<Command, string> = {
  '/fix': 'Correct the spelling, grammar, and punctuation.',
  '/rewrite': 'Rewrite to make it clearer and more natural.',
  '/shorten': 'Shorten while preserving the core meaning.',
  '/expand': 'Expand with more detail, context, or examples.',
  '/continue': 'Continue naturally; include the original text followed by the continuation.',
  '/add emoji': 'Add relevant emojis throughout to make it more expressive.',
  '/tone pro': 'Rewrite with a professional, business-appropriate tone.',
  '/tone casual': 'Rewrite with a casual, friendly, conversational tone.',
  '/tone formal': 'Rewrite with a formal, polished, academic tone.',
}

export function detectCommand(input: string): Command | null {
  const lower = input.trim().toLowerCase()
  for (const cmd of Object.keys(COMMAND_DESCRIPTIONS) as Command[]) {
    if (lower === cmd || lower.startsWith(cmd + ' ')) return cmd
  }
  return null
}

export function buildInstruction(input: string, customCommands?: CustomCommand[]): string {
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()

  for (const cmd of Object.keys(COMMAND_DESCRIPTIONS) as Command[]) {
    if (lower === cmd) return COMMAND_DESCRIPTIONS[cmd]
    if (lower.startsWith(cmd + ' ')) {
      const extra = trimmed.slice(cmd.length).trim()
      return `${COMMAND_DESCRIPTIONS[cmd]} Additionally: ${extra}`
    }
  }

  if (customCommands) {
    for (const cc of customCommands) {
      const ccValue = cc.value.toLowerCase()
      if (lower === ccValue) return cc.prompt
      if (lower.startsWith(ccValue + ' ')) {
        const extra = trimmed.slice(cc.value.length).trim()
        return `${cc.prompt} Additionally: ${extra}`
      }
    }
  }

  return trimmed
}

export function buildApiHistory(
  messages: { role: 'user' | 'assistant'; content: string }[],
  customCommands?: CustomCommand[]
): { role: 'user' | 'assistant'; content: string }[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.role === 'user' ? buildInstruction(m.content, customCommands) : m.content,
  }))
}
