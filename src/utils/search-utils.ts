import { useState } from "react"

/**
 * Search state management hook
 */
export const useSearch = () => {
  const [searchValue, setSearchValue] = useState("")

  const clearSearch = () => {
    setSearchValue("")
  }

  const updateSearch = (value: string) => {
    setSearchValue(value)
  }

  return {
    searchValue,
    clearSearch,
    updateSearch
  }
}

/**
 * Mobile menu state management hook
 */
export const useMobileMenu = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu
  }
} 