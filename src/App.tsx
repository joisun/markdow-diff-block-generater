import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group'
import { Toaster } from '@/components/ui/toaster'
import { useCallback, useMemo, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { GitHubLogoIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { Minus, Plus, SquareStack, Trash2, Maximize2, Minimize2, GitCompare, Layers, Download, Upload } from 'lucide-react'
import './App.css'
import { TimelineMode } from '@/components/TimelineMode'
import { Version } from '@/types/version'
import { generateVersionId } from '@/utils/diffUtils'
import { diffLines } from 'diff'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const MIN_FONT_SIZE: number = 9
const MAX_FONT_SIZE: number = 24
const BASE_FONT_SIZE: number = MIN_FONT_SIZE

function App(): JSX.Element {
  const [fontSize, setFontSize] = useState<number>(BASE_FONT_SIZE)
  const [versions, setVersions] = useState<Version[]>([
    { id: generateVersionId(), content: '', label: 'v1' },
    { id: generateVersionId(), content: '', label: 'v2' },
  ])
  const [expandedDiffs, setExpandedDiffs] = useState<Set<number>>(new Set())
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(
    new Set([0, 1]),
  )

  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const { toast } = useToast()

  const diffs = useMemo(() => {
    return versions.slice(0, -1).map((version, index) => {
      return diffLines(version.content, versions[index + 1].content)
    })
  }, [versions])

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 1, MAX_FONT_SIZE))
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 1, MIN_FONT_SIZE))
  }, [])

  const toggleTheme = useCallback(() => setTheme(isDark ? 'light' : 'dark'), [isDark, setTheme])

  const expandAllDiffs = useCallback(() => {
    setExpandedDiffs(new Set(versions.slice(0, -1).map((_, i) => i)))
  }, [versions])

  const collapseAllDiffs = useCallback(() => {
    setExpandedDiffs(new Set())
  }, [])

  const expandAllVersions = useCallback(() => {
    setExpandedVersions(new Set(versions.map((_, i) => i)))
  }, [versions])

  const collapseAllVersions = useCallback(() => {
    setExpandedVersions(new Set())
  }, [])

  const expandAll = useCallback(() => {
    expandAllDiffs()
    expandAllVersions()
  }, [expandAllDiffs, expandAllVersions])

  const collapseAll = useCallback(() => {
    collapseAllDiffs()
    collapseAllVersions()
  }, [collapseAllDiffs, collapseAllVersions])

  const handleCopyAllDiffs = useCallback(() => {
    const allDiffsText = diffs
      .map((diff, index) => {
        let diffText = ''
        diff.forEach(part => {
          const prefix = part.added ? '+ ' : part.removed ? '- ' : '  '
          const lines = part.value.split('\n')
          const relevantLines = lines.length > 0 && lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines
          relevantLines.forEach(line => {
            if (line || relevantLines.length === 1) {
              diffText += `${prefix}${line}\n`
            }
          })
        })
        const v1Label = versions[index].label || `v${index + 1}`
        const v2Label = versions[index + 1].label || `v${index + 2}`
        return `\`\`\`diff\n// ${v1Label} → ${v2Label}\n${diffText}\`\`\``
      })
      .join('\n\n')

    navigator.clipboard.writeText(allDiffsText)
    toast({
      title: 'Copied all diffs',
      description: `${diffs.length} diff blocks copied to clipboard`,
      duration: 2000,
    })
  }, [diffs, versions, toast])

  const handleInit = useCallback(() => {
    setVersions([
      { id: generateVersionId(), content: '', label: 'v1' },
      { id: generateVersionId(), content: '', label: 'v2' },
    ])
    setExpandedDiffs(new Set())
    setExpandedVersions(new Set([0, 1]))
  }, [])

  const handleExport = useCallback(() => {
    const data = {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      fontSize,
      theme,
      versions,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diff-timeline-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Exported successfully',
      description: 'Timeline data saved to JSON file',
      duration: 2000,
    })
  }, [fontSize, theme, versions, toast])

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (!data.version || !Array.isArray(data.versions) || data.versions.length < 2) {
          throw new Error('Invalid format')
        }
        if (typeof data.fontSize !== 'number' || data.fontSize < 9 || data.fontSize > 24) {
          throw new Error('Invalid fontSize')
        }
        if (data.theme !== 'dark' && data.theme !== 'light') {
          throw new Error('Invalid theme')
        }
        setVersions(data.versions)
        setFontSize(data.fontSize)
        setTheme(data.theme)
        setExpandedDiffs(new Set())
        setExpandedVersions(new Set([0, 1]))
        toast({
          title: 'Imported successfully',
          description: `Loaded ${data.versions.length} versions`,
          duration: 2000,
        })
      } catch (err) {
        toast({
          title: 'Import failed',
          description: err instanceof Error ? err.message : 'Invalid JSON file',
          variant: 'destructive',
          duration: 3000,
        })
      }
    }
    reader.readAsText(file)
  }, [setTheme, toast])

  const editorTheme = useMemo(() => {
    return EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`,
        backgroundColor: 'transparent !important',
      },
      '.cm-scroller': {
        fontFamily: 'monospace',
        lineHeight: '1.5',
        backgroundColor: 'transparent !important',
      },
      '.cm-content': {
        caretColor: isDark ? '#fff' : '#000',
        fontSize: `${fontSize}px`,
        backgroundColor: 'transparent !important',
      },
      '.cm-gutters': {
        fontSize: `${fontSize}px`,
        borderRight: 'none',
      },
      '.cm-lineNumbers': {
        fontSize: `${fontSize}px`,
      },
      '.cm-editor': {
        backgroundColor: 'transparent !important',
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
        <div className="flex items-center gap-2">
          <ButtonGroup>
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="h-8"
              title="Expand all panels"
            >
              <Maximize2 size={14} className="mr-1" />
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="h-8"
              title="Collapse all panels"
            >
              <Minimize2 size={14} className="mr-1" />
              Collapse All
            </Button>
            <ButtonGroupSeparator />
            <Button
              variant="outline"
              size="sm"
              onClick={expandAllDiffs}
              className="h-8"
              title="Expand all diff panels"
            >
              <GitCompare size={14} className="mr-1" />
              Expand Diffs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={expandAllVersions}
              className="h-8"
              title="Expand all version panels"
            >
              <Layers size={14} className="mr-1" />
              Expand Versions
            </Button>
          </ButtonGroup>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive"
                title="Reset all panels"
              >
                <Trash2 size={14} className="mr-1" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all panels?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all current panels and reset to 2 empty versions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleInit}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyAllDiffs}
            className="h-8 w-8"
            title="Copy all diffs"
          >
            <SquareStack size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            className="h-8 w-8"
            title="Export to JSON"
          >
            <Download size={16} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Import from JSON"
              >
                <Upload size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Import from JSON?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will replace all current data. Make sure to export first if you want to save your work.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.json'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleImport(file)
                  }
                  input.click()
                }}>
                  Choose File
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
            title="Markdown Diff Block Generator - View on GitHub"
          >
            <GitHubLogoIcon width={16} height={16} />
          </a>
        </div>
      </header>

      <TimelineMode
        fontSize={fontSize}
        theme={theme}
        editorTheme={editorTheme}
        versions={versions}
        setVersions={setVersions}
        expandedDiffs={expandedDiffs}
        setExpandedDiffs={setExpandedDiffs}
        expandedVersions={expandedVersions}
        setExpandedVersions={setExpandedVersions}
        onCopyAllDiffs={handleCopyAllDiffs}
      />

      <Toaster />
    </main>
  )
}

export default App
