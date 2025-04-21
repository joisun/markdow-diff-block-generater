declare module 'codemirror' {
  export interface Editor {
    getDoc(): Doc;
    getScrollInfo(): { left: number; top: number };
    scrollTo(left: number, top: number): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    options: Record<string, unknown>;
    setOption(option: string, value: unknown): void;
    refresh(): void;
  }

  export interface EditorChange {
    from: number;
    to: number;
    text: string[];
    removed: string;
  }

  export interface Doc {
    lineCount(): number;
    removeLineClass(line: number, where: string, className?: string): void;
    addLineClass(line: number, where: string, className: string): void;
  }
}

declare module 'react-codemirror2' {
  import * as React from 'react'
  import * as CodeMirror from 'codemirror'

  export interface IControlledCodeMirror {
    value: string;
    options?: object;
    className?: string;
    onBeforeChange: (editor: CodeMirror.Editor, data: CodeMirror.EditorChange, value: string) => void;
    editorDidMount?: (editor: CodeMirror.Editor) => void;
  }

  export class Controlled extends React.Component<IControlledCodeMirror> {}
}
