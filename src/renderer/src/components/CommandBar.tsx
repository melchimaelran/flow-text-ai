import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { useOverlayStore } from '../store/overlayStore'
import type { Command } from '../../../shared/types'
import { detectCommand, buildInstruction, buildApiHistory } from '../lib/commands'

/* ─── Built-in command registry ─────────────────────────────────────────── */

const ALL_BUILTIN: { value: Command; description: string }[] = [
  { value: '/fix',         description: 'Correct grammar & spelling' },
  { value: '/rewrite',     description: 'Rewrite naturally' },
  { value: '/shorten',     description: 'Make it shorter' },
  { value: '/expand',      description: 'Expand with more detail' },
  { value: '/continue',    description: 'Continue the text' },
  { value: '/add emoji',   description: 'Add emojis' },
  { value: '/tone pro',    description: 'Professional tone' },
  { value: '/tone casual', description: 'Casual friendly tone' },
  { value: '/tone formal', description: 'Formal academic tone' },
]

const GROUPS: { label: string; commands: { label: string; value: Command }[] }[] = [
  {
    label: 'Edit',
    commands: [
      { label: '/fix',       value: '/fix' },
      { label: '/rewrite',   value: '/rewrite' },
      { label: '/shorten',   value: '/shorten' },
      { label: '/expand',    value: '/expand' },
      { label: '/continue',  value: '/continue' },
      { label: '/add emoji', value: '/add emoji' },
    ],
  },
  {
    label: 'Tone',
    commands: [
      { label: 'pro',    value: '/tone pro' },
      { label: 'casual', value: '/tone casual' },
      { label: 'formal', value: '/tone formal' },
    ],
  },
]

interface Suggestion {
  value: string
  description: string
  isCustom: boolean
}

/* ─── Suggestion filter ─────────────────────────────────────────────────── */

function getSuggestions(value: string, customCmds: Suggestion[]): Suggestion[] {
  if (!value.startsWith('/')) return []
  const query = value.toLowerCase().trim()

  const all: Suggestion[] = [
    ...ALL_BUILTIN.map((c) => ({ ...c, isCustom: false })),
    ...customCmds,
  ]

  for (const cmd of all) {
    if (query === cmd.value || query.startsWith(cmd.value + ' ')) return []
  }

  if (query === '/') return all
  return all.filter((cmd) => cmd.value.startsWith(query))
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function CommandBar(): JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    originalText,
    messages,
    isLoading,
    activeCommand,
    customCommands,
    setActiveCommand,
    setLoading,
    setError,
    addMessage,
  } = useOverlayStore()

  const customSuggestions = useMemo<Suggestion[]>(
    () => customCommands.map((cc) => ({ value: cc.value, description: cc.prompt, isCustom: true })),
    [customCommands]
  )

  const hasText = originalText.trim().length > 0
  const suggestions = useMemo(() => getSuggestions(inputValue, customSuggestions), [inputValue, customSuggestions])

  useEffect(() => { setSuggestionIndex(0) }, [suggestions.length])

  useEffect(() => {
    if (hasText) inputRef.current?.focus()
  }, [originalText]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Handlers ────────────────────────────────────────────────────────── */

  const selectSuggestion = (value: string): void => {
    setInputValue(value + ' ')
    setSuggestionIndex(0)
    inputRef.current?.focus()
  }

  const handleCommandClick = (cmd: Command): void => {
    setInputValue(cmd + ' ')
    inputRef.current?.focus()
  }

  const handleSubmit = async (): Promise<void> => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading || !hasText) return

    const command = detectCommand(trimmed)
    const expandedInstruction = buildInstruction(trimmed, customCommands)
    const historyForApi = buildApiHistory(messages, customCommands)

    setActiveCommand(command)
    setLoading(true)
    setInputValue('')
    addMessage({ role: 'user', content: trimmed })

    try {
      const result = await window.api.transformText(originalText, expandedInstruction, historyForApi)
      addMessage({ role: 'assistant', content: result })
    } catch {
      setError('AI request failed. Check your API key.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSuggestionIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectSuggestion(suggestions[suggestionIndex]?.value ?? suggestions[0].value)
        return
      }
      if (e.key === 'Escape') {
        setInputValue('')
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const btnClass = (value: Command): string =>
    [
      'px-3 py-1 rounded-full text-xs font-mono font-medium transition-all',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      activeCommand === value
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200',
    ].join(' ')

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col gap-2 px-4 pt-2 pb-3 bg-slate-900/40">

      {/* Quick-access command buttons */}
      {GROUPS.map((group) => (
        <div key={group.label} className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-600 w-10 shrink-0">
            {group.label}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {group.commands.map((cmd) => (
              <button
                key={cmd.value}
                onClick={() => handleCommandClick(cmd.value)}
                disabled={isLoading || !hasText}
                className={btnClass(cmd.value)}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Custom command quick buttons (if any) */}
      {customCommands.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-600 w-10 shrink-0">
            Mine
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {customCommands.map((cc) => (
              <button
                key={cc.id}
                onClick={() => { setInputValue(cc.value + ' '); inputRef.current?.focus() }}
                disabled={isLoading || !hasText}
                className="px-3 py-1 rounded-full text-xs font-mono font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white/5 text-violet-400 hover:bg-white/10 hover:text-violet-300"
              >
                {cc.value}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input row with slash-command dropdown */}
      <div className="relative flex items-center gap-2 mt-0.5">

        {/* Slash-command autocomplete */}
        {suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 right-9 mb-2 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
            {suggestions.map((cmd, i) => (
              <button
                key={cmd.value}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(cmd.value) }}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2 transition-colors border-l-2',
                  i === suggestionIndex
                    ? 'bg-indigo-600/20 border-indigo-500'
                    : 'border-transparent hover:bg-white/5',
                ].join(' ')}
              >
                <span className={`font-mono text-xs shrink-0 w-24 truncate ${cmd.isCustom ? 'text-violet-400' : 'text-indigo-400'}`}>
                  {cmd.value}
                </span>
                <span className="text-xs text-slate-500 truncate flex-1">{cmd.description}</span>
                {cmd.isCustom && (
                  <span className="text-[9px] text-slate-600 shrink-0 px-1 py-0.5 rounded bg-violet-500/10 text-violet-500">
                    custom
                  </span>
                )}
                {i === suggestionIndex && (
                  <span className="text-[10px] text-slate-600 shrink-0 ml-auto">↵</span>
                )}
              </button>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || !hasText}
          placeholder={
            messages.length > 0
              ? 'Refine further, or type / for commands…'
              : 'Type / for commands, or click one above…'
          }
          className="flex-1 bg-slate-800/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/50 transition-colors font-mono disabled:opacity-40"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !inputValue.trim() || !hasText}
          title="Send (Enter)"
          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shrink-0"
        >
          <Send size={12} />
        </button>
      </div>

    </div>
  )
}
