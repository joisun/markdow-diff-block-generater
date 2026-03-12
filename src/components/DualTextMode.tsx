import { useState, useCallback, useMemo } from 'react'
import { diffLines, Change } from 'diff'
import { EditorView } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import { diff } from '@codemirror/legacy-modes/mode/diff'
import { tags } from '@lezer/highlight'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Copy, Maximize2, Minimize2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DualTextModeProps {
  fontSize: number
  theme: 'dark' | 'light'
  editorTheme: ReturnType<typeof EditorView.theme>
}

export function DualTextMode({ fontSize, theme, editorTheme }: DualTextModeProps) {
  const { toast } = useToast()
  const isDark = theme === 'dark'

  const [originText, setOriginText] = useState<string>('')
  const [changedText, setChangedText] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  const toggleExpand = useCallback(() => setIsExpanded(prev => !prev), [])

  const copyToClipboard = useCallback(
    async (textToCopy: string) => {
      if (!textToCopy) {
        toast({
          title: 'Nothing to copy',
          description: 'The result text is empty.',
          variant: 'destructive',
          duration: 2000,
        })
        return
      }
      try {
        await navigator.clipboard.writeText('```diff\n' + textToCopy + '\n```')
        toast({
          title: 'Copied to clipboard',
          description: 'Diff content copied as markdown code block',
          duration: 2000,
        })
      } catch (error) {
        console.error('Failed to copy text:', error)
        toast({
          title: 'Copy failed',
          description: 'Could not copy to clipboard',
          variant: 'destructive',
          duration: 2000,
        })
      }
    },
    [toast]
  )

  const diffHighlightStyle = useMemo(() => {
    return HighlightStyle.define([
      { tag: tags.inserted, backgroundColor: isDark ? 'rgba(152, 195, 121, 0.2)' : 'rgba(80, 161, 79, 0.2)' },
      { tag: tags.deleted, backgroundColor: isDark ? 'rgba(224, 108, 117, 0.2)' : 'rgba(228, 86, 73, 0.2)' },
    ])
  }, [isDark])

  const resultText = useMemo((): string => {
    if (!originText && !changedText) return ''
    const oldT = originText || ''
    const newT = changedText || ''
    const diffResult: Change[] = diffLines(oldT, newT)
    let result = ''
    diffResult.forEach(part => {
      const prefix = part.added ? '+ ' : part.removed ? '- ' : '  '
      const lines = part.value.split('\n')
      const relevantLines = lines.length > 0 && lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines
      relevantLines.forEach(line => {
        if (line || relevantLines.length === 1) {
          result += `${prefix}${line}\n`
        }
      })
    })
    return result
  }, [changedText, originText])

  const layoutClass = isExpanded ? 'col-span-3 h-full' : 'h-full'
  const mainLayoutClass = isExpanded ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'

  return (
    <section className={`flex-1 grid ${mainLayoutClass} gap-2 overflow-hidden`}>
      {!isExpanded && (
        <>
          <div className="flex flex-col gap-2 overflow-hidden">
            <Label className="font-semibold shrink-0 h-8" htmlFor="origin-text">
              Original text
            </Label>
            <div className="flex-1 border border-border overflow-hidden">
              <CodeMirror
                value={originText}
                height="100%"
                theme={isDark ? 'dark' : 'light'}
                onChange={setOriginText}
                className="h-full"
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLine: false,
                }}
                extensions={[editorTheme]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 overflow-hidden">
            <Label className="font-semibold shrink-0 h-8" htmlFor="changed-text">
              Changed text
            </Label>
            <div className="flex-1 border border-border overflow-hidden">
              <CodeMirror
                value={changedText}
                height="100%"
                theme={isDark ? 'dark' : 'light'}
                onChange={setChangedText}
                className="h-full"
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLine: false,
                }}
                extensions={[editorTheme]}
              />
            </div>
          </div>
        </>
      )}

      <div className={`${layoutClass} flex flex-col gap-2 overflow-hidden`}>
        <div className="flex items-center justify-between h-8 flex-shrink-0">
          <Label className="font-semibold" htmlFor="result">
            Result (Markdown Diff)
          </Label>
          <div className="flex items-center gap-2">
            <Toggle
              variant="outline"
              size="sm"
              pressed={isExpanded}
              onPressedChange={toggleExpand}
              aria-label="Toggle expand view"
              title={isExpanded ? 'Collapse view' : 'Expand view'}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Toggle>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(resultText)}
              aria-label="Copy diff to clipboard"
              title="Copy diff to clipboard"
              className="h-8 w-8"
              disabled={!resultText}
            >
              <Copy size={16} />
            </Button>
          </div>
        </div>

        <div className="flex-1 border border-border overflow-hidden">
          <CodeMirror
            value={resultText}
            height="100%"
            theme={isDark ? 'dark' : 'light'}
            editable={false}
            className="h-full"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: false,
            }}
            extensions={[editorTheme, syntaxHighlighting(diffHighlightStyle), StreamLanguage.define(diff)]}
          />
        </div>
      </div>
    </section>
  )
}
