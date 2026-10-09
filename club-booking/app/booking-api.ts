declare global {
  interface Window {
    __BOOKING_API_BASE__?: string;
  }
}

export function bookingApiUrl(resource = 'bookings') {
  const base = typeof window === 'undefined' ? '' : window.__BOOKING_API_BASE__ || '';
  return `${base}/api/${resource}`;
}

// uniCloud may briefly route a newly deployed function to a gateway that has not
// received its URL mapping. Only retry this explicit pre-execution rejection;
// never retry an ambiguous network failure or a response from the application.
export async function bookingApiFetch(resource = 'bookings', init: RequestInit = {}) {
  for(let attempt=0;;attempt++){
    const response=await fetch(bookingApiUrl(resource),init);
    if(response.status!==404 || attempt>=2)return response;
    const body=await response.clone().json().catch(()=>null) as {error?: {code?: string; message?: string}} | null;
    if(body?.error?.code!=='InternalBizError' || typeof body.error.message!=='string' || !body.error.message.startsWith('no_matching_function_for_path '))return response;
    await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
  }
}
