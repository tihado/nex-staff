import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// --- Better Auth tables ---

export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// --- App tables ---

export interface AssistantConfig {
  greeting?: string;
  model?: string;
}

export const assistant = pgTable("assistant", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  name: text("name").notNull().default("Assistant"),
  instructions: text("instructions").notNull(),
  config: jsonb("config").$type<AssistantConfig>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staffStatusEnum = pgEnum("staff_status", [
  "idle",
  "working",
  "offline",
]);

export interface Skill {
  content?: string;
  description?: string;
  name: string;
}

export type StaffToolHandler = "http" | "rag" | "sandbox_bash" | "sandbox_file";

export interface ToolDef {
  config?: Record<string, unknown>;
  description?: string;
  handler?: StaffToolHandler;
  inputSchema?: Record<string, unknown>;
  name: string;
}

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    role: text("role").notNull(),
    avatarSprite: text("avatar_sprite").notNull().default("default"),
    model: text("model"),
    instructions: text("instructions").notNull(),
    skills: jsonb("skills").$type<Skill[]>().default([]),
    tools: jsonb("tools").$type<ToolDef[]>().default([]),
    useSandbox: boolean("use_sandbox").notNull().default(false),
    status: staffStatusEnum("status").notNull().default("idle"),
    hiredAt: timestamp("hired_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("staff_user_status_idx").on(table.userId, table.status)]
);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export interface TaskMetadata {
  acceptanceCriteria?: string;
  dependsOn?: string[];
  error?: string;
  parentGroupId?: string;
  parentTaskId?: string;
  retryCount?: number;
}

export const chat = pgTable(
  "chat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("chat_user_updated_idx").on(table.userId, table.updatedAt)]
);

export const message = pgTable(
  "message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: jsonb("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("message_chat_created_idx").on(table.chatId, table.createdAt),
  ]
);

export const chatEvent = pgTable(
  "chat_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    eventIndex: integer("event_index").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("chat_event_chat_id_event_index").on(
      table.chatId,
      table.eventIndex
    ),
  ]
);

export const task = pgTable(
  "task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id),
    chatId: uuid("chat_id").references(() => chat.id),
    brief: text("brief").notNull(),
    status: taskStatusEnum("status").notNull().default("pending"),
    workflowRunId: text("workflow_run_id"),
    progressPercent: integer("progress_percent").default(0),
    currentStep: text("current_step"),
    lastEventType: text("last_event_type"),
    lastEventAt: timestamp("last_event_at"),
    metadata: jsonb("metadata").$type<TaskMetadata>().default({}),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("task_user_status_idx").on(table.userId, table.status),
    index("task_staff_status_idx").on(table.staffId, table.status),
    index("task_workflow_run_idx").on(table.workflowRunId),
  ]
);

export const taskEvent = pgTable(
  "task_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("task_event_task_created_idx").on(table.taskId, table.createdAt),
  ]
);

export const taskPreview = pgTable("task_preview", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => task.id, { onDelete: "cascade" })
    .unique(),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "delivered",
]);

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => task.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: notificationStatusEnum("status").notNull().default("pending"),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deliveredAt: timestamp("delivered_at"),
  },
  (table) => [
    index("notification_user_status_idx").on(table.userId, table.status),
  ]
);

export const deliverable = pgTable("deliverable", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => task.id, { onDelete: "cascade" })
    .unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("text/markdown"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentStatusEnum = pgEnum("document_status", [
  "uploading",
  "processing",
  "ready",
  "failed",
]);

export const document = pgTable(
  "document",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    blobUrl: text("blob_url").notNull(),
    status: documentStatusEnum("status").notNull().default("uploading"),
    chunkCount: integer("chunk_count").default(0),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  },
  (table) => [index("document_user_idx").on(table.userId)]
);

export const staffDocument = pgTable(
  "staff_document",
  {
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => document.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.staffId, table.documentId] })]
);

// --- Relations ---

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  assistant: one(assistant),
  staff: many(staff),
  chats: many(chat),
  tasks: many(task),
  documents: many(document),
  notifications: many(notification),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const assistantRelations = relations(assistant, ({ one }) => ({
  user: one(user, {
    fields: [assistant.userId],
    references: [user.id],
  }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(user, {
    fields: [staff.userId],
    references: [user.id],
  }),
  tasks: many(task),
  staffDocuments: many(staffDocument),
}));

export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, {
    fields: [chat.userId],
    references: [user.id],
  }),
  messages: many(message),
  events: many(chatEvent),
  tasks: many(task),
}));

export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
}));

export const chatEventRelations = relations(chatEvent, ({ one }) => ({
  chat: one(chat, {
    fields: [chatEvent.chatId],
    references: [chat.id],
  }),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  user: one(user, {
    fields: [task.userId],
    references: [user.id],
  }),
  staff: one(staff, {
    fields: [task.staffId],
    references: [staff.id],
  }),
  chat: one(chat, {
    fields: [task.chatId],
    references: [chat.id],
  }),
  events: many(taskEvent),
  preview: one(taskPreview),
  deliverable: one(deliverable),
  notifications: many(notification),
}));

export const taskEventRelations = relations(taskEvent, ({ one }) => ({
  task: one(task, {
    fields: [taskEvent.taskId],
    references: [task.id],
  }),
}));

export const taskPreviewRelations = relations(taskPreview, ({ one }) => ({
  task: one(task, {
    fields: [taskPreview.taskId],
    references: [task.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  task: one(task, {
    fields: [notification.taskId],
    references: [task.id],
  }),
}));

export const deliverableRelations = relations(deliverable, ({ one }) => ({
  task: one(task, {
    fields: [deliverable.taskId],
    references: [task.id],
  }),
}));

export const documentRelations = relations(document, ({ one, many }) => ({
  user: one(user, {
    fields: [document.userId],
    references: [user.id],
  }),
  staffDocuments: many(staffDocument),
}));

export const staffDocumentRelations = relations(staffDocument, ({ one }) => ({
  staff: one(staff, {
    fields: [staffDocument.staffId],
    references: [staff.id],
  }),
  document: one(document, {
    fields: [staffDocument.documentId],
    references: [document.id],
  }),
}));
