import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

export const getFolders = query({
  args: {
    userId: v.string(),
    parentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('files')
      .withIndex('by_parent_and_type', (q) =>
        q
          .eq('parentId', args.parentId)
          .eq('userId', args.userId)
          .eq('type', 'folder')
      )
      .filter((q) => q.eq(q.field('trashed'), undefined))
      .collect();
  },
});

export const getFiles = query({
  args: {
    userId: v.string(),
    parentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('files')
      .withIndex('by_parent_and_type', (q) =>
        q
          .eq('parentId', args.parentId)
          .eq('userId', args.userId)
          .eq('type', 'file')
      )
      .filter((q) => q.eq(q.field('trashed'), undefined))
      .collect();
  },
});

export const getTrashedFiles = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {

    return await ctx.db
      .query("files")
      .withIndex("by_user_and_trash", (q) =>
        q
          .eq("userId", args.userId)
          .eq("trashed", true)
      )
      .collect();
  },
});

export const findFolderByName = query({
  args: {
    userId: v.string(),
    name: v.string(),
    parentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('files')
      .withIndex('by_parent_and_type', (q) =>
        q
          .eq('parentId', args.parentId)
          .eq('userId', args.userId)
          .eq('type', 'folder')
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('name'), args.name),
          q.eq(q.field('trashed'), undefined)
        )
      )
      .first()
  },
});

export const findFolderByPath = query({
  args: {
    userId: v.string(),
    pathSegments: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    let currentParentId: string | undefined = undefined;
    let currentFolder = null;

    for (const segment of args.pathSegments) {
      currentFolder = await ctx.db
        .query('files')
        .withIndex('by_parent_and_type', (q) =>
          q
            .eq('parentId', currentParentId)
            .eq('userId', args.userId)
            .eq('type', 'folder')
        )
        .filter((q) =>
          q.and(
            q.eq(q.field('name'), segment),
            q.eq(q.field('trashed'), undefined)
          )
        )
        .first();

      if (!currentFolder) return null;
      currentParentId = currentFolder._id;
    }

    return currentFolder;
  },
});

export const createFile = mutation({
  args: {
    name: v.string(),
    type: v.literal("file"),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    parentId: v.optional(v.string()),
    userId: v.string(),
    url: v.optional(v.string()),
    fileKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("files", {
      ...args,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(fileId);
  },
});

export const createFolder = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const folderId = await ctx.db.insert("files", {
      ...args,
      type: "folder",
      updatedAt: Date.now(),
    });
    return await ctx.db.get(folderId);
  },
});

export const trash = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {

    const file = await ctx.db.get(args.id);
    if (!file) {
      throw new Error("File not found.");
    }

    // 2. Recursive Trashing Logic
    const recursiveTrash = async (fileId: string) => {
      // Trash the current item
      await ctx.db.patch(fileId as any, {
        trashed: true,
        trashedAt: Date.now(),
      });

      // Check if the item is a folder
      const currentFile = await ctx.db.get(fileId as any);
      if (currentFile?.type === "folder") {
        // Find all children of this folder
        const children = await ctx.db
          .query("files")
          .withIndex("by_parent", (q) => q.eq("parentId", fileId))
          .collect();

        // Recursively trash each child
        for (const child of children) {
          await recursiveTrash(child._id);
        }
      }
    };

    // Start the recursive trash from the initial file/folder ID
    await recursiveTrash(args.id);

    return file;
  },
});

// STEP 1: The user calls this mutation. It only schedules the action.
export const permanentlyDelete = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {

    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");

    // Schedule the action to perform the deletion.
    await ctx.scheduler.runAfter(0, internal.files.permanentlyDeleteAction, {
      id: args.id,
      fileKey: file.fileKey,
    });
  },
});

