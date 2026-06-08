/// <reference types="vite/client" />

import type { ChatMessage, CustomCommand } from "../../shared/types";

declare global {
  interface Window {
    api: {
      transformText: (
        originalText: string,
        instruction: string,
        history: ChatMessage[],
      ) => Promise<string>;
      captureText: () => Promise<string>;
      injectText: (text: string) => Promise<void>;
      hideWindow: () => void;
      getConfig: () => Promise<{ hasApiKey: boolean; hotkey: string; hasXdotool: boolean }>;
      setApiKey: (key: string) => Promise<void>;
      onInit: (callback: (data: { text: string }) => void) => void;
      openExternal: (url: string) => Promise<void>;
      listCustomCommands: () => Promise<CustomCommand[]>;
      saveCustomCommand: (cmd: CustomCommand) => Promise<void>;
      deleteCustomCommand: (id: string) => Promise<void>;
      transcribeAudio: (audioData: ArrayBuffer, mimeType: string) => Promise<string>;
      onOpenSettings: (callback: () => void) => void;
    };
  }
}
