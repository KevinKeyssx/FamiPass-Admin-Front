import { auth } from '$lib/auth/auth.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler    = ( event ) => auth.handler( event.request );
export const POST: RequestHandler   = ( event ) => auth.handler( event.request );
export const DELETE: RequestHandler = ( event ) => auth.handler( event.request );
