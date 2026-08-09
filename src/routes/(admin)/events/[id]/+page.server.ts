import { error } from '@sveltejs/kit';

import type { PageServerLoad }  from './$types.js';
import { getEventById }         from '$lib/server/supabase/services/events.service.js';


export const load: PageServerLoad = async ( { params } ) => {
	const event = await getEventById( params.id );

	if ( !event ) {
		throw error( 404, 'Evento no encontrado' );
	}

	return {
		event
	};
};
