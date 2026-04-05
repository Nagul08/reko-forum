import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'

export default function ThemeToggle({ isDark, onChange }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onChange}
      title={isDark ? 'Activate light mode' : 'Activate dark mode'}
      aria-label={isDark ? 'Activate light mode' : 'Activate dark mode'}
      type="button"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}