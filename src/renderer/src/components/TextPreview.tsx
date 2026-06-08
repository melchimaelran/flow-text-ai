import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, PenLine, Zap } from 'lucide-react'
import { useOverlayStore } from '../store/overlayStore'
import { MicButton } from './MicButton'

function AiBubble({ content }: { content: string }): JSX.Element {
  return (
    <div className="flex flex-col items-start gap-1.5 min-w-0">
      <div className="flex items-center gap-1.5 ml-1">
        <div className="w-4 h-4 rounded-md bg-indigo-600 flex items-center justify-center shrink-0">
          <Zap size={8} className="text-white" fill="white" />
        </div>
        <span className="text-[10px] text-slate-600 uppercase tracking-widest">Flow AI</span>
      </div>
      <div className="max-w-[88%] bg-gradient-to-br from-indigo-950/50 to-slate-900/80 border border-indigo-500/10 rounded-2xl rounded-tl-sm px-4 py-3 overflow-hidden">
        <p className="text-sm text-white leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{content}</p>
      </div>
    </div>
  )
}

function LoadingBubble(): JSX.Element {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-1.5 ml-1">
        <div className="w-4 h-4 rounded-md bg-indigo-600 flex items-center justify-center">
          <Zap size={8} className="text-white" fill="white" />
        </div>
        <span className="text-[10px] text-slate-600 uppercase tracking-widest">Flow AI</span>
      </div>
      <div className="bg-gradient-to-br from-indigo-950/50 to-slate-900/80 border border-indigo-500/10 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

export function TextPreview(): JSX.Element {
  const {
    originalText,
    messages,
    isLoading,
    error,
    isComposeMode,
    composeDraft,
    setComposeDraft,
    setText,
    setComposeMode,
    reset,
  } = useOverlayStore()

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [micError, setMicError] = useState<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isLoading])

  useEffect(() => {
    if (isComposeMode && !originalText.trim()) {
      textareaRef.current?.focus()
    }
  }, [isComposeMode, originalText])

  const confirmText = (): void => {
    if (!composeDraft.trim()) return
    setText(composeDraft.trim())
    setComposeMode(false)
  }

  // Compose mode: show textarea input
  if (isComposeMode && !originalText.trim()) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest">
          <PenLine size={11} />
          Write your text
        </div>
        <textarea
          ref={textareaRef}
          value={composeDraft}
          onChange={(e) => setComposeDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              confirmText()
            }
          }}
          placeholder="Type or paste your text here…"
          rows={6}
          className="w-full bg-slate-800/40 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500/30 transition-colors resize-none leading-relaxed"
        />
        {micError && (
          <p className="text-[11px] text-red-400">{micError}</p>
        )}
        <div className="flex items-center gap-2">
          <MicButton
            onTranscript={(text) => { setComposeDraft(composeDraft ? composeDraft + ' ' + text : text); setMicError(null) }}
            onError={setMicError}
          />
          <span className="flex-1 text-[10px] text-slate-600 text-center">Ctrl+Enter · or click a command below</span>
          <button
            onClick={confirmText}
            disabled={!composeDraft.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-all"
          >
            Confirm <ArrowRight size={11} />
          </button>
        </div>
      </div>
    )
  }

  const hasText = originalText.trim().length > 0

  if (!hasText) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-5 min-h-[280px]">

        {/* Write from scratch — primary CTA */}
        <button
          onClick={() => { reset(); setComposeMode(true) }}
          className="group w-full flex flex-col items-center gap-3 px-6 py-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60 active:scale-[0.98] transition-all duration-150"
        >
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <PenLine size={20} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Write from scratch</p>
            <p className="text-xs text-white/60 mt-0.5">Type any text and apply AI commands</p>
          </div>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-white/[0.05]" />
          <span className="text-[10px] text-slate-700 uppercase tracking-widest">or use hotkey</span>
          <div className="flex-1 h-px bg-white/[0.05]" />
        </div>

        {/* Hotkey capture — secondary hint */}
        <div className="flex items-center gap-2.5 text-slate-600">
          <Zap size={13} />
          <p className="text-xs">Select text in any app, then press your hotkey</p>
        </div>

      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-x-hidden min-w-0">

      {/* Original captured text */}
      <div className="flex flex-col items-end gap-1.5 min-w-0">
        <span className="text-[10px] text-slate-600 uppercase tracking-widest mr-1">You</span>
        <div className="max-w-[88%] bg-slate-800/70 rounded-2xl rounded-tr-sm px-4 py-3 overflow-hidden">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
            {originalText}
          </p>
        </div>
      </div>

      {/* If no conversation yet, show the AI placeholder */}
      {messages.length === 0 && !isLoading && (
        <AiBubble content="Select a command below to transform your text" />
      )}

      {/* Conversation history */}
      {messages.map((msg, i) =>
        msg.role === 'user' ? (
          <div key={i} className="flex justify-end min-w-0">
            <div className="max-w-[80%] bg-slate-700/40 border border-white/[0.06] rounded-xl px-3 py-1.5 overflow-hidden">
              <p className="text-xs text-slate-400 font-mono [overflow-wrap:anywhere]">{msg.content}</p>
            </div>
          </div>
        ) : (
          <AiBubble key={i} content={msg.content} />
        )
      )}

      {isLoading && <LoadingBubble />}

      {error && (
        <div className="flex justify-center">
          <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
