import { useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { Version } from '@/types/version'
import { cn } from '@/lib/utils'

interface VersionPanelProps {
  version: Version
  index: number
  isLeftOfFocusedDiff: boolean
  onUpdate: (index: number, content: string) => void
  onDelete: (index: number) => void
  canDelete: boolean
  fontSize: number
  theme: 'dark' | 'light'
  editorTheme: ReturnType<typeof EditorView.theme>
}

export function VersionPanel({
  version,
  index,
  isLeftOfFocusedDiff,
  onUpdate,
  onDelete,
  canDelete,
  fontSize,
  theme,
  editorTheme,
}: VersionPanelProps) {
  const handleChange = useCallback(
    (value: string) => {
      onUpdate(index, value)
    },
    [index, onUpdate]
  )

  const handleDelete = useCallback(() => {
    onDelete(index)
  }, [index, onDelete])

  return (
    <div
      className={cn(
        'flex flex-col gap-2 overflow-hidden transition-all duration-300',
        isLeftOfFocusedDiff ? 'w-[120px]' : 'w-[400px]'
      )}
    >
      <div className="flex items-center justify-between h-8 flex-shrink-0">
        <Label className="font-semibold text-sm">
          {version.label || `v${index + 1}`}
        </Label>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-6 w-6"
            title="Delete version"
          >
            <Trash2 size={14} />
          </Button>
        )}
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
    </div>
  )
}
