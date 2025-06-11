import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
