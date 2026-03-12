import { useMemo, useCallback } from 'react'
import { Change } from 'diff'
import CodeMirror from '@uiw/react-codemirror'
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { diff as diffMode } from '@codemirror/legacy-modes/mode/diff'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Copy, SquarePlus, SquareMinus } from 'lucide-react'
import { computeDiffBlocks } from '@/utils/diffUtils'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface DiffPanelProps {
  diff: Change[]
  index: number
  isExpanded: boolean
  onToggle: (index: number) => void
  onCopy: (diffText: string) => void
  fontSize: number
  theme: 'dark' | 'light'
  leftLabel: string
  rightLabel: string
}

export function DiffPanel({
  diff,
  index,
  isExpanded,
  onToggle,
  onCopy,
  fontSize,
  theme,
  leftLabel,
  rightLabel,
}: DiffPanelProps) {
  const diffBlocks = useMemo(() => computeDiffBlocks(diff), [diff])

  const handleClick = useCallback(() => {
    onToggle(index)
  }, [index, onToggle])

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

  if (!isExpanded) {
    return (
      <motion.div
        layout
        initial={{ width: 500, opacity: 0 }}
        animate={{ width: 60, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col gap-2 overflow-hidden cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center justify-start h-8 flex-shrink-0 pl-2">
          <SquarePlus size={16} className="text-muted-foreground" />
        </div>
        <div
          className="flex-1 border border-border overflow-hidden relative"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'} 10px,
              ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'} 20px
            )`
          }}
        >
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
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ width: 60, opacity: 0 }}
      animate={{ width: 500, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col gap-2 overflow-hidden"
    >
      <div className="flex items-center justify-between h-8 flex-shrink-0">
        <div className="cursor-pointer" onClick={handleClick} title="Collapse diff">
          <SquareMinus size={16} className="text-muted-foreground" />
        </div>
        <Label className="font-semibold text-sm">
          {leftLabel} → {rightLabel}
        </Label>
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
      <div
        className="flex-1 flex border border-border overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'} 10px,
            ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'} 20px
          )`
        }}
      >
        <div className="flex-1 overflow-hidden">
          <DiffViewer diff={diff} theme={theme} fontSize={fontSize} />
        </div>
        <div className="w-2 relative flex-shrink-0">
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
    </motion.div>
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
        backgroundColor: 'transparent !important',
      },
      '.cm-scroller': {
        fontFamily: 'monospace',
        lineHeight: '1.5',
        backgroundColor: 'transparent !important',
      },
      '.cm-gutters': {
        borderRight: 'none',
      },
      '.cm-content': {
        fontSize: `${fontSize}px`,
        backgroundColor: 'transparent !important',
      },
      '.cm-editor': {
        backgroundColor: 'transparent !important',
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
