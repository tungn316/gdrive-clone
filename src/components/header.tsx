"use client"

import { useState } from "react"
import { Bell, Grid, HelpCircle, List, Menu, Search, Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Header() {
  const [searchValue, setSearchValue] = useState("")
  const [isGridView, setIsGridView] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-gray-700 bg-gray-800 sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-300 hover:bg-gray-700"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search in Drive"
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus-visible:ring-1 focus-visible:ring-blue-500"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:bg-gray-600"
                onClick={() => setSearchValue("")}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        </div>

      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-700 py-2 px-4 bg-gray-800">
          <nav className="space-y-1">
            <MobileNavItem text="My Drive" active />
            <MobileNavItem text="Trash" />
          </nav>
        </div>
      )}
    </header>
  )
}

function MobileNavItem({ text, active = false }: { text: string; active?: boolean }) {
  return (
    <a
      href="#"
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        active ? "bg-blue-900 text-blue-300" : "text-gray-300 hover:bg-gray-700"
      }`}
    >
      {text}
    </a>
  )
}

