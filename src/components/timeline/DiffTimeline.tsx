import { Change } from 'diff'
import { EditorView } from '@codemirror/view'
import { Version } from '@/types/version'
import { VersionPanel } from './VersionPanel'
import { DiffPanel } from './DiffPanel'
import { InsertButton } from './InsertButton'

interface DiffTimelineProps {
  versions: Version[]
  diffs: Change[][]
  expandedDiffs: Set<number>
  expandedVersions: Set<number>
  onUpdateVersion: (index: number, content: string) => void
  onInsertVersion: (afterIndex: number) => void
  onDeleteVersion: (index: number) => void
  onToggleDiff: (index: number) => void
  onToggleVersion: (index: number) => void
  onCopyDiff: (diffText: string) => void
  onCopyAllDiffs: () => void
  fontSize: number
  theme: 'dark' | 'light'
  editorTheme: ReturnType<typeof EditorView.theme>
}

export function DiffTimeline({
  versions,
  diffs,
  expandedDiffs,
  expandedVersions,
  onUpdateVersion,
  onInsertVersion,
  onDeleteVersion,
  onToggleDiff,
  onToggleVersion,
  onCopyDiff,
  fontSize,
  theme,
  editorTheme,
}: DiffTimelineProps) {
  const canDelete = versions.length > 2
  const isDark = theme === 'dark'

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div
        className="h-12"
        title="在此区域滚动以移动面板，避免触发编辑器内部滚动"
        style={{
          backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 1px, transparent 1px)`,
          backgroundSize: '10px 10px',
        }}
      />
      <div className="flex p-2" style={{ height: 'calc(100% - 48px)' }}>
        {versions.map((version, index) => {
          const diffIndex = index
          const hasDiff = index < versions.length - 1

          return (
            <div key={version.id} className="flex h-full">
              <VersionPanel
                version={version}
                index={index}
                isExpanded={expandedVersions.has(index)}
                onUpdate={onUpdateVersion}
                onDelete={onDeleteVersion}
                onToggle={onToggleVersion}
                canDelete={canDelete}
                fontSize={fontSize}
                theme={theme}
                editorTheme={editorTheme}
              />

              <div className="relative w-6 flex-shrink-0">
                <InsertButton afterIndex={index} onInsert={onInsertVersion} />
              </div>

              {hasDiff && (
                <>
                  <DiffPanel
                    diff={diffs[diffIndex]}
                    index={diffIndex}
                    isExpanded={expandedDiffs.has(diffIndex)}
                    onToggle={onToggleDiff}
                    onCopy={onCopyDiff}
                    fontSize={fontSize}
                    theme={theme}
                    leftLabel={versions[diffIndex].label || `v${diffIndex + 1}`}
                    rightLabel={versions[diffIndex + 1].label || `v${diffIndex + 2}`}
                  />
                  <div className="w-2 flex-shrink-0" />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
