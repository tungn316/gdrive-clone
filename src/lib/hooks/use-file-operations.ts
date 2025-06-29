import { useMutation } from "convex/react"
import { api } from "@/../convex/_generated/api"
import type { Id } from '@/../convex/_generated/dataModel'

export function useFileOperations() {
  const trashMutation = useMutation(api.files.trash)
  const permanentlyDeleteMutation = useMutation(api.files.permanentlyDelete)
  const restoreMutation = useMutation(api.files.restore)
  const renameMutation = useMutation(api.files.rename)

  const handleMoveToTrash = async (fileId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to move "${fileName}" to trash?`)) {
      try {
        await trashMutation({ id: fileId as Id<"files"> })
        console.log(`"${fileName}" moved to trash successfully!`)
      } catch (error) {
        console.error("Failed to move to trash:", error)
        alert("Failed to move to trash. Please try again.")
      }
    }
  }

  const handleRestore = async (fileId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to restore "${fileName}"?`)) {
      try {
        await restoreMutation({ id: fileId as Id<'files'> })
        console.log(`"${fileName}" restored successfully!`)
      } catch (error) {
        console.error("Failed to restore:", error)
        alert("Failed to restore. Please try again.")
      }
    }
  }

  const handleDeleteForever = async (fileId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${fileName}"? This action cannot be undone.`)) {
      try {
        await permanentlyDeleteMutation({ id: fileId as Id<'files'> })
        console.log(`"${fileName}" permanently deleted successfully!`)
      } catch (error) {
        console.error("Failed to delete forever:", error)
        alert("Failed to delete forever. Please try again.")
      }
    }
  }

  const handleRename = async (fileId: Id<"files">, currentName: string) => {
    const newName = window.prompt("Enter new name:", currentName)

    if (newName === null || newName.trim() === "") {
      // User cancelled or entered an empty name
      return
    }

    if (newName === currentName) {
      // No change, do nothing
      return
    }

    try {
      await renameMutation({ id: fileId, newName: newName.trim() })
      // Optional: Show a success toast
    } catch (error) {
      console.error("Failed to rename file:", error)
      alert("Failed to rename. Please try again.")
    }
  }

  return {
    handleMoveToTrash,
    handleRestore,
    handleDeleteForever,
    handleRename
  }
} 