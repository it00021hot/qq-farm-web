declare module '/wails/runtime.js' {
  export const Window: {
    Minimise: () => Promise<void>;
    ToggleMaximise: () => Promise<void>;
    Close: () => Promise<void>;
    IsMaximised?: () => Promise<boolean>;
  };
  export const System: {
    IsWindows?: () => boolean;
    IsMac?: () => boolean;
  };
}
