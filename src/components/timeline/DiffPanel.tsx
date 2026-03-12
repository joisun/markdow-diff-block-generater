import { useMemo, useCallback } from 'react'
import { Change } from 'diff'
import CodeMirror from '@uiw/react-codemirror'
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { diff as diffMode } from '@codemirror/legacy-modes/mode/diff'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { computeDiffBlocks } from '@/utils/diffUtils'
import { cn } from '@/lib/utils'

interface DiffPanelProps {
  diff: Change[]
  index: number
  isFocused: boolean
  onFocus: (index: number) => void
  onCopy: (diffText: string) => void
  fontSize: number
  theme: 'dark' | 'light'
}

export function DiffPanel({
  diff,
  index,
  isFocused,
  onFocus,
  onCopy,
  fontSize,
  theme,
}: DiffPanelProps) {
  const diffBlocks = useMemo(() => computeDiffBlocks(diff), [diff])

  const handleClick = useCallback(() => {
    onFocus(isFocused ? -1 : index)
  }, [index, isFocused, onFocus])

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      let diffText = ''
      diff.forEach(part => {
        const prefix = part.added ? '+ ' : part.removed ? '- ' : '  '
        const lines = part.value.split('\n')
        const relevantLines = lines.length > 0 && lines[lines.length - 1] === ''
          ? lines.slice(0, -1)
          : lines
        relevantLines.forEach(line => {
          if (line || relevantLines.length === 1) {
            diffText += `${prefix}${line}\n`
          }
        })
      })
      onCopy(diffText)
    },
    [diff, onCopy],
  )

  const isDark = theme === 'dark'

  if (!isFocused) {
    return (
      <div
        className={cn(
          'flex flex-col gap-2 overflow-hidden cursor-pointer transition-all duration-300',
          'w-[60px]',
        )}
        onClick={handleClick}
      >
        <div className="flex items-center justify-center h-8 flex-shrink-0">
          <span className="text-xs text-muted-foreground">diff</span>
        </div>
        <div className="flex-1 border border-border overflow-hidden relative bg-muted">
          {diffBlocks.map((block, i) => (
            <div
              key={i}
              className={cn(
                'absolute w-full',
                block.type === 'added' && (isDark ? 'bg-green-500/30' : 'bg-green-500/40'),
                block.type === 'removed' && (isDark ? 'bg-red-500/30' : 'bg-red-500/40'),
              )}
              style={{
                top: `${block.top}%`,
                height: `${block.height}%`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 overflow-hidden transition-all duration-300',
        'w-[500px]',
      )}
    >
      <div className="flex items-center justify-between h-8 flex-shrink-0">
        <span className="text-xs text-muted-foreground cursor-pointer" onClick={handleClick}>
          diff (click to collapse)
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-6 w-6"
          title="Copy diff"
        >
          <Copy size={14} />
        </Button>
      </div>
      <div className="flex-1 border border-border overflow-hidden">
        <DiffViewer diff={diff} theme={theme} fontSize={fontSize} />
      </div>
    </div>
  )
}

interface DiffViewerProps {
  diff: Change[]
  theme: 'dark' | 'light'
  fontSize: number
}

function DiffViewer({ diff, theme, fontSize }: DiffViewerProps) {
  const isDark = theme === 'dark'

  const diffText = useMemo(() => {
    let result = ''
    diff.forEach(part => {
      const prefix = part.added ? '+ ' : part.removed ? '- ' : '  '
      const lines = part.value.split('\n')
      const relevantLines = lines.length > 0 && lines[lines.length - 1] === ''
        ? lines.slice(0, -1)
        : lines
      relevantLines.forEach(line => {
        if (line || relevantLines.length === 1) {
          result += `${prefix}${line}\n`
        }
      })
    })
    return result
  }, [diff])

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
        fontSize: `${fontSize}px`,
      },
    })
  }, [fontSize])

  return (
    <CodeMirror
      value={diffText}
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
        StreamLanguage.define(diffMode),
      ]}
    />
  )
}
