import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash } from "lucide-react"

interface DeleteAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
  title?: string
  description?: string
}

export function DeleteAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
  title = "Delete Review",
  description = "Are you sure you want to delete this review? This action cannot be undone."
}: DeleteAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 border-purple-200 dark:border-purple-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Trash className="w-5 h-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 