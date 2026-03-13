import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { Change } from 'diff'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { unifiedMergeView } from '@codemirror/merge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Copy, SquarePlus, SquareMinus, Maximize2, Plus, Minus, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { computeDiffBlocks } from '@/utils/diffUtils'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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

export function DiffPanel({ diff, index, isExpanded, onToggle, onCopy, fontSize, theme, leftLabel, rightLabel }: DiffPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [dialogFontSize, setDialogFontSize] = useState(14)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const viewRef = useRef<EditorView | null>(null)
  const dialogViewRef = useRef<EditorView | null>(null)
  const diffBlocks = useMemo(() => computeDiffBlocks(diff), [diff])

  const handleClick = useCallback(() => {
    onToggle(index)
  }, [index, onToggle])

  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsCollapsed(!isCollapsed)
    },
    [isCollapsed],
  )

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      let diffText = ''
      diff.forEach((part) => {
        const prefix = part.added ? '+ ' : part.removed ? '- ' : '  '
        const lines = part.value.split('\n')
        const relevantLines = lines.length > 0 && lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines
        relevantLines.forEach((line) => {
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
            )`,
          }}
        >
          {diffBlocks.map((block, i) => (
            <div
              key={i}
              className={cn('absolute w-full', block.type === 'added' && (isDark ? 'bg-green-500/30' : 'bg-green-500/40'), block.type === 'removed' && (isDark ? 'bg-red-500/30' : 'bg-red-500/40'))}
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
    <motion.div layout initial={{ width: 60, opacity: 0 }} animate={{ width: 500, opacity: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="flex flex-col gap-2 overflow-hidden">
      <div className="flex items-center justify-between h-8 flex-shrink-0">
        <div className="cursor-pointer" onClick={handleClick} title="Collapse diff">
          <SquareMinus size={16} className="text-muted-foreground" />
        </div>
        <Label className="font-semibold text-sm">
          {leftLabel} → {rightLabel}
        </Label>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleToggleCollapse} className="h-6 w-6" title={isCollapsed ? 'Expand all unchanged regions' : 'Collapse all unchanged regions'}>
            {isCollapsed ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(true)} className="h-6 w-6" title="Fullscreen view">
            <Maximize2 size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-6 w-6" title="Copy diff">
            <Copy size={14} />
          </Button>
        </div>
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
          )`,
        }}
      >
        <div className="flex-1 overflow-hidden">
          <DiffViewer diff={diff} theme={theme} fontSize={fontSize} viewRef={viewRef} isCollapsed={isCollapsed} />
        </div>
        <div
          className="w-8 relative flex-shrink-0 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const y = e.clientY - rect.top
            const percentage = y / rect.height
            const container = e.currentTarget.previousElementSibling?.querySelector('.cm-scroller')
            if (container) {
              container.scrollTop = container.scrollHeight * percentage
            }
          }}
        >
          {diffBlocks.map((block, i) => (
            <div
              key={i}
              className={cn('absolute w-full', block.type === 'added' && (isDark ? 'bg-green-500/30' : 'bg-green-500/40'), block.type === 'removed' && (isDark ? 'bg-red-500/30' : 'bg-red-500/40'))}
              style={{
                top: `${block.top}%`,
                height: `${block.height}%`,
              }}
            />
          ))}
        </div>
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-8">
              <DialogTitle>
                {leftLabel} → {rightLabel}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleToggleCollapse} className="h-6 w-6" title={isCollapsed ? 'Expand all unchanged regions' : 'Collapse all unchanged regions'}>
                  {isCollapsed ? <ChevronsDownUp size={12} /> : <ChevronsUpDown size={12} />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => setDialogFontSize((prev) => Math.max(prev - 1, 9))} className="h-6 w-6" title="Decrease font size">
                  <Minus size={12} />
                </Button>
                <span className="text-xs w-8 text-center tabular-nums">{dialogFontSize}px</span>
                <Button variant="outline" size="icon" onClick={() => setDialogFontSize((prev) => Math.min(prev + 1, 24))} className="h-6 w-6" title="Increase font size">
                  <Plus size={12} />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 flex border border-border overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <DiffViewer diff={diff} theme={theme} fontSize={dialogFontSize} viewRef={dialogViewRef} isCollapsed={isCollapsed} />
            </div>
            <div
              className="w-8 relative flex-shrink-0 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const y = e.clientY - rect.top
                const percentage = y / rect.height
                const container = e.currentTarget.previousElementSibling?.querySelector('.cm-scroller')
                if (container) {
                  container.scrollTop = container.scrollHeight * percentage
                }
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
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

interface DiffViewerProps {
  diff: Change[]
  theme: 'dark' | 'light'
  fontSize: number
  viewRef: React.MutableRefObject<EditorView | null>
  isCollapsed: boolean
}

function DiffViewer({ diff, theme, fontSize, viewRef, isCollapsed }: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { original, modified } = useMemo(() => {
    let orig = ''
    let mod = ''
    diff.forEach((part) => {
      if (part.removed) {
        orig += part.value
      } else if (part.added) {
        mod += part.value
      } else {
        orig += part.value
        mod += part.value
      }
    })
    return { original: orig, modified: mod }
  }, [diff])

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: modified,
        extensions: [
          unifiedMergeView({
            original,
            mergeControls: false,
            highlightChanges: true,
            gutter: true,
            collapseUnchanged: isCollapsed ? { margin: 3, minSize: 4 } : undefined,
          }),
          EditorView.editable.of(false),
          EditorView.theme({
            '&': { height: '100%', fontSize: `${fontSize}px` },
            '.cm-scroller': { fontFamily: 'monospace', lineHeight: '1.5' },
            '.cm-collapsedLines': {
              background: 'transparent !important',
              backgroundImage: 'none !important',
            },
          }),
        ],
      }),
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [original, modified, fontSize, theme, viewRef, isCollapsed])

  return <div ref={containerRef} className="h-full" />
}
