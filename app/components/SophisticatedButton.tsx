import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Language, translate } from '../utils/translations'

interface SophisticatedButtonProps {
  expanded: boolean
  onClick: () => void
  language: Language
}

export default function SophisticatedButton({ expanded, onClick, language }: SophisticatedButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const buttonText = expanded 
    ? translate('collapseToggle', language) || 'Collapse'
    : translate('expandToggle', language) || 'Expand'

  return (
    <Button
      variant="outline"
      className={`
        mt-4 px-6 py-2 rounded-full transition-all duration-300 ease-in-out
        ${isHovered 
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white' 
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
        }
        border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600
        flex items-center justify-center space-x-2
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{buttonText}</span>
      {expanded ? (
        <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'transform -translate-y-1' : ''}`} />
      ) : (
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'transform translate-y-1' : ''}`} />
      )}
    </Button>
  )
}

