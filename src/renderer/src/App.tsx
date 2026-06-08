import { JSX, useEffect, useState } from 'react'
import { useOverlayStore } from './store/overlayStore'
import { CommandBar } from './components/CommandBar'
import { TextPreview } from './components/TextPreview'
import { ActionButtons } from './components/ActionButtons'
import { SettingsView } from './components/SettingsView'
import { MissingDepsView } from './components/MissingDepsView'
import { ArrowLeft, PenLine, Settings, Zap } from 'lucide-react'

type View = 'overlay' | 'settings' | 'missing-deps'

export default function App(): JSX.Element {
  const { setText, setCustomCommands, reset, setComposeMode, isComposeMode } = useOverlayStore()
  const [view, setView] = useState<View>('overlay')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    window.api.getConfig().then(({ hasApiKey, hasXdotool }) => {
      if (!hasXdotool) setView('missing-deps')
      else if (!hasApiKey) setView('settings')
      setReady(true)
    })

    window.api.listCustomCommands().then(setCustomCommands)

    window.api.onInit(({ text }) => {
      setView('overlay')
      if (text.trim()) {
        setText(text)
        setComposeMode(false)
      } else {
        reset()
        setComposeMode(true)
      }
    })

    window.api.onOpenSettings(() => setView('settings'))

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') window.api.hideWindow()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!ready) return <></>

  return (
    <div className="h-screen w-screen overflow-hidden p-3">
      <div className="h-full w-full rounded-2xl border border-white/[0.06] bg-slate-950 shadow-2xl overflow-hidden flex flex-col">

        {/* Header — always fixed at top */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap size={12} className="text-white" fill="white" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Flow Text AI</span>
          </div>
          <div className="flex items-center gap-1">
            {view === 'settings' && (
              <button
                onClick={() => setView('overlay')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                title="Back"
              >
                <ArrowLeft size={13} />
              </button>
            )}
            {view === 'overlay' && (
              <>
                <button
                  onClick={() => { reset(); setComposeMode(true) }}
                  title="Write from scratch"
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95',
                    isComposeMode
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-sm shadow-indigo-900/40',
                  ].join(' ')}
                >
                  <PenLine size={12} />
                  New
                </button>
                <button
                  onClick={() => setView('settings')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                  title="Settings"
                >
                  <Settings size={13} />
                </button>
              </>
            )}
            <button
              onClick={() => window.api.hideWindow()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all text-base leading-none"
              title="Close (Esc)"
            >
              ×
            </button>
          </div>
        </div>

        {/* Main content — scrollable, no horizontal bleed */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          {view === 'missing-deps' && <MissingDepsView />}
          {view === 'settings' && <SettingsView onSaved={() => setView('overlay')} />}
          {view === 'overlay' && <TextPreview />}
        </div>

        {/* Bottom bar — overlay only */}
        {view === 'overlay' && (
          <div className="border-t border-white/[0.06] shrink-0">
            <ActionButtons />
            <CommandBar />
          </div>
        )}

      </div>
    </div>
  )
}
