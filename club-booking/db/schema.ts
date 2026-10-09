import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const bookings = sqliteTable('bookings', {id:text('id').primaryKey(),club:text('club').notNull(),activity:text('activity').notNull(),location:text('location').notNull().default(''),date:text('date').notNull(),start:text('start').notNull(),end:text('end').notNull(),createdAt:text('created_at').notNull()}, t=>[index('bookings_date').on(t.date)]);
export const curriculumDocuments = sqliteTable('curriculum_documents', {
 id:text('id').primaryKey(),
 data:text('data').notNull(),
 visibility:text('visibility').notNull().default('private'),
 updatedAt:text('updated_at').notNull(),
});
