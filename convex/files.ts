// convex/files.ts
import { query, mutation, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

// =================================================================
// Read Queries (Secured)
// =================================================================

export const getFolders = query({
  args: {
    // REMOVED: userId: v.string(), // This is now derived from auth context
    parentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // NEW: Get the authenticated user's identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Not logged in, return no folders
    }
    const userId = identity.subject; // This is the Clerk User ID

    return await ctx.db
      .query('files')
      .withIndex('by_parent_and_type', (q) =>
        q
          .eq('parentId', args.parentId)
          .eq('userId', userId) // CORRECTED: Use the secure userId from auth
          .eq('type', 'folder')
      )
      .filter((q) => q.eq(q.field('trashed'), undefined))
      .collect();
  },
});

export const getFiles = query({
  args: {
    // REMOVED: userId: v.string(),
    parentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    return await ctx.db
      .query('files')
      .withIndex('by_parent_and_type', (q) =>
        q
          .eq('parentId', args.parentId)
          .eq('userId', userId) // CORRECTED: Use the secure userId from auth
          .eq('type', 'file')
      )
      .filter((q) => q.eq(q.field('trashed'), undefined))
      .collect();
  },
});

export const getTrashedItems = query({ // Renamed from getTrashedFiles for clarity
  // REMOVED: args object, as userId comes from auth
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    return await ctx.db
      .query("files")
      .withIndex("by_user_and_trash", (q) =>
        q
          .eq("userId", userId) // CORRECTED: Use the secure userId from auth
          .eq("trashed", true)
      )
      .collect();
  },
});

export const getAncestors = query({
  args: {
    folderId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;

    const breadcrumbs: Doc<"files">[] = [];
    let currentId: Id<"files"> | undefined = args.folderId;

    while (currentId) {
      const folder = await ctx.db.get(currentId);
      // NEW: Security check inside the loop
      if (!folder || folder.userId !== userId) {
        // If folder doesn't exist or user doesn't own it, stop traversing
        break;
      }
      breadcrumbs.push(folder);
      currentId = folder.parentId ? ctx.db.normalizeId("files", folder.parentId) ?? undefined : undefined;
    }
    return breadcrumbs.reverse();
  },
});

// =================================================================
// Create Mutations (Secured)
// =================================================================

export const createFile = mutation({
  args: {
    name: v.string(),
    // type: v.literal("file"), // This is set automatically
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    parentId: v.optional(v.string()),
    // REMOVED: userId: v.string(),
    url: v.optional(v.string()),
    fileKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const fileId = await ctx.db.insert("files", {
      ...args,
      type: "file", // Set type here
      userId: userId, // CORRECTED: Use the secure userId from auth
      updatedAt: Date.now(),
    });
    return await ctx.db.get(fileId);
  },
});

export const createFolder = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.string()),
    // REMOVED: userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const userId = identity.subject;

    const folderId = await ctx.db.insert("files", {
      ...args,
      type: "folder",
      userId: userId, // CORRECTED: Use the secure userId from auth
      updatedAt: Date.now(),
    });
    return await ctx.db.get(folderId);
  },
});

// =================================================================
// Update/Delete Mutations (Secured with Ownership Checks)
// =================================================================

export const trash = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // NEW: Fetch the file and verify ownership before acting
    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found.");
    if (file.userId !== identity.subject) throw new Error("Unauthorized");

    const recursiveTrash = async (fileId: Id<"files">) => {
      await ctx.db.patch(fileId, { trashed: true, trashedAt: Date.now() });
      const currentFile = await ctx.db.get(fileId);
      if (currentFile?.type === "folder") {
        const children = await ctx.db.query("files").withIndex("by_parent", (q) => q.eq("parentId", fileId as string)).collect();
        for (const child of children) {
          await recursiveTrash(child._id);
        }
      }
    };
    await recursiveTrash(args.id);
    return file;
  },
});

export const restore = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // NEW: Fetch the file and verify ownership
    const fileToRestore = await ctx.db.get(args.id);
    if (!fileToRestore) throw new Error("File not found");
    if (fileToRestore.userId !== identity.subject) throw new Error("Unauthorized");

    // ... (rest of your restore logic is fine)
    if (fileToRestore.parentId) {
      const parent = await ctx.db.get(ctx.db.normalizeId("files", fileToRestore.parentId)!);
      if (!parent || parent.trashed) {
        await ctx.db.patch(fileToRestore._id, { parentId: undefined });
      }
    }
    const recursiveRestore = async (fileId: Id<"files">) => { /* ... */ };
    await recursiveRestore(args.id);
  },
});

export const rename = mutation({
  args: { id: v.id("files"), newName: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (args.newName.trim().length === 0) throw new Error("Name cannot be empty.");

    // NEW: Fetch the file and verify ownership
    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found.");
    if (file.userId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { name: args.newName });
  },
});

// =================================================================
// Permanent Deletion Workflow (Secured)
// =================================================================

export const permanentlyDelete = mutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // NEW: Fetch the file and verify ownership
    const file = await ctx.db.get(args.id);
    if (!file) throw new Error("File not found");
    if (file.userId !== identity.subject) throw new Error("Unauthorized");

    // Schedule the action, passing the userId for security context
    await ctx.scheduler.runAfter(0, internal.files.permanentlyDeleteAction, {
      id: args.id,
      fileKey: file.fileKey,
      userId: identity.subject, // Pass userId to the action
    });
  },
});

export const permanentlyDeleteAction = internalAction({
  args: {
    id: v.id("files"),
    fileKey: v.optional(v.string()),
    userId: v.string(), // Receive userId
  },
  handler: async (ctx, args) => {
    // This action is now implicitly secure because it was triggered by an
    // authorized mutation. The userId is passed for potential recursive checks.
    if (args.fileKey) {
      // ... your fetch logic to delete from UploadThing ...
    }
    await ctx.runMutation(internal.files.internalDelete, { id: args.id, userId: args.userId });
  },
});

export const internalDelete = internalMutation({
  args: { id: v.id("files"), userId: v.string() }, // Receive userId
  handler: async (ctx, args) => {
    // For a full recursive delete, you would re-verify ownership here
    // before deleting children. This is a simplified example.
    await ctx.db.delete(args.id);
  },
});
