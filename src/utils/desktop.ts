/** Desktop (Wails) helpers — only active when built with `VITE_IS_DESKTOP=Y`. */

import { computed, ref } from 'vue';

export const isDesktop = import.meta.env.VITE_IS_DESKTOP === 'Y';

type WailsWindow = {
  Minimise: () => Promise<void>;
  ToggleMaximise: () => Promise<void>;
  Close: () => Promise<void>;
  IsMaximised?: () => Promise<boolean>;
};

type WailsRuntime = {
  Window: WailsWindow;
  System?: {
    IsWindows?: () => boolean;
    IsMac?: () => boolean;
  };
};

let runtimePromise: Promise<WailsRuntime | null> | null = null;

/** True only when Wails runtime loaded (WebView). Browser opening the same build stays false. */
const desktopShellActive = ref(false);

export const isDesktopShell = computed(() => isDesktop && desktopShellActive.value);

export function ensureWailsRuntime(): Promise<WailsRuntime | null> {
  if (!isDesktop || typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  if (!runtimePromise) {
    // Wails serves /wails/runtime.js only inside the desktop WebView.
    const runtimeUrl = '/wails/runtime.js';
    runtimePromise = import(/* @vite-ignore */ runtimeUrl)
      .then(mod => mod as WailsRuntime)
      .catch(() => null)
      .then(rt => {
        desktopShellActive.value = Boolean(rt?.Window?.Minimise);
        return rt;
      });
  }
  return runtimePromise;
}

/** Detect shell + apply window chrome. Safe to call from browser (no-op without runtime). */
export async function bootstrapDesktopShell(): Promise<boolean> {
  if (!isDesktop) return false;
  const rt = await ensureWailsRuntime();
  const active = Boolean(rt?.Window?.Minimise);
  desktopShellActive.value = active;
  if (active && typeof document !== 'undefined') {
    installDesktopContextMenuGuard();
    document.documentElement.classList.toggle('desktop-windows', isDesktopWindows());
    document.documentElement.classList.toggle('desktop-mac', isDesktopMac());
  }
  return active;
}

export function isDesktopWindows(): boolean {
  if (!isDesktopShell.value || typeof navigator === 'undefined') return false;
  return /windows/i.test(navigator.userAgent);
}

export function isDesktopMac(): boolean {
  if (!isDesktopShell.value || typeof navigator === 'undefined') return false;
  return /mac/i.test(navigator.userAgent);
}

export async function desktopMinimise(): Promise<void> {
  const rt = await ensureWailsRuntime();
  await rt?.Window?.Minimise?.();
}

export async function desktopToggleMaximise(): Promise<void> {
  const rt = await ensureWailsRuntime();
  await rt?.Window?.ToggleMaximise?.();
}

export async function desktopClose(): Promise<void> {
  const rt = await ensureWailsRuntime();
  // WindowClosing hook hides to tray instead of quitting.
  await rt?.Window?.Close?.();
}

let contextMenuGuardInstalled = false;

/** Block image save / open-in-new-tab style context menus; keep input/selection menus. */
export function installDesktopContextMenuGuard(): void {
  if (!isDesktop || typeof document === 'undefined' || contextMenuGuardInstalled) return;
  contextMenuGuardInstalled = true;
  document.addEventListener(
    'contextmenu',
    event => {
      if (!desktopShellActive.value) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('input, textarea, [contenteditable="true"]')) return;
      if (target.closest('img, picture, video, canvas, svg, a[href]')) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
}
