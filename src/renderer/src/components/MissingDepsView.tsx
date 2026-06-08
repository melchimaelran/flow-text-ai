import type { JSX } from 'react'

export function MissingDepsView(): JSX.Element {
  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="text-white font-semibold text-sm">Missing system dependency</p>
          <p className="text-slate-400 text-xs mt-1">
            Flow Text AI requires{' '}
            <code className="text-indigo-400 bg-slate-800 px-1 py-0.5 rounded">xdotool</code>{' '}
            to capture and inject text into other applications.
          </p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-3">
        <p className="text-xs text-slate-400 mb-2">Install them with:</p>
        <code className="text-sm text-green-400 font-mono">
          sudo apt install xdotool
        </code>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => window.api.openExternal('https://xdotool.com/')}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2"
        >
          xdotool.com →
        </button>
        <p className="text-xs text-slate-500">Restart the app after installing.</p>
      </div>
    </div>
  )
}
