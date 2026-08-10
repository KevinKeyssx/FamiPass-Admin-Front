import type { PageServerLoad } from './$types.js';

import { getEvents } from '$lib/server/supabase/services/events.service.js';

export const load: PageServerLoad = async () => {
	const result = await getEvents({ pageSize: 1000 });

	return { events: result.data };
};
