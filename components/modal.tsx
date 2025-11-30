import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100]"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Backdrop that covers everything including nav bar */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* Modal Container - Full screen on mobile */}
      <div 
        className="absolute inset-0 flex items-start justify-start sm:items-center sm:justify-center overflow-y-auto p-0 sm:p-4"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* Modal Content - Full screen on mobile, centered on desktop */}
        <div 
          className="relative bg-white dark:bg-gray-800 rounded-none sm:rounded-xl shadow-2xl max-w-3xl w-full h-full sm:h-auto mx-0 sm:mx-auto my-0 sm:my-4 min-h-screen sm:min-h-0 max-h-screen sm:max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Header with Close Button - Always visible at top, covers nav bar area */}
          <div className="sticky top-0 z-[60] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sm:border-0 sm:absolute sm:top-0 sm:right-0 sm:bg-transparent sm:border-none flex items-center justify-end p-4 sm:p-0 min-h-[64px] sm:min-h-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-11 w-11 sm:h-11 sm:w-11 rounded-full bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-xl border-2 border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500 sm:absolute sm:top-3 sm:right-3"
              aria-label="Close"
            >
              <X className="h-6 w-6 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
            </Button>
          </div>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 