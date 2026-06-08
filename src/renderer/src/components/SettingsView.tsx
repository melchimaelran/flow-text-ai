import type { JSX } from 'react'
import { useState } from 'react'
import { Trash2, Plus, Info } from 'lucide-react'
import { useOverlayStore } from '../store/overlayStore'
import type { CustomCommand } from '../../../shared/types'

interface Props {
  onSaved: () => void
}

export function SettingsView({ onSaved }: Props): JSX.Element {
  const [tab, setTab] = useState<'apikey' | 'commands'>('apikey')

  /* ── API Key tab state ─────────────────────────────────────────────── */
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [keyError, setKeyError] = useState('')

  /* ── My Commands tab state ─────────────────────────────────────────── */
  const { customCommands, addOrUpdateCustomCommand, removeCustomCommand } = useOverlayStore()
  const [cmdName, setCmdName] = useState('')
  const [cmdPrompt, setCmdPrompt] = useState('')
  const [cmdError, setCmdError] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)

  /* ── Handlers ──────────────────────────────────────────────────────── */

  const handleSaveKey = async (): Promise<void> => {
    const trimmed = key.trim()
    if (!trimmed.startsWith('gsk_') || trimmed.length < 20) {
      setKeyError('Invalid key — must start with gsk_')
      return
    }
    setSaving(true)
    await window.api.setApiKey(trimmed)
    onSaved()
  }

  const handleAddCommand = async (): Promise<void> => {
    const name = cmdName.trim().replace(/^\/+/, '')
    const prompt = cmdPrompt.trim()
    if (!name) { setCmdError('Command name is required'); return }
    if (!prompt) { setCmdError('Instruction is required'); return }
    if (customCommands.some((c) => c.name === name)) {
      setCmdError(`"/${name}" already exists`)
      return
    }
    const cmd: CustomCommand = {
      id: Date.now().toString(),
      name,
      value: `/${name}`,
      prompt,
      createdAt: Date.now(),
    }
    await window.api.saveCustomCommand(cmd)
    addOrUpdateCustomCommand(cmd)
    setCmdName('')
    setCmdPrompt('')
    setCmdError('')
  }

  const handleDelete = async (id: string): Promise<void> => {
    await window.api.deleteCustomCommand(id)
    removeCustomCommand(id)
  }

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-full">

      {/* Tab bar */}
      <div className="flex border-b border-white/[0.06] px-4 pt-3 gap-1 shrink-0">
        {(['apikey', 'commands'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors',
              tab === t
                ? 'bg-slate-800 text-white border border-white/10 border-b-slate-800 -mb-px'
                : 'text-slate-500 hover:text-slate-300',
            ].join(' ')}
          >
            {t === 'apikey' ? 'API Key' : 'My Commands'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">

        {/* ── API Key tab ─────────────────────────────────────────────── */}
        {tab === 'apikey' && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-white font-medium text-sm mb-1">Groq API Key</p>
              <p className="text-slate-400 text-xs mb-3">
                Get your free key at{' '}
                <button
                  onClick={() => window.api.openExternal('https://console.groq.com')}
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                >
                  console.groq.com
                </button>
              </p>
              <input
                type="password"
                value={key}
                onChange={(e) => { setKey(e.target.value); setKeyError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                placeholder="gsk_..."
                autoFocus
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              {keyError && <p className="text-red-400 text-xs mt-1">{keyError}</p>}
            </div>
            <button
              onClick={handleSaveKey}
              disabled={saving || !key.trim()}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {saving ? 'Saving…' : 'Save & continue'}
            </button>
          </div>
        )}

        {/* ── My Commands tab ─────────────────────────────────────────── */}
        {tab === 'commands' && (
          <div className="flex flex-col gap-4">

            {/* Existing custom commands list */}
            {customCommands.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-0.5">
                  Your commands
                </p>
                {customCommands.map((cmd) => (
                  <div
                    key={cmd.id}
                    className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-2.5 border border-white/[0.05]"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-violet-400 font-mono text-xs font-medium">
                        {cmd.value}
                      </span>
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{cmd.prompt}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(cmd.id)}
                      className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 mt-0.5"
                      title="Delete command"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add form */}
            <div className="flex flex-col gap-3">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">
                {customCommands.length > 0 ? 'Add another' : 'Create your first command'}
              </p>

              {/* Command name */}
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Command name</label>
                <div className="flex items-center">
                  <span className="px-2.5 py-[7px] bg-slate-700 border border-r-0 border-white/10 rounded-l-lg text-slate-400 text-sm font-mono select-none">
                    /
                  </span>
                  <input
                    value={cmdName}
                    onChange={(e) => {
                      setCmdName(e.target.value.replace(/^\/+/, '').replace(/\s+/g, '-'))
                      setCmdError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCommand()}
                    placeholder="translate, summarize, tweet…"
                    className="flex-1 bg-slate-800 border border-white/10 rounded-r-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Prompt textarea */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <label className="text-slate-400 text-xs">What should this command do?</label>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="text-slate-600 hover:text-slate-400 transition-colors"
                      tabIndex={-1}
                    >
                      <Info size={11} />
                    </button>
                    {showTooltip && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 shadow-xl z-50 pointer-events-none">
                        <p className="font-medium text-white mb-1">Tip: write a clear instruction</p>
                        <ul className="space-y-0.5 text-slate-400">
                          <li>• Translate the text to English</li>
                          <li>• Summarize in 3 bullet points</li>
                          <li>• Convert to a tweet under 280 chars</li>
                          <li>• Add a polite closing sentence</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <textarea
                  value={cmdPrompt}
                  onChange={(e) => { setCmdPrompt(e.target.value); setCmdError('') }}
                  placeholder="e.g. Translate the text to English, keeping the original tone and meaning."
                  rows={3}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              {cmdError && <p className="text-red-400 text-xs -mt-1">{cmdError}</p>}

              <button
                onClick={handleAddCommand}
                disabled={!cmdName.trim() || !cmdPrompt.trim()}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                <Plus size={13} />
                Add command
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
