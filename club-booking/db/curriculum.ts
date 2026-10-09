import { validateCurriculum, type Curriculum } from '../app/curriculum';

export async function publicCurriculum(db: D1Database): Promise<Curriculum> {
  const row = await db.prepare(
    "SELECT data FROM curriculum_documents WHERE id = ? AND visibility = 'public'"
  ).bind('current-term').first<{ data: string }>();
  return row ? validateCurriculum(JSON.parse(row.data)) : { version: 1, timetables: [] };
}
