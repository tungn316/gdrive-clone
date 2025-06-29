"use client"

import { X, File, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Doc } from '@/../convex/_generated/dataModel'
import { formatFileSize, formatDate, getFileTypeFromMimeType } from "@/utils/file-utils"

interface FilePreviewModalProps {
  file: Doc<'files'> | null
  isOpen: boolean
  onClose: () => void
}

export function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
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