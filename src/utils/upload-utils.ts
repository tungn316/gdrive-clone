import type { Id } from '@/../convex/_generated/dataModel'

/**
 * Creates a file input element and triggers file selection
 */
export const createFileInput = (onFilesSelected: (files: FileList) => void) => {
  const input = document.createElement("input")
  input.type = "file"
  input.multiple = true
  input.onchange = (e) => {
    const target = e.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      onFilesSelected(target.files)
    }
  }
  input.click()
}

/**
 * Prompts user for folder name and returns the trimmed result
 */
export const promptFolderName = (): string | null => {
  const folderName = prompt("Enter folder name:")
  return folderName && folderName.trim() ? folderName.trim() : null
}

/**
 * Validates if user is authenticated for upload operations
 */
export const validateAuthForUpload = (isAuthenticated: boolean): boolean => {
  if (!isAuthenticated) {
    alert("You must be logged in to upload files.")
    return false
  }
  return true
}

/**
 * Validates if user is authenticated for folder creation
 */
export const validateAuthForFolder = (isAuthenticated: boolean): boolean => {
  if (!isAuthenticated) {
    alert("You must be logged in to create folders.")
    return false
  }
  return true
} 