import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface InsertButtonProps {
  afterIndex: number
  onInsert: (afterIndex: number) => void
}

export function InsertButton({ afterIndex, onInsert }: InsertButtonProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Button
        variant="link"
        size="icon"
        onClick={() => onInsert(afterIndex)}
        className="h-6 w-6"
        title="Insert new version"
      >
        <Plus size={14} />
      </Button>
    </div>
  )
}
