import OpenAI, { toFile } from 'openai'
import type { ChatMessage } from '../../shared/types'

export class AIService {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  }

  async chat(originalText: string, instruction: string, history: ChatMessage[]): Promise<string> {
    const systemPrompt = `You are an AI writing assistant. Transform the user's text based on their instructions.
Return ONLY the transformed text — no explanations, no meta-commentary, no quotes around the result.

Original text to transform:
"""
${originalText}
"""`

    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: instruction },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    })

    return response.choices[0]?.message?.content?.trim() ?? originalText
  }

  async transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm'
    const file = await toFile(audioBuffer, `recording.${ext}`, { type: mimeType })
    const transcription = await this.client.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
    })
    return transcription.text.trim()
  }
}
