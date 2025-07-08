import { int, sqliteTable, text, real } from "drizzle-orm/sqlite-core";

// 现有用户表（保留）
export const usersTable = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
});

// 闪卡表
export const flashcardsTable = sqliteTable("flashcards_table", {
  id: int().primaryKey({ autoIncrement: true }),
  word: text().notNull(),
  usphone: text(),
  ukphone: text(),
  meaning: text().notNull(),
  example: text(),
  imageUrl: text(),
  createdAt: text().notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text().notNull().$defaultFn(() => new Date().toISOString()),
});

// 用户学习进度表
export const userFlashcardProgressTable = sqliteTable("user_flashcard_progress", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  flashcardId: int().notNull().references(() => flashcardsTable.id, { onDelete: "cascade" }),
  difficulty: int().notNull(), // 1-简单，2-一般，3-困难
  nextReviewDate: text().notNull(),
  reviewCount: int().notNull().default(0),
  correctCount: int().notNull().default(0),
  lastReviewedAt: text(),
  createdAt: text().notNull().$defaultFn(() => new Date().toISOString()),
});

// 学习记录表
export const studySessionsTable = sqliteTable("study_sessions", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  flashcardId: int().notNull().references(() => flashcardsTable.id, { onDelete: "cascade" }),
  isCorrect: int().notNull(), // SQLite 中使用 int 表示 boolean，0=false, 1=true
  responseTime: int().notNull(), // 响应时间，毫秒
  studiedAt: text().notNull().$defaultFn(() => new Date().toISOString()),
});

// 用户算法配置表
export const userAlgorithmConfigTable = sqliteTable("user_algorithm_config", {
  id: int().primaryKey({ autoIncrement: true }),
  userId: int().notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  algorithmType: text().notNull().default("anki"), // anki/supermemo/custom
  learningMode: text().notNull().default("standard"), // standard/fast/conservative/custom
  baseIntervalsEasy: text().notNull().default("[1,4,10]"), // JSON格式
  baseIntervalsNormal: text().notNull().default("[1,2,6]"), // JSON格式
  baseIntervalsHard: text().notNull().default("[1,1,4]"), // JSON格式
  multiplierEasy: real().notNull().default(2.5),
  multiplierNormal: real().notNull().default(2.0),
  multiplierHard: real().notNull().default(1.3),
  maxInterval: int().notNull().default(365),
  minInterval: int().notNull().default(1),
  newCardSteps: text().notNull().default("[1,10,1440]"), // JSON格式，分钟
  lapseSteps: text().notNull().default("[10,1440]"), // JSON格式，分钟
  dailyNewCards: int().notNull().default(20),
  dailyReviewCards: int().notNull().default(200),
  createdAt: text().notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text().notNull().$defaultFn(() => new Date().toISOString()),
});
