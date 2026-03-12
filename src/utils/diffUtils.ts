import { Change } from 'diff'
import { DiffBlock } from '@/types/version'

export function computeDiffBlocks(changes: Change[]): DiffBlock[] {
  const totalLines = changes.reduce((sum, c) => sum + (c.count || 0), 0)

  if (totalLines === 0) return []

  let currentLine = 0
  const blocks: DiffBlock[] = []

  changes.forEach(c => {
    if (c.added || c.removed) {
      blocks.push({
        type: c.added ? 'added' : 'removed',
        top: (currentLine / totalLines) * 100,
        height: ((c.count || 0) / totalLines) * 100,
      })
    }
    currentLine += c.count || 0
  })

  return blocks
}

export function formatDiffText(changes: Change[]): string {
  let result = ''
  changes.forEach(part => {
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
}

export function generateVersionId(): string {
  return crypto.randomUUID()
}
