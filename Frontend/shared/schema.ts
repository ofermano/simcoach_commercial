import { sql } from "drizzle-orm";
import { pgTable, text, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export * from "./models/auth";
import { users } from "./models/auth";

export const whitelistEmails = pgTable("whitelist_emails", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  displayName: varchar("display_name").notNull(),
  drivingLevel: varchar("driving_level").notNull(),
  goal: varchar("goal").notNull(),
  drivingStyle: varchar("driving_style").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWhitelistEmailSchema = createInsertSchema(whitelistEmails).omit({ id: true, createdAt: true });
export const insertQuestionnaireResponseSchema = createInsertSchema(questionnaireResponses).omit({ id: true, createdAt: true, userId: true });

export type WhitelistEmail = typeof whitelistEmails.$inferSelect;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertQuestionnaireResponse = z.infer<typeof insertQuestionnaireResponseSchema>;
