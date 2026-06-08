import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  clipboard,
  shell,
  safeStorage,
  session,
  Tray,
  Menu,
  nativeImage,
} from "electron";
import { join } from "path";
import { execSync, exec } from "child_process";
import log from "electron-log";
import Store from "electron-store";
import { AIService } from "./ai/AIService";
import type { ChatMessage, CustomCommand, AppConfig } from "../shared/types";

log.initialize();

// PipeWire support for audio capture on Ubuntu 22+
app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer')
app.commandLine.appendSwitch('disable-renderer-backgrounding')

function checkXdotool(): boolean {
  try {
    execSync("which xdotool", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const store = new Store<AppConfig>({
  defaults: { groqApiKey: "", hotkey: "CommandOrControl+Shift+Space" },
});

let overlayWindow: BrowserWindow | null = null;
let targetWindowId: string | null = null;
let tray: Tray | null = null;

function createOverlayWindow(): void {
  overlayWindow = new BrowserWindow({
    width: 640,
    height: 500,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.on("blur", () => {
    overlayWindow?.hide();
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    overlayWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    overlayWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function captureActiveWindow(): string {
  try {
    targetWindowId = execSync("xdotool getactivewindow").toString().trim();
    log.info(`[capture] targetWindowId=${targetWindowId}`);

    execSync("sleep 0.5"); // let hotkey modifier keys fully release
    execSync(`xdotool key ctrl+a`);
    execSync("sleep 0.5");
    execSync(`xdotool key ctrl+c`);
    execSync("sleep 0.5");

    const captured = clipboard.readText();
    log.info(`[capture] "${captured}"`);
    return captured;
  } catch (err) {
    log.error("[capture] failed:", err);
    return "";
  }
}

function createTray(): void {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, "resources/tray-icon.png")
    : join(__dirname, "../../resources/tray-icon.png");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip("Flow Text AI");

  const menu = Menu.buildFromTemplate([
    {
      label: "Flow Text AI",
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Show overlay",
      click: () => {
        if (overlayWindow) {
          overlayWindow.webContents.send("overlay:init", { text: "" });
          const { width: sw, height: sh } =
            require("electron").screen.getPrimaryDisplay().workAreaSize;
          const [ww, wh] = overlayWindow.getSize();
          overlayWindow.setPosition(
            Math.floor((sw - ww) / 2),
            Math.floor((sh - wh) / 2),
          );
          overlayWindow.show();
          overlayWindow.focus();
        }
      },
    },
    {
      label: "Settings",
      click: () => {
        if (overlayWindow) {
          overlayWindow.webContents.send("tray:openSettings");
          overlayWindow.show();
          overlayWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(menu);

  // Left-click also opens the context menu on Linux
  tray.on("click", () => tray?.popUpContextMenu());
}

function showOverlay(): void {
  if (!overlayWindow) return;

  const text = captureActiveWindow();
  overlayWindow.webContents.send("overlay:init", { text });

  const { width: screenW, height: screenH } =
    require("electron").screen.getPrimaryDisplay().workAreaSize;
  const [winW, winH] = overlayWindow.getSize();
  overlayWindow.setPosition(
    Math.floor((screenW - winW) / 2),
    Math.floor((screenH - winH) / 2),
  );

  overlayWindow.show();
  overlayWindow.focus();
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media')
  })
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return permission === 'media'
  })

  createOverlayWindow();
  createTray();

  const hotkey = store.get("hotkey");
  globalShortcut.register(hotkey, showOverlay);

  log.info(`Flow Text AI started — hotkey: ${hotkey}`);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createOverlayWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// Keep app alive in tray even when all windows are closed
app.on("window-all-closed", () => { /* noop */ });

// ─── API key helpers (safeStorage + migration) ───────────────────────────────

function getStoredApiKey(): string {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = store.get("groqApiKeyEncrypted");
    if (encrypted) {
      try {
        return safeStorage.decryptString(Buffer.from(encrypted, "base64"));
      } catch (e) {
        log.warn("[apikey] decryption failed, falling back:", e);
      }
    }
    // Migrate legacy plain-text key if present
    const legacy = store.get("groqApiKey");
    if (legacy) {
      const enc = safeStorage.encryptString(legacy);
      store.set("groqApiKeyEncrypted", enc.toString("base64"));
      store.delete("groqApiKey");
      log.info("[apikey] migrated plain-text key to safeStorage");
      return legacy;
    }
  } else {
    // safeStorage unavailable (e.g. headless CI) — fall back to plain text
    log.warn("[apikey] safeStorage not available, using plain text");
    const plain = store.get("groqApiKey");
    if (plain) return plain;
  }
  return process.env["GROQ_API_KEY"] || "";
}

function setStoredApiKey(key: string): void {
  if (safeStorage.isEncryptionAvailable()) {
    const enc = safeStorage.encryptString(key);
    store.set("groqApiKeyEncrypted", enc.toString("base64"));
    store.delete("groqApiKey"); // remove legacy field if it existed
  } else {
    log.warn("[apikey] safeStorage not available, storing plain text");
    store.set("groqApiKey", key);
  }
}

// IPC Handlers

ipcMain.handle(
  "ai:transform",
  async (_event, originalText: string, instruction: string, history: ChatMessage[]) => {
    const apiKey = getStoredApiKey();
    const ai = new AIService(apiKey);
    return ai.chat(originalText, instruction, history);
  },
);

ipcMain.handle("clipboard:capture", () => {
  return captureActiveWindow();
});

ipcMain.handle("injection:inject", (_event, text: string) => {
  return new Promise<void>((resolve, reject) => {
    const saved = clipboard.readText();
    clipboard.writeText(text); // Electron becomes X11 clipboard owner

    // exec() is non-blocking — event loop stays free to answer X11 SelectionRequest
    // events from Discord (or any app) while xdotool runs in background shell
    const cmds = [
      targetWindowId ? `xdotool windowfocus --sync ${targetWindowId}` : null,
      "sleep 0.05",
      "xdotool key --clearmodifiers ctrl+a", // select existing text
      "sleep 0.03",
      "xdotool key --clearmodifiers ctrl+v", // paste replaces selection
    ]
      .filter(Boolean)
      .join(" && ");

    exec(cmds, (err) => {
      clipboard.writeText(saved);
      overlayWindow?.hide();
      if (err) {
        log.error("Injection failed:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
});

ipcMain.on("window:hide", () => {
  overlayWindow?.hide();
});

ipcMain.handle("config:get", () => {
  return {
    hasApiKey: !!getStoredApiKey(),
    hotkey: store.get("hotkey"),
    hasXdotool: checkXdotool(),
  };
});

ipcMain.handle("config:setApiKey", (_event, key: string) => {
  setStoredApiKey(key);
});

ipcMain.handle("shell:openExternal", (_event, url: string) => {
  shell.openExternal(url);
});

ipcMain.handle("commands:list", () => {
  return store.get("customCommands") ?? [];
});

ipcMain.handle("commands:save", (_event, cmd: CustomCommand) => {
  const existing = (store.get("customCommands") ?? []) as CustomCommand[];
  const idx = existing.findIndex((c) => c.id === cmd.id);
  if (idx >= 0) existing[idx] = cmd;
  else existing.push(cmd);
  store.set("customCommands", existing);
});

ipcMain.handle("commands:delete", (_event, id: string) => {
  const existing = (store.get("customCommands") ?? []) as CustomCommand[];
  store.set("customCommands", existing.filter((c) => c.id !== id));
});

ipcMain.handle("audio:transcribe", async (_event, audioData: ArrayBuffer, mimeType: string) => {
  const apiKey = getStoredApiKey();
  const ai = new AIService(apiKey);
  return ai.transcribe(Buffer.from(audioData), mimeType);
});
