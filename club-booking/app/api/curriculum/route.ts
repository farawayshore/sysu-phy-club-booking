import { env } from 'cloudflare:workers';
import { publicCurriculum } from '../../../db/curriculum';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return Response.json(await publicCurriculum(env.DB!), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: '暂时无法读取课表，请稍后重试' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }
}
