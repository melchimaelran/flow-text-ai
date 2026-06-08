import { useRef, useState, type JSX } from 'react'
import { Mic, Loader2 } from 'lucide-react'

type RecordingState = 'idle' | 'recording' | 'processing'

interface Props {
  onTranscript: (text: string) => void
  onError?: (msg: string) => void
  disabled?: boolean
  compact?: boolean
}

export function MicButton({ onTranscript, onError, disabled, compact }: Props): JSX.Element {
  const [state, setState] = useState<RecordingState>('idle')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      })

      // Let Chromium choose the best supported format — don't force a type
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        setState('processing')
        try {
          const mimeType = recorder.mimeType || 'audio/webm'
          const blob = new Blob(chunksRef.current, { type: mimeType })

          if (blob.size < 300) {
            onError?.('Aucun audio capturé — vérifiez votre microphone.')
            setState('idle')
            return
          }

          const arrayBuffer = await blob.arrayBuffer()
          const transcript = await window.api.transcribeAudio(arrayBuffer, mimeType)
          onTranscript(transcript)
        } catch {
          onError?.('Transcription échouée. Vérifiez votre clé API.')
        } finally {
          setState('idle')
        }
      }

      // No timeslice — more reliable on Linux/Electron
      recorder.start()
      setState('recording')
    } catch {
      onError?.('Accès microphone refusé.')
      setState('idle')
    }
  }

  const stopRecording = (): void => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state !== 'recording') return
    recorder.requestData() // flush any buffered audio before stopping
    recorder.stop()
  }

  const handleClick = (): void => {
    if (disabled || state === 'processing') return
    if (state === 'recording') stopRecording()
    else startRecording()
  }

  if (state === 'processing') {
    return (
      <button
        disabled
        title="Transcription en cours…"
        className={[
          'flex items-center gap-1.5 rounded-lg bg-slate-700/50 text-slate-400 text-xs font-medium cursor-not-allowed',
          compact ? 'p-1.5' : 'px-3 py-1.5',
        ].join(' ')}
      >
        <Loader2 size={compact ? 12 : 13} className="animate-spin" />
        {!compact && 'Transcription…'}
      </button>
    )
  }

  if (state === 'recording') {
    return (
      <button
        onClick={handleClick}
        title="Arrêter l'enregistrement"
        className={[
          'flex items-center gap-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-medium transition-all',
          compact ? 'p-1.5' : 'px-3 py-1.5',
        ].join(' ')}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        {!compact && 'Stop'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title="Enregistrer voix"
      className={[
        'flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 text-xs font-medium transition-all',
        compact ? 'p-1.5' : 'px-3 py-1.5',
      ].join(' ')}
    >
      <Mic size={compact ? 12 : 13} />
      {!compact && 'Voice'}
    </button>
  )
}
