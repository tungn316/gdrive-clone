"use client";
import { Plus, Upload, FolderPlus } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "convex/react";
import { useUploadThing } from "@/utils/uploadthing"; // Correct path to your generated hook
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Id } from "@/../convex/_generated/dataModel"; // Import Id type

// Mock user ID - in a real app, get this from authentication
const MOCK_USER_ID = "user_123";

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false);
  const params = useParams();
  const currentFolderId = params.folderId as Id<"files"> | undefined; // Cast to Id<"files"> for type safety

  const createFile = useMutation(api.files.createFile);
  const createFolder = useMutation(api.files.createFolder);

  const { startUpload } = useUploadThing("fileUploader", {
    onClientUploadComplete: async (res) => {
      if (!res) return;
      console.log("Files uploaded:", res);

      for (const file of res) {
        await createFile({
          name: file.name,
          type: "file",
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          parentId: currentFolderId,
          userId: MOCK_USER_ID,
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
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const files = Array.from(target.files);
        await startUpload(files);
      }
    };
    input.click();
  };

  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (folderName && folderName.trim()) {
      try {
        await createFolder({
          name: folderName.trim(),
          parentId: currentFolderId,
          userId: MOCK_USER_ID,
        });
      } catch (error) {
        console.error("Failed to create folder:", error);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