// STEP 2: The action runs, deleting from storage first.
export const permanentlyDeleteAction = internalAction({
  args: { id: v.id("files"), fileKey: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // If there's a fileKey, delete it from UploadThing
    if (args.fileKey) {
      try {
        // --- CORRECTED: Use the new single API Key ---
        const UPLOADTHING_API_KEY = process.env.UPLOADTHING_API;

        console.log(UPLOADTHING_API_KEY)

        if (!UPLOADTHING_API_KEY) {
          console.error("UPLOADTHING_API_KEY is not set in Convex environment variables.");
          // Decide your error policy here. For critical operations, you might throw:
          // throw new Error("UploadThing API key not configured.");
        } else {
          const response = await fetch("https://api.uploadthing.com/v6/deleteFiles", { // Endpoint changed slightly
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // --- CORRECTED HEADERS ---
              "x-uploadthing-api-key": UPLOADTHING_API_KEY,
            },
            body: JSON.stringify({ fileKeys: [args.fileKey] }), // fileKeys is an array
          });

          if (!response.ok) {
            const errorBody = await response.json(); // UploadThing usually returns JSON for errors
            console.error(
              `UploadThing API error (HTTP ${response.status}):`,
              errorBody
            );
            // Re-throw or handle as per your application's error policy
            throw new Error(`UploadThing delete failed: ${errorBody.error || response.statusText}`);
          }
          console.log('Successfully deleted file from UploadThing:', args.fileKey); // More descriptive log
        }
      } catch (error) {
        console.error(`Failed to delete from UploadThing (catch block): ${args.fileKey}`, error);
        // ... (additional error handling) ...
      }
    }

    // After attempting storage deletion, call an internal mutation to delete the DB record.
    await ctx.runMutation(internal.files.internalDelete, { id: args.id });
  },
});

// STEP 3: The internal mutation deletes the database record.
export const internalDelete = internalMutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    // Note: For folders, you would need a recursive delete here as well.
    // This example focuses on single file deletion for simplicity.
    await ctx.db.delete(args.id);
  },
});

export const restore = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {

    const fileToRestore = await ctx.db.get(args.id);
    if (!fileToRestore) throw new Error("File not found");

    // Check if the parent folder exists and is not trashed
    if (fileToRestore.parentId) {
      // CORRECTED LINE: Normalize the parentId string to Id<"files">
      const normalizedParentId = ctx.db.normalizeId("files", fileToRestore.parentId);

      // Only proceed if normalization was successful (i.e., it's a valid Id string)
      if (normalizedParentId) {
        const parent = await ctx.db.get(normalizedParentId); // Use the normalized Id
        if (!parent || parent.trashed) {
          // Parent is gone or trashed, restore to root
          await ctx.db.patch(fileToRestore._id, { parentId: undefined });
        }
      } else {
        // Handle case where parentId string itself is invalid (e.g., malformed)
        // For restore, if the parentId is invalid, it means the parent definitely doesn't exist
        // so we can default to restoring to root.
        await ctx.db.patch(fileToRestore._id, { parentId: undefined });
      }
    }

    // Recursive restore logic (your original logic was good)
    const recursiveRestore = async (fileId: string) => {
      await ctx.db.patch(fileId as any, {
        trashed: undefined,
        trashedAt: undefined,
      });

      const currentFile = await ctx.db.get(fileId as any);
      if (currentFile?.type === "folder") {
        const children = await ctx.db
          .query("files")
          .withIndex("by_parent", (q) => q.eq("parentId", fileId))
          .collect();
        for (const child of children) {
          // Only restore children that were trashed along with the parent
          if (child.trashed) {
            await recursiveRestore(child._id);
          }
        }
      }
    };

    await recursiveRestore(args.id);
  },
});

export const getAncestors = query({
  args: {
    folderId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {

    const breadcrumbs: Doc<"files">[] = [];

    // Start with the folderId passed from the client.
    let currentId: Id<"files"> | undefined = args.folderId;

    while (currentId) {
      // Fetch the document for the current ID in the chain.
      const folder = await ctx.db.get(currentId);

      // --- FIX FOR BOTH ERRORS ---
      // This is the crucial guard clause.
      // If the folder doesn't exist or we don't own it, stop traversing.
      if (!folder) {
        // By breaking here, we ensure that in the code below, `folder` is
        // guaranteed to be a valid, non-null `Doc<"files">`.
        break;
      }

      // FIX 1: This is now safe because the `if` check above guarantees `folder` is not null.
      breadcrumbs.push(folder);

      // FIX 2: This is now safe because `folder` is not null.
      // We use normalizeId to correctly convert the parentId string to an Id type.
      if (folder.parentId) {
        currentId = ctx.db.normalizeId("files", folder.parentId) ?? undefined;
      } else {
        // We've reached the root, which has no parent. Stop the loop.
        currentId = undefined;
      }
    }

    // The loop builds the path from child to parent, so we reverse it for display.
    return breadcrumbs.reverse();
  },
});
