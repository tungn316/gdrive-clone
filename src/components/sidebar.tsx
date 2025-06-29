// src/components/sidebar.tsx
"use client" // This must be a client component to use useRouter/usePathname

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Cloud, Computer, Trash2 } from "lucide-react"
import { useNavigation, calculateStorageUsage, formatStorageSize } from "@/utils/navigation-utils"

export function Sidebar() {
  const pathname = usePathname()
  const { navigateToHome } = useNavigation()

  // Example storage data - in a real app this would come from your backend
  const storageData = calculateStorageUsage(10.5 * 1024 * 1024 * 1024, 30 * 1024 * 1024 * 1024) // 10.5GB of 30GB

  return (
    <aside className="w-64 border-r border-gray-700 h-full hidden md:block bg-gray-800">
      <div className="p-4">
        <div className="flex items-center gap-2 px-4 py-2 mb-6">
          <button
            onClick={navigateToHome}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Cloud className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-semibold text-white">Drive</span>
          </button>
        </div>

        <div className="space-y-1">
          <SidebarItem href="/" icon={<Computer className="h-4 w-4" />} text="My Drive" active={pathname === "/"} />
          <SidebarItem href="/trash" icon={<Trash2 className="h-4 w-4" />} text="Trash" active={pathname === "/trash"} />
          {/* Add more items if needed */}
          {/* <SidebarItem href="/shared" icon={<Users className="h-4 w-4" />} text="Shared with me" active={pathname === "/shared"} /> */}
          {/* <SidebarItem href="/recent" icon={<Clock className="h-4 w-4" />} text="Recent" active={pathname === "/recent"} /> */}
          {/* <SidebarItem href="/starred" icon={<Star className="h-4 w-4" />} text="Starred" active={pathname === "/starred"} /> */}
          {/* <SidebarItem href="/photos" icon={<ImageIcon className="h-4 w-4" />} text="Photos" active={pathname === "/photos"} /> */}
          {/* <SidebarItem href="/documents" icon={<FileText className="h-4 w-4" />} text="Documents" active={pathname === "/documents"} /> */}
        </div>

        <div className="mt-8">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Storage</h3>
          <div className="px-4">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full" 
                style={{ width: `${storageData.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {formatStorageSize(storageData.used)} of {formatStorageSize(storageData.total)} used
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function SidebarItem({
  href,
  icon,
  text,
  active = false,
}: {
  href: string
  icon: React.ReactNode
  text: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2 text-sm rounded-full ${
        active ? "bg-blue-900 text-blue-300 font-medium" : "text-gray-300 hover:bg-gray-700"
      }`}
    >
      {icon}
      <span>{text}</span>
    </Link>
  )
}
