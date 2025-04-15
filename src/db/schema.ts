import { relations } from "drizzle-orm";
import {
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createUpdateSchema,
  createSelectSchema,
} from "drizzle-zod";
import { z } from "zod";

export const reactionType = pgEnum("reaction_type", ["like", "dislike"]);

export const playlistVideos = pgTable(
  "playlist_videos",
  {
    playlistId: uuid("playlist_id")
      .references(() => playlists.id, { onDelete: "cascade" })
      .notNull(),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    createAt: timestamp("create_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "playlist_videos_pk",
      columns: [t.playlistId, t.videoId],
    }),
  ]
);
// 一个video有多个·playlist   ,playlist有若干video
export const playlistVideoRelations = relations(playlistVideos, ({ one }) => ({
  video: one(videos, {
    references: [videos.id],
    fields: [playlistVideos.videoId],
  }),
  playlist: one(playlists, {
    references: [playlists.id],
    fields: [playlistVideos.playlistId],
  }),
}));
export const playlists = pgTable("playlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text().notNull(),
  description: text("description"),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createAt: timestamp("create_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const playlistRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  playlistVideos: many(playlistVideos),
}));

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").unique().notNull(),
    name: text("name").notNull(),
    // TODO:add banner
    imageUrl: text("image_url").notNull(),
    createAt: timestamp("create_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("clerk_id_idx").on(t.clerkId)]
  // 加上唯一索引，确保其在表中唯一
);

// 有多个关系在subscriptions" 和"users". 需要确认每个关系的名字_____在应用层面上
export const userRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  videoViews: many(videoViews),
  videoReactions: many(videoReactions),
  subscriptions: many(subscriptions, {
    relationName: "subscriptions_viewer_id_fkey",
    // 观看者的订阅表，users.id->viewer_id
  }),
  subscribers: many(subscriptions, {
    relationName: "subscriptions_creator_id_fkey",
    // 创建者的粉丝列表，creator_id-》users.id
  }),
  comments: many(comments),
  commentReactions: many(commentReactions),
  playlists: many(playlists),
}));

export const subscriptions = pgTable(
  "subscriptions",
  {
    viewerId: uuid("viewer_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    creatorId: uuid("creator_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createAt: timestamp("create_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "subscriptions_pk",
      columns: [t.viewerId, t.creatorId],
    }),
  ]
);
export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  // 两个表之间有两种关系，需要不同名字取分relationName，viewer，subscriptions是一种关系在两种表的不同名字
  viewer: one(users, {
    references: [users.id],
    fields: [subscriptions.viewerId],
    relationName: "subscriptions_viewer_id_fkey",
  }),
  creator: one(users, {
    references: [users.id],
    fields: [subscriptions.creatorId],
    relationName: "subscriptions_creator_id_fkey",
  }),
}));

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description"),
    createAt: timestamp("create_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("name_idx").on(t.name)]
);
//给name字段加上唯一索引，确保其在表中唯一，不允许重复。name 字段已经通过 .unique() 设置了唯一约束，但这里又额外创建了一个唯一索引。
export const VideoVisibility = pgEnum("video_visibility", [
  "private",
  "public",
]);

