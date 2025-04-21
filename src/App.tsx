import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import { useTheme } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'

// --- CodeMirror Imports ---
import * as CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css' // Ensure this is loaded first
import 'codemirror/theme/material-darker.css'
import 'codemirror/mode/diff/diff'

// --- React CodeMirror Wrapper ---
import { Controlled as ReactCodeMirror } from 'react-codemirror2'

// --- Diff Library Import ---
import { diffLines, Change } from 'diff'

// --- Styles and Icons ---
import './App.css' // Your custom styles
import { GitHubLogoIcon, SunIcon, MoonIcon } from '@radix-ui/react-icons'
import {
  LayoutGrid,
  LayoutList,
  Maximize2,
  Minimize2,
  Copy,
  Plus,
  Minus,
} from 'lucide-react'

// --- Constants ---
const BASE_FONT_SIZE: number = 14
const MIN_FONT_SIZE: number = 10
const MAX_FONT_SIZE: number = 24
const EDITOR_THEME: string = 'material-darker'
// --- Type Definitions ---
// Define minimal interface for CodeMirror options
interface EditorOptions {
  theme?: string;
  lineNumbers?: boolean;
  lineWrapping?: boolean;
  mode?: string | null;
  readOnly?: boolean;
  [key: string]: unknown;
}

// --- Utility Functions ---
// Custom CSS - Keep this as it manages dynamic styles + flex height
const createDiffStyles = (fontSize: number, isDark: boolean): string => `
  /* General CM styles */
  .CodeMirror {
    font-size: ${fontSize}px !important;
    height: 100% !important; /* Let CM fill its container */
    line-height: 1.5 !important;
    background: ${isDark ? '#2d2d2d' : '#ffffff'} !important;
    color: ${isDark ? '#e0e0e0' : '#000000'} !important;
  }
  .CodeMirror pre.CodeMirror-line,
  .CodeMirror pre.CodeMirror-line-like {
    font-size: ${fontSize}px !important;
  }

  /* Wrapper height for react-codemirror2 */
  /* This element receives the className="react-codemirror2" */
  .react-codemirror2 {
    display: flex; /* Make the wrapper a flex container */
    flex-direction: column; /* Stack internal elements vertically */
    height: 100%;     /* Take full height of parent */
    overflow: hidden;
  }
  /* Target the actual CodeMirror instance *inside* the wrapper */
  .react-codemirror2 > .CodeMirror {
     flex-grow: 1; /* Allow the editor itself to grow and fill space */
     min-height: 0; /* Important for flex-grow in some contexts */
  }

  /* Diff specific styles */
  .diff-line-common { opacity: 0.7; }
  .diff-added-line { background-color: ${isDark ? 'rgba(0, 255, 0, 0.1)' : 'rgba(0, 200, 0, 0.1)'}; display: block; width: 100%; }
  .diff-removed-line { background-color: ${isDark ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)'}; display: block; width: 100%; }
  .cm-s-material-darker .diff-added-line { background-color: rgba(0, 255, 0, 0.1); }
  .cm-s-material-darker .diff-removed-line { background-color: rgba(255, 0, 0, 0.1); }
  .cm-s-default .diff-added-line { background-color: rgba(0, 200, 0, 0.1); }
  .cm-s-default .diff-removed-line { background-color: rgba(255, 0, 0, 0.1); }
`

