import type { Doc } from '@/../convex/_generated/dataModel'

/**
 * Formats file size in bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

/**
 * Formats timestamp to readable date format
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-UK', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Determines file type from MIME type
 */
export const getFileTypeFromMimeType = (mimeType?: string): string => {
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

/**
 * Converts path segment to folder name (replaces hyphens with spaces)
 */
export const pathToFolderName = (path: string): string => {
  return path.replace(/-/g, " ");
};

/**
 * Finds a folder by path segments in a list of files
 */
export const findFolderByPath = (
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

/**
 * Finds a folder by ID in a list of files
 */
export const findFolderById = (
  files: Doc<'files'>[],
  folderId: string
): Doc<'files'> | null => {
  return files.find(file => file._id === folderId) || null;
}; 