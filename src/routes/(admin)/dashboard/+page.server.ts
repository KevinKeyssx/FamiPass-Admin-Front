import type { PageServerLoad } from './$types.js';

import { getEvents } from '$lib/server/supabase/services/events.service.js';


export const load: PageServerLoad = async () => {
	const events = await getEvents();

	return { events };
};