// --- Main Application Component ---
function App(): JSX.Element {
  // --- State ---
  const [originText, setOriginText] = useState<string>('')
  const [changedText, setChangedText] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>('unified')
  const [fontSize, setFontSize] = useState<number>(BASE_FONT_SIZE)

  // --- Refs ---
  const styleRef = useRef<HTMLStyleElement | null>(null)

  // --- Hooks ---
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const isDark = theme === 'dark'

  // --- Effects ---
  useEffect(() => {
    // ... (style injection effect remains the same) ...
    if (!styleRef.current) {
      styleRef.current = document.createElement('style')
      styleRef.current.setAttribute('id', 'codemirror-dynamic-styles')
      document.head.appendChild(styleRef.current)
    }
    if (styleRef.current) {
      styleRef.current.textContent = createDiffStyles(fontSize, isDark)
    }
    return () => {
      const styleElement = document.getElementById('codemirror-dynamic-styles')
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement)
      }
    }
  }, [fontSize, isDark])

  // --- Event Handlers ---
  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 1, MAX_FONT_SIZE))
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 1, MIN_FONT_SIZE))
  }, [])

  const toggleExpand = useCallback(() => setIsExpanded(prev => !prev), [])
  const toggleDiffMode = useCallback(() => setDiffMode(prev => prev === 'unified' ? 'split' : 'unified'), [])
  const toggleTheme = useCallback(() => setTheme(isDark ? 'light' : 'dark'), [isDark, setTheme])

  const copyToClipboard = useCallback(async (textToCopy: string) => {
    // ... (copy logic remains the same) ...
    if (!textToCopy) {
      toast({ title: 'Nothing to copy', description: 'The result text is empty.', variant: 'destructive', duration: 2000 })
      return
    }
    try {
      await navigator.clipboard.writeText('```diff\n' + textToCopy + '\n```')
      toast({ title: 'Copied to clipboard', description: 'Diff content copied as markdown code block', duration: 2000 })
    } catch (error) {
      console.error('Failed to copy text:', error)
      toast({ title: 'Copy failed', description: 'Could not copy to clipboard', variant: 'destructive', duration: 2000 })
    }
  }, [toast])

  // --- Memoized Values ---
  const editorOptions = useMemo((): EditorOptions => ({
    theme: EDITOR_THEME,
    lineNumbers: true,
    lineWrapping: true,
    mode: null,
    // No height option here - handled by CSS
  }), [])

  const readOnlyOptions = useMemo((): EditorOptions => ({
    theme: isDark ? 'material-darker' : 'default',
    lineNumbers: true,
    lineWrapping: true,
    mode: 'diff',
    readOnly: true,
    // No height option here - handled by CSS
  }), [isDark])

  const resultText = useMemo((): string => {
    // ... (diff calculation remains the same) ...
    if (!originText && !changedText) return ''
    const oldT = originText || ''
    const newT = changedText || ''
    const diff: Change[] = diffLines(oldT, newT)
    let diffResult = ''
    diff.forEach(part => {
      const prefix = part.added ? '+ ' : part.removed ? '- ' : '  '
      const lines = part.value.split('\n')
      const relevantLines = lines.length > 0 && lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines
      relevantLines.forEach(line => {
        if (line || relevantLines.length === 1) {
          diffResult += `${prefix}${line}\n`
        }
      })
    })
    return diffResult
  }, [changedText, originText])

  // --- Layout Classes ---
  const layoutClass = isExpanded ? 'col-span-3 h-full' : 'h-full'
  const mainLayoutClass = isExpanded ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'

  // --- Render ---
  // console.log("App Render - Texts:", originText, changedText); // Debug log for state on render

  return (
    <main className="p-4 h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 flex-shrink-0">
        {/* ... (header content remains the same) ... */}
        <h1 className="text-2xl font-bold flex items-center gap-2">Markdown Diff Block Generator</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={decreaseFontSize} className="h-8 w-8" title="Decrease font size" disabled={fontSize <= MIN_FONT_SIZE}><Minus size={16} /></Button>
          <span className="text-xs w-8 text-center tabular-nums">{fontSize}px</span>
          <Button variant="outline" size="icon" onClick={increaseFontSize} className="h-8 w-8" title="Increase font size" disabled={fontSize >= MAX_FONT_SIZE}><Plus size={16} /></Button>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="h-8 w-8" title="Toggle light/dark mode">{isDark ? <SunIcon /> : <MoonIcon />}</Button>
          <a href="https://github.com/joisun/markdown-diff-block-generater" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground" title="View on GitHub"><GitHubLogoIcon width={16} height={16} /></a>
        </div>
      </header>

      {/* Main Content Area */}
      <section className={`flex-1 grid ${mainLayoutClass} gap-4 overflow-hidden`}>
        {/* Original and Changed Text Inputs (Visible when not expanded) */}
        {!isExpanded && (
          <>
            {/* Original Text */}
            <div className="flex flex-col gap-2 overflow-hidden"> {/* Outer container */}
              <Label className="font-semibold shrink-0 h-6" htmlFor="origin-text">Original text</Label>
              {/* === Container for CodeMirror === */}
              {/* Needs flex-1 to grow, flex display to make child height work, border, etc. */}
              <div className="flex-1 border border-border rounded-md overflow-hidden flex">
                <ReactCodeMirror
                  className="react-codemirror2 w-full" // Add w-full ensure it tries to take width
                  value={originText}
                  options={{ ...editorOptions, readOnly: false }}
                  onBeforeChange={(editor: CodeMirror.Editor, data: CodeMirror.EditorChange, value: string) => {
                    // console.log('Origin Text Input:', value); // Debug Log
                    setOriginText(value)
                  }}
                />
              </div>
            </div>

            {/* Changed Text */}
            <div className="flex flex-col gap-2 overflow-hidden"> {/* Outer container */}
              <Label className="font-semibold shrink-0 h-6" htmlFor="changed-text">Changed text</Label>
              {/* === Container for CodeMirror === */}
              <div className="flex-1 border border-border rounded-md overflow-hidden flex">
                <ReactCodeMirror
                  className="react-codemirror2 w-full" // Add w-full
                  value={changedText}
                  options={{ ...editorOptions, readOnly: false }}
                  onBeforeChange={(editor: CodeMirror.Editor, data: CodeMirror.EditorChange, value: string) => {
                    // console.log('Changed Text Input:', value); // Debug Log
                    setChangedText(value)
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Result Diff View */}
        <div className={`${layoutClass} flex flex-col gap-2 overflow-hidden`}>
          {/* Result Header */}
          <div className="flex items-center justify-between h-6 flex-shrink-0">
            {/* ... (Result header content remains the same) ... */}
            <Label className="font-semibold" htmlFor="result">Result (Markdown Diff)</Label>
            <div className="flex items-center gap-2">
              <Toggle variant="outline" size="sm" pressed={diffMode === 'split'} onPressedChange={toggleDiffMode} aria-label="Toggle diff view" title={diffMode === 'unified' ? 'Switch to split view' : 'Switch to unified view'} className="h-8 w-8 p-0">{diffMode === 'unified' ? <LayoutList size={16} /> : <LayoutGrid size={16} />}</Toggle>
              <Toggle variant="outline" size="sm" pressed={isExpanded} onPressedChange={toggleExpand} aria-label="Toggle expand view" title={isExpanded ? 'Collapse view' : 'Expand view'} className="h-8 w-8 p-0">{isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</Toggle>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(resultText)} aria-label="Copy diff to clipboard" title="Copy diff to clipboard" className="h-8 w-8" disabled={!resultText}><Copy size={16} /></Button>
            </div>
          </div>

          {/* Diff View Content */}
          {/* === Container for Result View === */}
          <div className="flex-1 border border-border rounded-md overflow-hidden flex"> {/* Added flex here too */}
            {diffMode === 'unified' ? (
              // Unified Diff View
              <ReactCodeMirror
                className="react-codemirror2 w-full" // Use class for height
                value={resultText}
                options={readOnlyOptions}
                onBeforeChange={() => {}}
              />
            ) : (
              // Split Diff View
              <SplitDiffView
                originalText={originText}
                modifiedText={changedText}
                options={readOnlyOptions}
                isDark={isDark}
              />
            )}
          </div>
        </div>
      </section>

      {/* Toast Container */}
      <Toaster />
    </main>
  )
}

// --- SplitDiffView Component ---
// No changes needed in SplitDiffView based on the input issue,
// but ensure its container also uses flex correctly if needed.
// The structure inside SplitDiffView seems correct with flex-1 and wrappers.
interface SplitDiffViewProps {
  originalText: string;
  modifiedText: string;
  options: EditorOptions;
  isDark: boolean;
}

function SplitDiffView({ originalText, modifiedText, options, isDark }: SplitDiffViewProps): JSX.Element {
  const leftEditorRef = useRef<CodeMirror.Editor | null>(null)
  const rightEditorRef = useRef<CodeMirror.Editor | null>(null)

  const splitViewOptions = useMemo((): EditorOptions => ({
    ...options, // Includes theme, readOnly=true from parent
    lineNumbers: true,
  }), [options])

  // Effect for highlighting and scrolling sync (remains the same)
  useEffect(() => {
    const leftEditor = leftEditorRef.current
    const rightEditor = rightEditorRef.current
    if (!leftEditor || !rightEditor) return
    const leftDoc = leftEditor.getDoc()
    const rightDoc = rightEditor.getDoc()

    // Reset classes
    const resetLineClasses = (doc: CodeMirror.Doc) => {
      // Use conventional loop instead of eachLine
      for (let i = 0; i < doc.lineCount(); i++) {
        doc.removeLineClass(i, 'background')
      }
    }
    resetLineClasses(leftDoc)
    resetLineClasses(rightDoc)

    // Apply diff classes
    const diff = diffLines(originalText || '', modifiedText || '')
    let leftLineIndex = 0
    let rightLineIndex = 0
    diff.forEach((part: Change) => {
      // Count lines accurately, including potential final empty line from split('\n')
      let lineCount = part.value.endsWith('\n')
        ? part.value.split('\n').length - 1
        : part.value.split('\n').length
      if (part.value === '') lineCount = 0 // Handle empty parts

      if (part.removed) {
        for (let i = 0; i < lineCount; i++) {
          if (leftLineIndex < leftDoc.lineCount()) {
            leftDoc.addLineClass(leftLineIndex++, 'background', 'diff-removed-line')
          }
        }
      } else if (part.added) {
        for (let i = 0; i < lineCount; i++) {
          if (rightLineIndex < rightDoc.lineCount()) {
            rightDoc.addLineClass(rightLineIndex++, 'background', 'diff-added-line')
          }
        }
      } else {
        leftLineIndex += lineCount
        rightLineIndex += lineCount
      }
    })

    // Sync scrolling implementation
    let isScrolling = false

    const syncScroll = (source: CodeMirror.Editor, target: CodeMirror.Editor) => {
      if (isScrolling) return
      isScrolling = true
      const info = source.getScrollInfo()
      target.scrollTo(info.left, info.top)
      setTimeout(() => { isScrolling = false }, 50)
    }

    const leftScrollHandler = () => {
      if (leftEditor && rightEditor) {
        syncScroll(leftEditor, rightEditor)
      }
    }

    const rightScrollHandler = () => {
      if (rightEditor && leftEditor) {
        syncScroll(rightEditor, leftEditor)
      }
    }
    leftEditor.on('scroll', leftScrollHandler)
    rightEditor.on('scroll', rightScrollHandler)
    return () => {
      if (leftEditor) leftEditor.off('scroll', leftScrollHandler)
      if (rightEditor) rightEditor.off('scroll', rightScrollHandler)
    }
  }, [originalText, modifiedText, leftEditorRef.current, rightEditorRef.current]) // Added refs as deps

  // Container requires flex, gap, full height/width
  return (
    <div className="flex gap-2 h-full w-full">
      {/* Left Pane (Original) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border border-border rounded-md">
        <div className={`text-xs px-2 py-1 shrink-0 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>Original</div>
        <div className="flex-1 h-full overflow-hidden"> {/* Wrapper for CM */}
          <ReactCodeMirror
            className="react-codemirror2 h-full w-full" // Add h-full w-full
            value={originalText}
            options={splitViewOptions}
            onBeforeChange={() => {}}
            editorDidMount={(editor: CodeMirror.Editor) => { leftEditorRef.current = editor }}
          />
        </div>
      </div>
      {/* Right Pane (Modified) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border border-border rounded-md">
        <div className={`text-xs px-2 py-1 shrink-0 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>Modified</div>
        <div className="flex-1 h-full overflow-hidden"> {/* Wrapper for CM */}
          <ReactCodeMirror
            className="react-codemirror2 h-full w-full" // Add h-full w-full
            value={modifiedText}
            options={splitViewOptions}
            onBeforeChange={() => {}}
            editorDidMount={(editor: CodeMirror.Editor) => { rightEditorRef.current = editor }}
          />
        </div>
      </div>
    </div>
  )
}

export default App
