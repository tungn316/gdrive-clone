import { query } from "./_generated/server";
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
