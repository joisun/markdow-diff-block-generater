import { useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Trash2, SquarePlus, SquareMinus } from 'lucide-react'
import { Version } from '@/types/version'
import { motion } from 'framer-motion'

interface VersionPanelProps {
  version: Version
  index: number
  isExpanded: boolean
  onUpdate: (index: number, content: string) => void
  onDelete: (index: number) => void
  onToggle: (index: number) => void
  canDelete: boolean
  fontSize: number
  theme: 'dark' | 'light'
  editorTheme: ReturnType<typeof EditorView.theme>
}

export function VersionPanel({
  version,
  index,
  isExpanded,
  onUpdate,
  onDelete,
  onToggle,
  canDelete,
  theme,
  editorTheme,
}: VersionPanelProps) {
  const handleChange = useCallback(
    (value: string) => {
      onUpdate(index, value)
    },
    [index, onUpdate],
  )

  const handleDelete = useCallback(() => {
    onDelete(index)
  }, [index, onDelete])

  const handleToggle = useCallback(() => {
    onToggle(index)
  }, [index, onToggle])

  if (!isExpanded) {
    return (
      <motion.div
        layout
        initial={{ width: 400, opacity: 0 }}
        animate={{ width: 60, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col gap-2 overflow-hidden cursor-pointer"
        onClick={handleToggle}
        data-version-index={index}
      >
        <div className="flex items-center justify-start h-8 flex-shrink-0 pl-2">
          <SquarePlus size={16} className="text-muted-foreground" />
        </div>
        <div className="flex-1 border border-border overflow-hidden flex items-center justify-center">
          <Label className="font-semibold text-sm text-center writing-mode-vertical">
            {version.label || `v${index + 1}`}
          </Label>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ width: 60, opacity: 0 }}
      animate={{ width: 400, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative flex flex-col gap-2 overflow-hidden"
      data-version-index={index}
    >
      <div className="flex items-center justify-between h-8 flex-shrink-0">
        <div className="cursor-pointer" onClick={handleToggle} title="Collapse version">
          <SquareMinus size={16} className="text-muted-foreground" />
        </div>
        <Label className="font-semibold text-sm">
          {version.label || `v${index + 1}`}
        </Label>
        <div className="flex items-center gap-1">
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-5 w-5"
              title="Delete version"
            >
              <Trash2 size={12} />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 border border-border overflow-hidden">
        <CodeMirror
          value={version.content}
          height="100%"
          theme={theme}
          onChange={handleChange}
          className="h-full"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: false,
          }}
          extensions={[editorTheme]}
        />
      </div>
    </motion.div>
  )
}
