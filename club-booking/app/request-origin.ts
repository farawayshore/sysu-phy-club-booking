export function allowedOrigin(request: Request, configured = '') {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  return origin === new URL(request.url).origin ||
    configured.split(',').map(value => value.trim()).filter(Boolean).includes(origin);
}
