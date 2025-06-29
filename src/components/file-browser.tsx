"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  File,
  FileImage,
  FileText,
  Folder,
  MoreVertical,
  Video,
  Music,
  X,
  ChevronRight,
  Home,
  Download,
  Eye,
  Trash2,
  Undo2,
  CircleX,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Doc, Id } from '@/../convex/_generated/dataModel'
import { FilePreviewModal } from "@/components/file-preview-modal"
import { FileItem } from "@/components/file-item"
import { useFileOperations } from "@/lib/hooks/use-file-operations"
import { formatFileSize } from "@/utils/file-utils"

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-UK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getFileTypeFromMimeType = (mimeType?: string): string => {
  if (!mimeType) return "file";

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "document";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "presentation";
  if (mimeType.startsWith("text/")) return "text";

  return "file";
};

interface FileBrowserProps {
  folderId?: Id<"files">; // The only prop needed for location
  isTrashView?: boolean;
}

export function FileBrowser({ folderId, isTrashView }: FileBrowserProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [previewFile, setPreviewFile] = useState<Doc<'files'> | null>(null)
  const router = useRouter()
  const { isLoading: authIsLoading, isAuthenticated } = useConvexAuth();

  const {
    handleMoveToTrash,
    handleRestore,
    handleDeleteForever,
    handleRename
  } = useFileOperations()

  const trashedItems = useQuery(
    api.files.getTrashedItems,
    isAuthenticated && isTrashView ? {} : 'skip'
  );
  const driveFolders = useQuery(
    api.files.getFolders,
    isAuthenticated && !isTrashView ? { parentId: folderId } : 'skip'
  );
  const driveFiles = useQuery(
    api.files.getFiles,
    isAuthenticated && !isTrashView ? { parentId: folderId } : 'skip'
  );
  const breadcrumbs = useQuery(
    api.files.getAncestors,
    isAuthenticated && !isTrashView ? { folderId } : 'skip'
  );

  // --- CORRECTED: Unify data source for rendering ---
  const folders = isTrashView ? trashedItems?.filter(i => i.type === 'folder') : driveFolders;
  const files = isTrashView ? trashedItems?.filter(i => i.type === 'file') : driveFiles;

  const trashMutation = useMutation(api.files.trash);
  const permanentlyDeleteMutation = useMutation(api.files.permanentlyDelete);
  const restoreMutation = useMutation(api.files.restore); // Only if restoring from *this* view
  const renameMutation = useMutation(api.files.rename); // NEW: Add the rename mutation hook

  const isLoading = authIsLoading || folders === undefined || files === undefined || (!isTrashView && breadcrumbs === undefined);

  const toggleFileSelection = (id: string) => {
    if (selectedFiles.includes(id)) {
      setSelectedFiles(selectedFiles.filter((fileId) => fileId !== id))
    } else {
      setSelectedFiles([...selectedFiles, id])
    }
  }

  const handleBreadcrumbClick = (path: string[]) => {
    if (path.length === 0) {
      router.push('/')
    } else {
      router.push(`/folder/${path.join('/')}`)
    }
  }

  const handleItemClick = (file: Doc<"files">) => {
    if (file.type === "folder") {
      // Navigate directly to the folder's ID
      router.push(`/folder/${file._id}`);
    } else {
      setPreviewFile(file);
    }
  };

  const getFileIcon = (file: Doc<'files'>) => {
    if (file.type === "folder") {
      return <Folder className="h-10 w-10 text-gray-400" />
    }

    const fileType = getFileTypeFromMimeType(file.mimeType);

    switch (fileType) {
      case "pdf":
        return <FileText className="h-10 w-10 text-red-400" />
      case "image":
        return <FileImage className="h-10 w-10 text-green-400" />
      case "presentation":
        return <FileText className="h-10 w-10 text-orange-400" />
      case "spreadsheet":
        return <FileText className="h-10 w-10 text-emerald-400" />
      case "video":
        return <Video className="h-10 w-10 text-purple-400" />
      case "audio":
        return <Music className="h-10 w-10 text-blue-400" />
      default:
        return <File className="h-10 w-10 text-gray-400" />
    }
  }

  // --- Main Return ---
  if (authIsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <Loader2 className="animate-spin h-8 w-8 mr-2" /> Authenticating...
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        {/* CORRECTED: Breadcrumbs only show in drive view */}
        {!isTrashView && (
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => router.push("/")} className="flex items-center gap-1 text-white hover:text-blue-400">
              <Home className="h-4 w-4 text-white hover:text-blue-400" /> /
            </button>
            {breadcrumbs?.map((crumb) => (
              <div key={crumb._id} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-gray-500" />
                <button onClick={() => router.push(`/folder/${crumb._id}`)} className="hover:text-blue-400 text-white">
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-500 mb-4" />
          <p className="text-gray-400 text-lg">Loading contents...</p>
        </div>
      ) : (
        <>
          {/* Your empty state, folders, and files rendering are now nested inside this 'else' block */}
          {(!folders || folders.length === 0) && (!files || files.length === 0) ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                {isTrashView ? "Trash is empty" : "This folder is empty"}
              </h3>
              {!isTrashView && <p className="text-gray-500">Upload files or create folders to get started</p>}
            </div>
          ) : (
            // Only render content if not empty and not loading
            <>
              {folders && folders.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Folders</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {folders.map((folder) => (
                      <FileItem
                        key={folder._id}
                        file={folder}
                        isFolder={true}
                        isTrashView={isTrashView}
                        isSelected={selectedFiles.includes(folder._id)}
                        onItemClick={handleItemClick}
                        onPreview={setPreviewFile}
                        onRename={handleRename}
                        onMoveToTrash={handleMoveToTrash}
                        onRestore={handleRestore}
                        onDeleteForever={handleDeleteForever}
                        onToggleSelection={toggleFileSelection}
                      />
                    ))}
                  </div>
                </div>
              )}

              {files && files.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Files</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {files.map((file) => (
                      <FileItem
                        key={file._id}
                        file={file}
                        isTrashView={isTrashView}
                        isSelected={selectedFiles.includes(file._id)}
                        onItemClick={handleItemClick}
                        onPreview={setPreviewFile}
                        onRename={handleRename}
                        onMoveToTrash={handleMoveToTrash}
                        onRestore={handleRestore}
                        onDeleteForever={handleDeleteForever}
                        onToggleSelection={toggleFileSelection}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <FilePreviewModal file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
}
