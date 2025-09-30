import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const moodSessions = pgTable("mood_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  mood: text("mood").notNull(),
  confidence: integer("confidence").notNull(),
  alternativeMoods: text("alternative_moods").array(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertMoodSessionSchema = createInsertSchema(moodSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertMoodSession = z.infer<typeof insertMoodSessionSchema>;
export type MoodSession = typeof moodSessions.$inferSelect;