// videos
export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("tittle").notNull(),
  description: text("description"),
  muxStatus: text("mux_status"),
  muxAssetId: text("mux_asset_id").unique(),
  muxUploadId: text("mux_upload_id").unique(),
  muxPlaybackId: text("mux_playback_id").unique(),
  muxTrackId: text("mux_track_id").unique(),
  muxTrackStatus: text("mux_Track_status"),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailKey: text("thumbnail_key"),
  previewUrl: text("preview_url"),
  previewKey: text("preview_key"),
  duration: integer("duration").default(0).notNull(),
  visibility: VideoVisibility("visibility").default("private").notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  createAt: timestamp("create_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const videoSelectSchema = createSelectSchema(videos);
export const videoUpdateSchema = createUpdateSchema(videos).extend({
  // trim()去除首尾空格
  title: z.string().trim().min(1, {
    message: "Title must not be empty",
  }),
});
export const videoInsertSchema = createInsertSchema(videos);
// TODO:relations 和foreign key关系
export const videoRelations = relations(videos, ({ one, many }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [videos.categoryId],
    references: [categories.id],
  }),
  videoViews: many(videoViews),
  videoReactions: many(videoReactions),
  comments: many(comments),
  playlistVideos: many(playlistVideos),
}));

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentId: uuid("parent_id"),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    value: text("value").notNull(),
    createAt: timestamp("create_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // TODO:foreign就相当于立规矩   所有评论都存储在 comments 表里，，该表中的parentId，指向comments表的另一条记录的id,不是同一条记录
    foreignKey({
      columns: [t.parentId], // 儿子的parentId字段
      foreignColumns: [t.id], // 必须指向父亲的实际id
      name: "comment_parent_id_fkey",
    }).onDelete("cascade"), //级联删除，删除父评论时，自动删除所有后代（避免僵尸回复）
  ]
);
export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    references: [users.id],
    fields: [comments.userId],
  }),
  video: one(videos, {
    references: [videos.id],
    fields: [comments.videoId],
  }),
  reactions: many(commentReactions),

  // /表的自引用--一种关系  relationName 是双向关系的唯一标识符
  //查父亲 有很多评论是一个评论的子级   定义「找爸爸」的关系
  parentId: one(comments, {
    references: [comments.id], //父
    fields: [comments.parentId], //自己
    relationName: "comment_parent_id_fkey",
  }),
  //查儿子们  //定义「找儿子」的关系
  replies: many(comments, {
    relationName: "comment_parent_id_fkey",
  }),
}));
export const commentSelectSchema = createSelectSchema(comments);
export const commentUpdateSchema = createUpdateSchema(comments);
export const commentInsertSchema = createInsertSchema(comments);

// videoViews
export const videoViews = pgTable(
  "video_views",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    createAt: timestamp("create_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "vieo_views_pk",
      columns: [t.userId, t.videoId],
    }),
  ]
  // 通过将 userId 和 videoId 设为 联合主键（复合主键），数据库会强制保证这两个字段的组合值在整个表中唯一，即：
);
export const videoViewSelectSchema = createSelectSchema(videoViews);
export const videoViewUpdateSchema = createUpdateSchema(videoViews);
export const videoViewInsertSchema = createInsertSchema(videoViews);
export const videoViewRelations = relations(videoViews, ({ one }) => ({
  user: one(users, {
    fields: [videoViews.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [videoViews.videoId],
    references: [videos.id],
  }),
}));

// CommentReaction
export const commentReactions = pgTable(
  "comment_reactions",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    commentId: uuid("comment_id")
      .references(() => comments.id, { onDelete: "cascade" })
      .notNull(),
    type: reactionType("type").notNull(), //在创建reactions是必须的
    createAt: timestamp("create_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // 一个用户对应一条评论条，只能由一条记录
    primaryKey({
      name: "comment_reactions_pk",
      columns: [t.userId, t.commentId],
    }),
  ]
);
export const commentReactionSelectSchema = createSelectSchema(commentReactions);
export const commentReactionUpdateSchema = createUpdateSchema(commentReactions);
export const commentReactionInsertSchema = createInsertSchema(commentReactions);

export const commentReactionsRelations = relations(
  commentReactions,
  ({ one }) => ({
    user: one(users, {
      fields: [commentReactions.userId],
      references: [users.id],
    }),
    comment: one(comments, {
      fields: [commentReactions.commentId],
      references: [comments.id],
    }),
  })
);

// VideoReaction
export const videoReactions = pgTable(
  "video_reactions",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    videoId: uuid("video_id")
      .references(() => videos.id, { onDelete: "cascade" })
      .notNull(),
    type: reactionType("type").notNull(), //在创建reactions是必须的
    createAt: timestamp("create_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({
      name: "video_reactions_pk",
      columns: [t.userId, t.videoId],
    }),
  ]
);
export const videoReactionSelectSchema = createSelectSchema(videoReactions);
export const videoReactionUpdateSchema = createUpdateSchema(videoReactions);
export const videoReactionInsertSchema = createInsertSchema(videoReactions);

export const videoReactionsRelations = relations(videoReactions, ({ one }) => ({
  user: one(users, {
    fields: [videoReactions.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [videoReactions.videoId],
    references: [videos.id],
  }),
}));
