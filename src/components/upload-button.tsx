"use client";
import { Plus, Upload, FolderPlus } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useConvexAuth } from "convex/react";
import { useUploadThing } from "@/utils/uploadthing";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Id } from "@/../convex/_generated/dataModel";
import {
  createFileInput,
  promptFolderName,
  validateAuthForUpload,
  validateAuthForFolder
} from "@/utils/upload-utils";

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const params = useParams();
  const currentFolderId = params.folderId as Id<"files"> | undefined;
  const { isAuthenticated } = useConvexAuth();

  const createFile = useMutation(api.files.createFile);
  const createFolder = useMutation(api.files.createFolder);

  const { startUpload } = useUploadThing("fileUploader", {
    onClientUploadComplete: async (res) => {
      if (!res) return;
      console.log("Files uploaded:", res);

      for (const file of res) {
        await createFile({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          parentId: currentFolderId,
          url: file.url,
          fileKey: file.key,
        });
      }
      setIsUploading(false);
    },
    onUploadError: (error: Error) => {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
      setIsUploading(false);
    },
    onUploadBegin: () => {
      setIsUploading(true);
    },
  });

  const handleFileUpload = () => {
    if (!validateAuthForUpload(isAuthenticated)) return;
    
    createFileInput(async (files) => {
      const fileArray = Array.from(files);
      await startUpload(fileArray);
    });
  };

  const handleCreateFolder = async () => {
    if (!validateAuthForFolder(isAuthenticated)) return;
    
    const folderName = promptFolderName();
    if (folderName) {
      try {
        await createFolder({
          name: folderName,
          parentId: currentFolderId,
        });
      } catch (error) {
        console.error("Failed to create folder:", error);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={!isAuthenticated}>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          {isUploading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              <Plus className="mr-1 h-4 w-4" />
              New
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-gray-800 border-gray-700"
      >
        <DropdownMenuItem
          onClick={handleFileUpload}
          className="text-gray-300 hover:bg-gray-700"
        >
          <Upload className="mr-2 h-4 w-4" />
          <span>File upload</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleCreateFolder}
          className="text-gray-300 hover:bg-gray-700"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          <span>New folder</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
