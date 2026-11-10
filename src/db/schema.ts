import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    googleId: varchar('google_id', { length: 128 }).unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 64 }).unique(),
    rank: varchar('rank', { length: 32 }).default('Bronze').notNull(),
    points: integer('points').default(0).notNull(),
    technicalRank: varchar('technical_rank', { length: 32 }).default('Bronze').notNull(),
    technicalPoints: integer('technical_points').default(0).notNull(),
    hrRank: varchar('hr_rank', { length: 32 }).default('Bronze').notNull(),
    hrPoints: integer('hr_points').default(0).notNull(),
    resumeUrl: text('resume_url'),
    resumeText: text('resume_text'),
    onboardedAt: timestamp('onboarded_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    rankIdx: index('users_rank_idx').on(table.rank),
    pointsIdx: index('users_points_idx').on(table.points),
    techLeaderboardIdx: index('users_tech_leaderboard_idx').on(table.technicalPoints),
    hrLeaderboardIdx: index('users_hr_leaderboard_idx').on(table.hrPoints),
    leaderboardIdx: index('users_leaderboard_idx').on(table.rank, table.points),
  })
);

export const interviews = pgTable(
  'interviews',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 32 }).notNull(), // 'Technical' | 'HR' | 'Resume Review'
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),
    score: integer('score'),
    transcript: text('transcript'),
    feedbackJson: jsonb('feedback_json'),
  },
  (table) => ({
    userHistoryIdx: index('interviews_user_history_idx').on(table.userId, table.startedAt),
  })
);

export const problemAttempts = pgTable(
  'problem_attempts',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: varchar('user_id', { length: 64 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    interviewId: varchar('interview_id', { length: 64 }).references(() => interviews.id, {
      onDelete: 'set null',
    }),
    source: varchar('source', { length: 32 }).notNull(), // 'LeetCode' | 'Codeforces'
    externalId: varchar('external_id', { length: 128 }).notNull(),
    difficulty: varchar('difficulty', { length: 32 }),
    solved: boolean('solved').default(false).notNull(),
    submittedCode: text('submitted_code'),
    language: varchar('language', { length: 32 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userSolvedIdx: index('problem_attempts_user_solved_idx').on(table.userId, table.solved),
    interviewIdIdx: index('problem_attempts_interview_id_idx').on(table.interviewId),
  })
);

export const problems = pgTable(
  'problems',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    source: varchar('source', { length: 32 }).notNull(), // 'LeetCode' | 'Codeforces'
    externalId: varchar('external_id', { length: 128 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    url: text('url').notNull(),
    difficulty: varchar('difficulty', { length: 64 }).notNull(),
    topics: jsonb('topics').$type<string[]>().default([]).notNull(),
    rankTier: varchar('rank_tier', { length: 32 }).notNull(),
  },
  (table) => ({
    rankTierIdx: index('problems_rank_tier_idx').on(table.rankTier),
    sourceExternalIdx: index('problems_source_external_idx').on(table.source, table.externalId),
  })
);

export const reports = pgTable(
  'reports',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: varchar('user_id', { length: 64 }).references(() => users.id, { onDelete: 'set null' }),
    category: varchar('category', { length: 64 }).notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('reports_user_id_idx').on(table.userId),
  })
);

export const reviews = pgTable('reviews', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  text: text('text').notNull(),
  rating: integer('rating').default(5),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Interview = typeof interviews.$inferSelect;
export type Problem = typeof problems.$inferSelect;
export type ProblemAttempt = typeof problemAttempts.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Review = typeof reviews.$inferSelect;

