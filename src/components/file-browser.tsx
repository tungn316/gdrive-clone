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



const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

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

interface FilePreviewModalProps {
  file: Doc<'files'> | null
  isOpen: boolean
  onClose: () => void
}

function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
  if (!isOpen || !file || !file.url) return null

  const fileType = getFileTypeFromMimeType(file.mimeType);

  const getPreviewContent = () => {
    switch (fileType) {
      case "image":
        return (
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-[70vh] object-contain"
          />
        )
      case "pdf":
        return (
          <iframe
            src={file.url}
            className="w-full h-[80vh] border-0"
            title={file.name}
          />
        )
      case "video":
        return (
          <video controls className='max-w-full max-h-[70vh]'>
            <source src={file.url} type={file.mimeType} />
            Your browser does not support the video tag.
          </video>
        )
      case "audio":
        return (
          <div className="bg-gray-700 p-8 rounded-lg text-center">
            <Music className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <audio controls className="w-full mt-4">
              <source src={file.url} type={file.mimeType} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )
      default:
        return (
          <div className="bg-gray-700 p-8 rounded-lg text-center">
            <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">Preview not available</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-white">{file.name}</h2>
            <p className="text-sm text-gray-400">
              {file.size && formatFileSize(file.size)} • {formatDate(file.updatedAt)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:bg-gray-700">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 flex justify-center">{getPreviewContent()}</div>
      </div>
    </div>
  )
}

const pathToFolderName = (path: string): string => {
  return path.replace(/-/g, " ");
};

const findFolderByPath = (
  files: Doc<'files'>[],
  pathSegments: string[]
): Doc<'files'> | null => {
  if (pathSegments.length === 0) return null;

  let currentParentId: string | undefined = undefined;

  for (const segment of pathSegments) {
    const folderName = pathToFolderName(segment);
    const folder = files.find(
      file =>
        file.type === "folder" &&
        file.name.toLowerCase() === folderName.toLowerCase() &&
        file.parentId === currentParentId
    );

    if (!folder) return null;
    currentParentId = folder._id;
  }

  const finalFolderName = pathToFolderName(pathSegments[pathSegments.length - 1]);
  return files.find(
    file =>
      file.type === "folder" &&
      file.name.toLowerCase() === finalFolderName.toLowerCase() &&
      file.parentId === (pathSegments.length > 1 ? findFolderByPath(files, pathSegments.slice(0, -1))?._id : undefined)
  ) || null;
};


const findFolderById = (
  files: Doc<'files'>[],
  folderId: string
): Doc<'files'> | null => {
  return files.find(file => file._id === folderId) || null;
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

  const handleMoveToTrash = async (fileId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to move "${fileName}" to trash?`)) {
      try {
        await trashMutation({ id: fileId as Id<"files"> });
        // Optional: Show a toast notification
        console.log(`"${fileName}" moved to trash successfully!`);
      } catch (error) {
        console.error("Failed to move to trash:", error);
        alert("Failed to move to trash. Please try again.");
      }
    }
  };

  const handleRestore = async (fileId: string, fileName: string) => {
    // This handler would typically be in a trash view
    if (window.confirm(`Are you sure you want to restore "${fileName}"?`)) {
      try {
        await restoreMutation({ id: fileId as Id<'files'> });
        console.log(`"${fileName}" restored successfully!`);
      } catch (error) {
        console.error("Failed to restore:", error);
        alert("Failed to restore. Please try again.");
      }
    }
  };

  const handleDeleteForever = async (fileId: string, fileName: string) => {
    // This handler would typically be in a trash view
    if (window.confirm(`Are you sure you want to permanently delete "${fileName}"? This action cannot be undone.`)) {
      try {
        await permanentlyDeleteMutation({ id: fileId as Id<'files'> });
        console.log(`"${fileName}" permanently deleted successfully!`);
      } catch (error) {
        console.error("Failed to delete forever:", error);
        alert("Failed to delete forever. Please try again.");
      }
    }
  };

  const handleRename = async (fileId: Id<"files">, currentName: string) => {
    const newName = window.prompt("Enter new name:", currentName);

    if (newName === null || newName.trim() === "") {
      // User cancelled or entered an empty name
      return;
    }

    if (newName === currentName) {
      // No change, do nothing
      return;
    }

    try {
      await renameMutation({ id: fileId, newName: newName.trim() });
      // Optional: Show a success toast
    } catch (error) {
      console.error("Failed to rename file:", error);
      alert("Failed to rename. Please try again.");
    }
  };

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

  const FileItemComponent = ({ file, isFolder = false }: { file: Doc<'files'>; isFolder?: boolean }) => (
    <div
      className={`group relative rounded-lg border border-gray-700 p-4 hover:bg-gray-800 cursor-pointer ${selectedFiles.includes(file._id) ? "bg-blue-900 border-blue-600" : "bg-gray-800"
        } ${isFolder ? "hover:border-blue-500" : ""}`}
      onClick={() => handleItemClick(file)}
    >
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:bg-gray-700"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-800 text-gray-400 border-gray-700">
            {isTrashView ? (
              <>
                <DropdownMenuItem
                  onClick={(e) => { // ADD e.stopPropagation() here
                    e.stopPropagation();
                    handleRestore(file._id, file.name);
                  }}
                  className="cursor-pointer"
                >
                  <Undo2 className="mr-2 h-4 w-4" /> Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { // ADD e.stopPropagation() here
                    e.stopPropagation();
                    handleDeleteForever(file._id, file.name);
                  }}
                  className="text-red-500 cursor-pointer"
                >
                  <CircleX className="mr-2 h-4 w-4" /> Delete Forever
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {file.type === 'file' && file.url && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => { // ADD e.stopPropagation() here
                        e.stopPropagation();
                        setPreviewFile(file);
                      }}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer"
                    >
                      <a
                        href={file.url}
                        download={file.name}
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={(e) => e.stopPropagation()} // Already there, which is good
                        className='flex items-center'
                      >
                        <Download className='mr-2 h-4 w-4' />
                        <span>Download</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className='bg-gray-700' />
                  </>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(file._id, file.name);
                  }}
                  className="cursor-pointer"
                >
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { // ADD e.stopPropagation() here
                    e.stopPropagation();
                    handleMoveToTrash(file._id, file.name);
                  }}
                  className="text-red-500 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Move to trash</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col items-center text-center">
        {getFileIcon(file)}
        <h3 className="mt-4 font-medium text-white text-sm truncate w-full">{file.name}</h3>
        <div className="mt-1 flex items-center text-xs text-gray-400">
          <Calendar className="mr-1 h-3 w-3" />
          <span>{formatDate(file.updatedAt)}</span>
        </div>
        {file.size && <div className="mt-1 text-xs text-gray-400">{formatFileSize(file.size)}</div>}
      </div>
    </div>
  )


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
                    {folders.map((folder) => <FileItemComponent key={folder._id} file={folder} />)}
                  </div>
                </div>
              )}

              {files && files.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Files</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {files.map((file) => <FileItemComponent key={file._id} file={file} />)}
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
