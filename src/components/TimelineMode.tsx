import { useState, useMemo, useCallback } from 'react'
import { diffLines } from 'diff'
import { EditorView } from '@codemirror/view'
import { Version } from '@/types/version'
import { generateVersionId } from '@/utils/diffUtils'
import { DiffTimeline } from './timeline/DiffTimeline'
import { useToast } from '@/hooks/use-toast'

interface TimelineModeProps {
  fontSize: number
  theme: 'dark' | 'light'
  editorTheme: ReturnType<typeof EditorView.theme>
  versions: Version[]
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>
  expandedDiffs: Set<number>
  setExpandedDiffs: React.Dispatch<React.SetStateAction<Set<number>>>
  expandedVersions: Set<number>
  setExpandedVersions: React.Dispatch<React.SetStateAction<Set<number>>>
  onCopyAllDiffs: () => void
}

export function TimelineMode({
  fontSize,
  theme,
  editorTheme,
  versions,
  setVersions,
  expandedDiffs,
  setExpandedDiffs,
  expandedVersions,
  setExpandedVersions,
  onCopyAllDiffs,
}: TimelineModeProps) {
  const { toast } = useToast()

  const diffs = useMemo(() => {
    return versions.slice(0, -1).map((version, index) => {
      return diffLines(version.content, versions[index + 1].content)
    })
  }, [versions])

  const handleUpdateVersion = useCallback((index: number, content: string) => {
    setVersions(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], content }
      return updated
    })
  }, [])

  const handleInsertVersion = useCallback((afterIndex: number) => {
    const isLastPosition = afterIndex === versions.length - 1

    setVersions(prev => {
      const updated = [...prev]
      const maxVersionNum = prev.reduce((max, v) => {
        const match = v.label?.match(/^v(\d+)$/)
        return match ? Math.max(max, parseInt(match[1])) : max
      }, 0)
      const newVersion: Version = {
        id: generateVersionId(),
        content: '',
        label: `v${maxVersionNum + 1}`,
      }
      updated.splice(afterIndex + 1, 0, newVersion)
      return updated
    })

    setExpandedVersions(prev => {
      const next = new Set(prev)
      next.add(afterIndex + 1)
      return next
    })

    if (isLastPosition) {
      setTimeout(() => {
        const panels = document.querySelectorAll('[data-version-index]')
        const targetPanel = panels[afterIndex + 1]
        if (targetPanel) {
          targetPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
        }
      }, 100)
    }
  }, [versions.length, setExpandedVersions])

  const handleDeleteVersion = useCallback((index: number) => {
    if (versions.length <= 2) {
      toast({
        title: 'Cannot delete',
        description: 'At least 2 versions are required',
        variant: 'destructive',
        duration: 2000,
      })
      return
    }

    setVersions(prev => prev.filter((_, i) => i !== index))
    setExpandedDiffs(new Set())
  }, [versions.length, toast])

  const handleToggleDiff = useCallback((index: number) => {
    setExpandedDiffs(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const handleToggleVersion = useCallback((index: number) => {
    setExpandedVersions(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const handleCopyDiff = useCallback(
    (diffText: string) => {
      navigator.clipboard.writeText('```diff\n' + diffText + '\n```')
      toast({
        title: 'Copied to clipboard',
        description: 'Diff content copied as markdown code block',
        duration: 2000,
      })
    },
    [toast],
  )

  return (
    <DiffTimeline
      versions={versions}
      diffs={diffs}
      expandedDiffs={expandedDiffs}
      expandedVersions={expandedVersions}
      onUpdateVersion={handleUpdateVersion}
      onInsertVersion={handleInsertVersion}
      onDeleteVersion={handleDeleteVersion}
      onToggleDiff={handleToggleDiff}
      onToggleVersion={handleToggleVersion}
      onCopyDiff={handleCopyDiff}
      onCopyAllDiffs={onCopyAllDiffs}
      fontSize={fontSize}
      theme={theme}
      editorTheme={editorTheme}
    />
  )
}
