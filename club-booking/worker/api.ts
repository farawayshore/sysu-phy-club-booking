import * as bookings from '../app/api/bookings/route';
import * as curriculum from '../app/api/curriculum/route';
import { routeBookingRequest } from './router';

export default {
  fetch(request: Request, env: Cloudflare.Env) {
    const config = env as Cloudflare.Env & { BOOKING_MAINTENANCE?: string; UPSTREAM_API_BASE?: string };
    const path = new URL(request.url).pathname;
    if(config.UPSTREAM_API_BASE && path.startsWith('/api/'))return fetch(new Request(config.UPSTREAM_API_BASE+path+new URL(request.url).search,request));
    if(config.BOOKING_MAINTENANCE==='true' && ['POST','DELETE','PUT','PATCH'].includes(request.method))return Response.json({error:'正在迁移数据，请稍后刷新再试'},{status:503,headers:{'Access-Control-Allow-Origin':'https://farawayshore.github.io','Cache-Control':'no-store'}});
    return routeBookingRequest(request, env, bookings, curriculum.GET);
  },
};
