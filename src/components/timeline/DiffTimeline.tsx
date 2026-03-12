import { Change } from 'diff'
import { EditorView } from '@codemirror/view'
import { Version } from '@/types/version'
import { VersionPanel } from './VersionPanel'
import { DiffPanel } from './DiffPanel'
import { InsertButton } from './InsertButton'

interface DiffTimelineProps {
  versions: Version[]
  diffs: Change[][]
  focusedDiffIndex: number | null
  onUpdateVersion: (index: number, content: string) => void
  onInsertVersion: (afterIndex: number) => void
  onDeleteVersion: (index: number) => void
  onFocusDiff: (index: number) => void
  onCopyDiff: (diffText: string) => void
  onCopyAllDiffs: () => void
  fontSize: number
  theme: 'dark' | 'light'
  editorTheme: ReturnType<typeof EditorView.theme>
}

export function DiffTimeline({
  versions,
  diffs,
  focusedDiffIndex,
  onUpdateVersion,
  onInsertVersion,
  onDeleteVersion,
  onFocusDiff,
  onCopyDiff,
  onCopyAllDiffs,
  fontSize,
  theme,
  editorTheme,
}: DiffTimelineProps) {
  const canDelete = versions.length > 2

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex h-full gap-2 p-2">
        {versions.map((version, index) => {
          const isLeftOfFocusedDiff = focusedDiffIndex !== null && index === focusedDiffIndex
          const diffIndex = index
          const hasDiff = index < versions.length - 1
          const isLast = index === versions.length - 1

          return (
            <div key={version.id} className="flex gap-2 h-full">
              <VersionPanel
                version={version}
                index={index}
                isLeftOfFocusedDiff={isLeftOfFocusedDiff}
                onUpdate={onUpdateVersion}
                onDelete={onDeleteVersion}
                canDelete={canDelete}
                fontSize={fontSize}
                theme={theme}
                editorTheme={editorTheme}
              />

              {hasDiff && (
                <>
                  <InsertButton
                    afterIndex={index}
                    onInsert={onInsertVersion}
                  />
                  <DiffPanel
                    diff={diffs[diffIndex]}
                    index={diffIndex}
                    isFocused={focusedDiffIndex === diffIndex}
                    onFocus={onFocusDiff}
                    onCopy={onCopyDiff}
                    fontSize={fontSize}
                    theme={theme}
                  />
                </>
              )}

              {isLast && (
                <InsertButton
                  afterIndex={index}
                  onInsert={onInsertVersion}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
