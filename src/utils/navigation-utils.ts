import { useRouter } from "next/navigation"

/**
 * Navigation utility functions
 */
export const useNavigation = () => {
  const router = useRouter()

  const navigateToHome = () => {
    router.push("/")
  }

  const navigateToFolder = (folderId: string) => {
    router.push(`/folder/${folderId}`)
  }

  const navigateToTrash = () => {
    router.push("/trash")
  }

  return {
    navigateToHome,
    navigateToFolder,
    navigateToTrash
  }
}

/**
 * Storage calculation utilities
 */
export const calculateStorageUsage = (used: number, total: number) => {
  const percentage = (used / total) * 100
  return {
    percentage: Math.min(percentage, 100),
    used: used,
    total: total
  }
}

/**
 * Format storage size for display
 */
export const formatStorageSize = (bytes: number): string => {
  if (bytes === 0) return "0 GB"
  
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(1)} GB`
} 