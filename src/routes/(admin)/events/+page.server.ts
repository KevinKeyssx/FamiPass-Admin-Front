import { fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types.js';
import { getEvents, deleteEvent }       from '$lib/server/supabase/services/events.service.js';


export const load: PageServerLoad = async () => {
	const events = await getEvents();

	return {
		events
	};
};

export const actions: Actions = {
	delete: async ( { request } ) => {
		const formData = await request.formData();
		const id       = formData.get( 'id' ) as string;

		if ( !id ) {
			return fail( 400, { error: 'Falta el ID del evento' } );
		}

		try {
			await deleteEvent( id );
			return { success: true };
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	}
};
