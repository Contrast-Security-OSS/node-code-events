/* eslint-disable @typescript-eslint/ban-types */

declare interface CodeEvent {
  func: string;
  lineNumber: number;
  script: string;
  type:
  | 'Builtin'
  | 'Callback'
  | 'Eval'
  | 'Function'
  | 'InterpretedFunction'
  | 'Handler'
  | 'BytecodeHandler'
  | 'LazyCompile'
  | 'RegExp'
  | 'Script'
  | 'Stub'
  | 'Relocation'
}

declare const code_events: {
  /**
   * Sets the function for processing v8 code events.
   * Will start listening for code events if not already listening.
   * starts a timer which polls for an available code event once every `interval` ms.
   */
  setCodeEventListener(cb: (event: CodeEvent) => void, interval?: number): void;

  /** Stop listening for v8 code events */
  stopListening(): void;
};

export = code_events;
