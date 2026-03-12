import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface InsertButtonProps {
  afterIndex: number
  onInsert: (afterIndex: number) => void
}

export function InsertButton({ afterIndex, onInsert }: InsertButtonProps) {
  return (
    <div className="flex items-center justify-center px-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onInsert(afterIndex)}
        className="h-8 w-8"
        title="Insert new version"
      >
        <Plus size={16} />
      </Button>
    </div>
  )
}
