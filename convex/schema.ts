import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    name: v.string(),
    type: v.union(v.literal("file"), v.literal("folder")),
    parentId: v.optional(v.string()),
    userId: v.string(),

    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
    url: v.optional(v.string()),
    fileKey: v.optional(v.string()),

    updatedAt: v.number(),
    trashed: v.optional(v.boolean()),
    trashedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_parent", ["parentId", "userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_parent_and_type", ["parentId", "userId", "type"])
    .index("by_user_and_trash", ["userId", "trashed"]),
});
