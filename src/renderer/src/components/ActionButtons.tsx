import type { JSX } from 'react'
import { useOverlayStore } from '../store/overlayStore'
import { buildInstruction, buildApiHistory } from '../lib/commands'

export function ActionButtons(): JSX.Element {
  const {
    currentResult,
    isLoading,
    messages,
    originalText,
    customCommands,
    setLoading,
    setError,
    replaceLastAssistantMessage,
  } = useOverlayStore()

  const handleInject = async (): Promise<void> => {
    if (!currentResult) return
    await window.api.injectText(currentResult)
  }

  const handleCopy = (): void => {
    if (!currentResult) return
    navigator.clipboard.writeText(currentResult)
  }

  const handleRegenerate = async (): Promise<void> => {
    if (!currentResult || isLoading || messages.length < 2) return

    const lastUserMsg = messages[messages.length - 2]
    if (lastUserMsg?.role !== 'user') return

    const historyBeforeLastPair = messages.slice(0, -2)
    const historyForApi = buildApiHistory(historyBeforeLastPair, customCommands)

    setLoading(true)
    try {
      const result = await window.api.transformText(
        originalText,
        buildInstruction(lastUserMsg.content, customCommands),
        historyForApi,
      )
      replaceLastAssistantMessage(result)
    } catch {
      setError('AI request failed. Check your API key.')
    }
  }

  if (!currentResult && !isLoading) return <></>

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/20 border-b border-white/[0.04]">
      <button
        onClick={handleInject}
        disabled={!currentResult || isLoading}
        className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-all"
      >
        Inject
      </button>
      <button
        onClick={handleCopy}
        disabled={!currentResult || isLoading}
        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-medium transition-all"
      >
        Copy
      </button>
      <button
        onClick={handleRegenerate}
        disabled={!currentResult || isLoading || messages.length < 2}
        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-medium transition-all"
      >
        Regenerate
      </button>
    </div>
  )
}
