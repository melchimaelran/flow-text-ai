import type { JSX } from 'react'
import { useEffect, useRef } from 'react'
import { Zap } from 'lucide-react'
import { useOverlayStore } from '../store/overlayStore'

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
  const { originalText, messages, isLoading, error } = useOverlayStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isLoading])

  const hasText = originalText.trim().length > 0

  if (!hasText) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center min-h-[180px]">
        <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center">
          <Zap size={18} className="text-slate-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">No text captured yet</p>
          <p className="text-xs text-slate-600 mt-1">Use your hotkey to capture text from any app</p>
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
          /* User instruction chip — right aligned, smaller */
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
