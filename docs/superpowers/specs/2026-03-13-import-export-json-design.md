# Import/Export JSON Feature Design

## Overview
Add import/export functionality to save and restore the complete application state as JSON files.

## Data Structure

```typescript
interface ExportData {
  version: string          // Format version (e.g., "1.0.0")
  exportTime: string       // ISO timestamp
  fontSize: number         // 9-24
  theme: 'dark' | 'light'
  versions: Version[]      // Array of versions with id, content, label
}
```

## UI Changes

Add two buttons in App.tsx header toolbar, near the "Copy all diffs" button:
- Export button (Download icon)
- Import button (Upload icon)

## Implementation Details

### Export
1. Collect current state: `{ version: "1.0.0", exportTime: new Date().toISOString(), fontSize, theme, versions }`
2. Serialize to JSON with 2-space indentation
3. Create Blob and trigger download
4. Filename: `diff-timeline-{timestamp}.json`
5. Show success toast

### Import
1. Hidden file input with `accept=".json"`
2. Click import button → trigger file input
3. Read file using FileReader
4. Parse and validate JSON
5. Show AlertDialog to confirm (prevent data loss)
6. On confirm: restore state (setVersions, setFontSize, setTheme)
7. Reset expanded states to defaults
8. Show success toast

### Validation
- Check `version` field exists
- Check `versions` is array with length >= 2
- Check each version has `id` and `content`
- Check `fontSize` is number between 9-24
- Check `theme` is 'dark' or 'light'

### Error Handling
- File read error → toast error
- JSON parse error → toast "Invalid JSON file"
- Validation error → toast "Invalid data format"

## Files to Modify
- `src/App.tsx`: Add import/export handlers and UI buttons
