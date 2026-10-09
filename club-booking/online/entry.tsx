import { createRoot } from 'react-dom/client';
import Home from '../app/page';
import {subscribeUpdates} from './push';

declare const __BOOKING_API_BASE__: string;
declare const __BOOKING_PUSH_ENABLED__: boolean;
window.__BOOKING_API_BASE__ = __BOOKING_API_BASE__;
createRoot(document.getElementById('root')!).render(<Home subscribeUpdates={__BOOKING_PUSH_ENABLED__?subscribeUpdates:undefined}/>);
