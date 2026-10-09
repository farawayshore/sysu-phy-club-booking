import { allowedOrigin } from '../app/request-origin';

type Config = { ALLOWED_ORIGINS?: string; FRONTEND_URL?: string };
type Handlers = {
  GET: () => Promise<Response>;
  POST: (request: Request) => Promise<Response>;
  DELETE: (request: Request) => Promise<Response>;
};
const methods = ['GET', 'POST', 'DELETE'];
const json = (data: unknown, status: number) => Response.json(data, {
  status, headers: { 'Cache-Control': 'no-store' },
});

export async function routeBookingRequest(request: Request, config: Config, handlers: Handlers, readCurriculum?: () => Promise<Response>) {
  const path = new URL(request.url).pathname;
  if (path === '/' && config.FRONTEND_URL) return Response.redirect(config.FRONTEND_URL, 302);
  const isCurriculum = path === '/api/curriculum' && !!readCurriculum;
  if (path !== '/api/bookings' && !isCurriculum) return json({ error: '接口不存在' }, 404);
  const permittedMethods = isCurriculum ? ['GET'] : methods;

  const origin = request.headers.get('origin');
  const permitted = allowedOrigin(request, config.ALLOWED_ORIGINS);
  if ((origin || request.method !== 'GET') && !permitted) {
    return json({ error: '请求来源无效' }, 403);
  }
  const withCors = (response: Response) => {
    const headers = new Headers(response.headers);
    headers.append('Vary', 'Origin');
    if (origin && permitted) headers.set('Access-Control-Allow-Origin', origin);
    return new Response(response.body, { status: response.status, headers });
  };

  if (request.method === 'OPTIONS') {
    const method = request.headers.get('access-control-request-method') || '';
    const requestedHeaders = (request.headers.get('access-control-request-headers') || '')
      .split(',').map(header => header.trim().toLowerCase()).filter(Boolean);
    if (!permittedMethods.includes(method) || requestedHeaders.some(header => header !== 'content-type')) {
      return withCors(json({ error: '不支持的跨域请求' }, 403));
    }
    return withCors(new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Methods': permittedMethods.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      'Vary': 'Access-Control-Request-Method, Access-Control-Request-Headers',
    } }));
  }
  try {
    if (isCurriculum) return withCors(request.method === 'GET'
      ? await readCurriculum!() : json({ error: '不支持的操作' }, 405));
    if (request.method === 'GET') return withCors(await handlers.GET());
    if (request.method === 'POST') return withCors(await handlers.POST(request));
    if (request.method === 'DELETE') return withCors(await handlers.DELETE(request));
    return withCors(json({ error: '不支持的操作' }, 405));
  } catch {
    return withCors(json({ error: '服务暂时不可用，请稍后重试' }, 503));
  }
}
