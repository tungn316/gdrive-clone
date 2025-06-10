"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, File, FileImage, FileText, Folder, MoreVertical, Video, Music, X, ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";


const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

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
  file: FileItem | null
  isOpen: boolean
  onClose: () => void
}

function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
  if (!isOpen || !file) return null

  const fileType = getFileTypeFromMimeType(file.mimeType);

  const getPreviewContent = () => {
    switch (fileType) {
      case "image":
        return (
          <img
            src="/placeholder.svg?height=400&width=600"
            alt={file.name}
            className="max-w-full max-h-96 object-contain"
          />
        )
      case "pdf":
        return (
          <div className="bg-gray-700 p-8 rounded-lg text-center">
            <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <p className="text-gray-300">PDF Preview</p>
            <p className="text-sm text-gray-400 mt-2">Click download to view full document</p>
          </div>
        )
      case "video":
        return (
          <video controls className="max-w-full max-h-96">
            <source src="/placeholder.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )
      case "audio":
        return (
          <div className="bg-gray-700 p-8 rounded-lg text-center">
            <Music className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <audio controls className="w-full mt-4">
              <source src="/placeholder.mp3" type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )
      default:
        return (
          <div className="bg-gray-700 p-8 rounded-lg text-center">
            <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">Preview not available</p>
            <p className="text-sm text-gray-400 mt-2">Click download to view file</p>
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
        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Download
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Share</Button>
        </div>
      </div>
    </div>
  )
}

const pathToFolderName = (path: string): string => {
  return path.replace(/-/g, " ");
};

const findFolderByPath = (
  files: FileItem[], 
  pathSegments: string[]
): FileItem | null => {
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

const getFilesByPath = (
  files: FileItem[], 
  pathSegments: string[]
): FileItem[] => {
  if (pathSegments.length === 0) {
    return files?.filter(file => !file.parentId && !file.trashed);
  }

  const targetFolder = findFolderByPath(files, pathSegments);
  if (!targetFolder) return [];

  return files.filter(file => file.parentId === targetFolder._id && !file.trashed);
};

export interface BreadcrumbItem {
  name: string;
  path: string[];
}

export const generateBreadcrumbs = (
  files: FileItem[], 
  pathSegments: string[]
): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "My Drive", path: [] }
  ];

  for (let i = 0; i < pathSegments.length; i++) {
    const currentPath = pathSegments.slice(0, i + 1);
    const folder = findFolderByPath(files, currentPath);

    if (folder) {
      breadcrumbs.push({
        name: folder.name,
        path: currentPath
      });
    }
  }

  return breadcrumbs;
};

interface FileGridProps {
  currentPath: string[]
}

export function FileGrid({ currentPath }: FileGridProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const router = useRouter()
  const parentId = 

  const currentFiles = useQuery(api.files.getFiles, {userId: user123, parentId: });
  const breadcrumbs = generateBreadcrumbs(userFiles, currentPath);

  const folders = currentFiles?.filter((file) => file.type === "folder")
  const regularFiles = currentFiles?.filter((file) => file.type === "file")

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

  const handleItemClick = (file: FileItem) => {
    if (file.type === "folder") {
      const folderPath = file.name.toLowerCase().replace(/\s+/g, "-")
      router.push(`/folder/${currentPath}/${folderPath}`)
    } else {
      setPreviewFile(file)
    }
  }

const getFileIcon = (file: FileItem) => {
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

const FileItemComponent = ({ file, isFolder = false }: { file: FileItem; isFolder?: boolean }) => (
  <div
    className={`group relative rounded-lg border border-gray-700 p-4 hover:bg-gray-800 cursor-pointer ${
selectedFiles.includes(file._id) ? "bg-blue-900 border-blue-600" : "bg-gray-800"
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
        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
          <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">Rename</DropdownMenuItem>
          <DropdownMenuItem className="text-red-400 hover:bg-gray-700">Remove</DropdownMenuItem>
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


return (
  <>
    <div className="flex items-center gap-2 mb-6 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-2">
          <button
            onClick={() => handleBreadcrumbClick(crumb.path)}
            className={`hover:text-blue-400 transition-colors ${
index === breadcrumbs.length - 1 
? "text-white font-medium" 
: "text-gray-400"
}`}
          >
            {index === 0 ? (
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>{crumb.name}</span>
              </div>
            ) : (
                crumb.name
              )}
          </button>
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </div>
      ))}
    </div>

    <div className="space-y-6">
      {folders.length === 0 && regularFiles.length === 0 && (
        <div className="text-center py-12">
          <Folder className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">This folder is empty</h3>
          <p className="text-gray-500">Upload files or create folders to get started</p>
        </div>
      )}

      {folders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Folders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map((folder) => (
              <FileItemComponent key={folder._id} file={folder} isFolder={true} />
            ))}
          </div>
        </div>
      )}

      {regularFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Files</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {regularFiles.map((file) => (
              <FileItemComponent key={file._id} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>

    <FilePreviewModal file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)} />
  </>
)
}
