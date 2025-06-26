"use client"

import { useParams } from 'next/navigation'
import { FileBrowser } from "@/components/file-browser"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { UploadButton } from "@/components/upload-button"
import type { Id } from "@/../convex/_generated/dataModel"; // Import Id type

export default function FolderPage() {
  const params = useParams();
  const currentFolderId = params.folderId as Id<"files"> | undefined; // Cast to Id<"files"> for type safety

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-white">My Drive</h1>
            <UploadButton />
          </div>
          <FileBrowser folderId={currentFolderId} />
        </main>
      </div>
    </div>
  )
}
