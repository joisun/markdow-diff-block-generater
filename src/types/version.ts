export interface Version {
  id: string
  content: string
  label?: string
}

export interface DiffBlock {
  type: 'added' | 'removed'
  top: number
  height: number
}

export type AppMode = 'dual' | 'timeline'
