import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { useCallback, useMemo, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { GitHubLogoIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { Minus, Plus } from 'lucide-react'
import './App.css'
import { DualTextMode } from '@/components/DualTextMode'
import { TimelineMode } from '@/components/TimelineMode'
import { AppMode } from '@/types/version'

const MIN_FONT_SIZE: number = 9
const MAX_FONT_SIZE: number = 24
const BASE_FONT_SIZE: number = MIN_FONT_SIZE

function App(): JSX.Element {
  const [fontSize, setFontSize] = useState<number>(BASE_FONT_SIZE)
  const [mode, setMode] = useState<AppMode>('dual')

  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 1, MAX_FONT_SIZE))
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 1, MIN_FONT_SIZE))
  }, [])

  const toggleTheme = useCallback(() => setTheme(isDark ? 'light' : 'dark'), [isDark, setTheme])

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
        fontSize: `${fontSize}px`,
      },
      '.cm-gutters': {
        fontSize: `${fontSize}px`,
      },
      '.cm-lineNumbers': {
        fontSize: `${fontSize}px`,
      },
      '&.cm-focused': {
        outline: 'none',
      },
      '.cm-line': {
        padding: '0 4px',
      },
      '.cm-scroller::-webkit-scrollbar': {
        width: '4px',
        height: '4px',
      },
      '.cm-scroller::-webkit-scrollbar-track': {
        background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
        borderRadius: '4px',
      },
      '.cm-scroller::-webkit-scrollbar-thumb': {
        background: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        borderRadius: '4px',
      },
      '.cm-scroller::-webkit-scrollbar-thumb:hover': {
        background: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      },
    })
  }, [fontSize, isDark])

  return (
    <main className="p-2 h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between mb-2 flex-shrink-0">
        <h1 className="text-lg font-bold flex items-center gap-2">Markdown Diff Block Generator</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={mode === 'dual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('dual')}
            className="h-8"
          >
            Dual
          </Button>
          <Button
            variant={mode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('timeline')}
            className="h-8"
          >
            Timeline
          </Button>
          <div className="w-px h-6 bg-border" />
          <Button
            variant="outline"
            size="icon"
            onClick={decreaseFontSize}
            className="h-8 w-8"
            title="Decrease font size"
            disabled={fontSize <= MIN_FONT_SIZE}
          >
            <Minus size={16} />
          </Button>
          <span className="text-xs w-8 text-center tabular-nums">{fontSize}px</span>
          <Button
            variant="outline"
            size="icon"
            onClick={increaseFontSize}
            className="h-8 w-8"
            title="Increase font size"
            disabled={fontSize >= MAX_FONT_SIZE}
          >
            <Plus size={16} />
          </Button>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="h-8 w-8" title="Toggle light/dark mode">
            {isDark ? <SunIcon /> : <MoonIcon />}
          </Button>
          <a
            href="https://github.com/joisun/markdow-diff-block-generater"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            title="View on GitHub"
          >
            <GitHubLogoIcon width={16} height={16} />
          </a>
        </div>
      </header>

      {mode === 'dual' ? (
        <DualTextMode fontSize={fontSize} theme={theme} editorTheme={editorTheme} />
      ) : (
        <TimelineMode fontSize={fontSize} theme={theme} editorTheme={editorTheme} />
      )}

      <Toaster />
    </main>
  )
}

export default App
