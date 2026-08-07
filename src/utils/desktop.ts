/** Desktop (Wails) helpers — only active when built with `VITE_IS_DESKTOP=Y`. */

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

export function ensureWailsRuntime(): Promise<WailsRuntime | null> {
  if (!isDesktop || typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  if (!runtimePromise) {
    // Wails serves /wails/runtime.js only inside the desktop WebView.
    const runtimeUrl = '/wails/runtime.js';
    runtimePromise = import(/* @vite-ignore */ runtimeUrl).then(mod => mod as WailsRuntime).catch(() => null);
  }
  return runtimePromise;
}

export function isDesktopWindows(): boolean {
  if (!isDesktop || typeof navigator === 'undefined') return false;
  return /windows/i.test(navigator.userAgent);
}

export function isDesktopMac(): boolean {
  if (!isDesktop || typeof navigator === 'undefined') return false;
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

/** Block image save / open-in-new-tab style context menus; keep input/selection menus. */
export function installDesktopContextMenuGuard(): void {
  if (!isDesktop || typeof document === 'undefined') return;
  document.addEventListener(
    'contextmenu',
    event => {
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
