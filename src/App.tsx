import React, { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import { useTheme } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'

// --- CodeMirror Imports ---
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { StreamLanguage } from '@codemirror/language'
import { diff } from '@codemirror/legacy-modes/mode/diff'

// --- Diff Library Import ---
import { diffLines, Change } from 'diff'

// --- Styles and Icons ---
import './App.css'
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

// --- Main Application Component ---
function App(): JSX.Element {
  // --- State ---
  const [originText, setOriginText] = useState<string>('')
  const [changedText, setChangedText] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [diffMode, setDiffMode] = useState<'unified' | 'split'>('unified')
  const [fontSize, setFontSize] = useState<number>(BASE_FONT_SIZE)

  // --- Hooks ---
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const isDark = theme === 'dark'

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

  // --- Editor Theme ---
  const diffHighlightStyle = useMemo(() => {
    return HighlightStyle.define([
      { tag: tags.inserted, backgroundColor: isDark ? 'rgba(152, 195, 121, 0.2)' : 'rgba(80, 161, 79, 0.2)' },
      { tag: tags.deleted, backgroundColor: isDark ? 'rgba(224, 108, 117, 0.2)' : 'rgba(228, 86, 73, 0.2)' },
    ])
  }, [isDark])

  const editorTheme = useMemo(() => {
    return EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`,
      },
      '.cm-scroller': {
        fontFamily: 'monospace',
        lineHeight: '1.5',
      },
      '.cm-content': {
        caretColor: isDark ? '#fff' : '#000',
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-line': {
        padding: '0 4px',
      },
    })
  }, [fontSize, isDark])

  const resultText = useMemo((): string => {
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

  return (
    <main className="p-4 h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 flex-shrink-0">
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
            <div className="flex flex-col gap-2 overflow-hidden">
              <Label className="font-semibold shrink-0 h-6" htmlFor="origin-text">Original text</Label>
              <div className="flex-1 border border-border rounded-md overflow-hidden">
                <CodeMirror
                  value={originText}
                  height="100%"
                  theme={isDark ? 'dark' : 'light'}
                  onChange={(value) => setOriginText(value)}
                  className="h-full"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: false,
                  }}
                  extensions={[editorTheme]}
                />
              </div>
            </div>

            {/* Changed Text */}
            <div className="flex flex-col gap-2 overflow-hidden">
              <Label className="font-semibold shrink-0 h-6" htmlFor="changed-text">Changed text</Label>
              <div className="flex-1 border border-border rounded-md overflow-hidden">
                <CodeMirror
                  value={changedText}
                  height="100%"
                  theme={isDark ? 'dark' : 'light'}
                  onChange={(value) => setChangedText(value)}
                  className="h-full"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: false,
                  }}
                  extensions={[editorTheme]}
                />
              </div>
            </div>
          </>
        )}

        {/* Result Diff View */}
        <div className={`${layoutClass} flex flex-col gap-2 overflow-hidden`}>
          {/* Result Header */}
          <div className="flex items-center justify-between h-6 flex-shrink-0">
            <Label className="font-semibold" htmlFor="result">Result (Markdown Diff)</Label>
            <div className="flex items-center gap-2">
              <Toggle variant="outline" size="sm" pressed={diffMode === 'split'} onPressedChange={toggleDiffMode} aria-label="Toggle diff view" title={diffMode === 'unified' ? 'Switch to split view' : 'Switch to unified view'} className="h-8 w-8 p-0">{diffMode === 'unified' ? <LayoutList size={16} /> : <LayoutGrid size={16} />}</Toggle>
              <Toggle variant="outline" size="sm" pressed={isExpanded} onPressedChange={toggleExpand} aria-label="Toggle expand view" title={isExpanded ? 'Collapse view' : 'Expand view'} className="h-8 w-8 p-0">{isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</Toggle>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(resultText)} aria-label="Copy diff to clipboard" title="Copy diff to clipboard" className="h-8 w-8" disabled={!resultText}><Copy size={16} /></Button>
            </div>
          </div>

          {/* Diff View Content */}
          {diffMode === 'unified' ? (
            <div className="flex-1 border border-border rounded-md overflow-hidden">
              <CodeMirror
                value={resultText}
                height="100%"
                theme={isDark ? 'dark' : 'light'}
                editable={false}
                className="h-full"
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLine: false,
                }}
                extensions={[
                  editorTheme,
                  syntaxHighlighting(diffHighlightStyle),
                  StreamLanguage.define(diff),
                ]}
              />
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-2 gap-2">
              {/* Original Text (Left) */}
              <div className="border border-border rounded-md overflow-hidden">
                <div className={`text-xs px-2 py-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>Original</div>
                <CodeMirror
                  value={originText}
                  height="calc(100% - 24px)"
                  theme={isDark ? 'dark' : 'light'}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: false,
                  }}
                  extensions={[editorTheme]}
                />
              </div>
              {/* Changed Text (Right) */}
              <div className="border border-border rounded-md overflow-hidden">
                <div className={`text-xs px-2 py-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>Modified</div>
                <CodeMirror
                  value={changedText}
                  height="calc(100% - 24px)"
                  theme={isDark ? 'dark' : 'light'}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: false,
                  }}
                  extensions={[editorTheme]}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Toast Container */}
      <Toaster />
    </main>
  )
}

export default App
