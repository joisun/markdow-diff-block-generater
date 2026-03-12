import { useState, useMemo, useCallback, useEffect } from 'react'
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
}

export function TimelineMode({ fontSize, theme, editorTheme }: TimelineModeProps) {
  const { toast } = useToast()

  const [versions, setVersions] = useState<Version[]>([
    { id: generateVersionId(), content: '', label: 'v1' },
    { id: generateVersionId(), content: '', label: 'v2' },
  ])

  const [focusedDiffIndex, setFocusedDiffIndex] = useState<number | null>(null)

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
    setVersions(prev => {
      const updated = [...prev]
      const newVersion: Version = {
        id: generateVersionId(),
        content: '',
        label: `v${prev.length + 1}`,
      }
      updated.splice(afterIndex + 1, 0, newVersion)
      return updated
    })
  }, [])

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
    setFocusedDiffIndex(null)
  }, [versions.length, toast])

  const handleFocusDiff = useCallback((index: number) => {
    setFocusedDiffIndex(index === -1 ? null : index)
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
    [toast]
  )

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && focusedDiffIndex !== null && focusedDiffIndex > 0) {
        setFocusedDiffIndex(focusedDiffIndex - 1)
        e.preventDefault()
      } else if (e.key === 'ArrowRight' && focusedDiffIndex !== null && focusedDiffIndex < diffs.length - 1) {
        setFocusedDiffIndex(focusedDiffIndex + 1)
        e.preventDefault()
      } else if (e.key === 'Escape' && focusedDiffIndex !== null) {
        setFocusedDiffIndex(null)
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedDiffIndex, diffs.length])

  return (
    <DiffTimeline
      versions={versions}
      diffs={diffs}
      focusedDiffIndex={focusedDiffIndex}
      onUpdateVersion={handleUpdateVersion}
      onInsertVersion={handleInsertVersion}
      onDeleteVersion={handleDeleteVersion}
      onFocusDiff={handleFocusDiff}
      onCopyDiff={handleCopyDiff}
      onCopyAllDiffs={handleCopyAllDiffs}
      fontSize={fontSize}
      theme={theme}
      editorTheme={editorTheme}
    />
  )
}
