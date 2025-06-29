"use client"

import { useState } from "react"
import {
  Calendar,
  File,
  FileImage,
  FileText,
  Folder,
  MoreVertical,
  Video,
  Music,
  Download,
  Eye,
  Trash2,
  Undo2,
  CircleX
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Doc, Id } from '@/../convex/_generated/dataModel'
import { formatDate, getFileTypeFromMimeType, formatFileSize } from "@/utils/file-utils"

interface FileItemProps {
  file: Doc<'files'>
  isFolder?: boolean
  isTrashView?: boolean
  isSelected?: boolean
  onItemClick: (file: Doc<'files'>) => void
  onPreview: (file: Doc<'files'>) => void
  onRename: (fileId: Id<"files">, currentName: string) => void
  onMoveToTrash: (fileId: string, fileName: string) => void
  onRestore: (fileId: string, fileName: string) => void
  onDeleteForever: (fileId: string, fileName: string) => void
  onToggleSelection: (id: string) => void
}

export function FileItem({
  file,
  isFolder = false,
  isTrashView = false,
  isSelected = false,
  onItemClick,
  onPreview,
  onRename,
  onMoveToTrash,
  onRestore,
  onDeleteForever,
  onToggleSelection
}: FileItemProps) {
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

  return (
    <div
      className={`group relative rounded-lg border border-gray-700 p-4 hover:bg-gray-800 cursor-pointer ${
        isSelected ? "bg-blue-900 border-blue-600" : "bg-gray-800"
      } ${isFolder ? "hover:border-blue-500" : ""}`}
      onClick={() => onItemClick(file)}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(file._id, file.name);
                  }}
                  className="cursor-pointer"
                >
                  <Undo2 className="mr-2 h-4 w-4" /> Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteForever(file._id, file.name);
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreview(file);
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
                        onClick={(e) => e.stopPropagation()}
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
                    onRename(file._id, file.name);
                  }}
                  className="cursor-pointer"
                >
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToTrash(file._id, file.name);
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
} 