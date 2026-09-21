import { fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types.js';
import { getEvents, deleteEvent }       from '$lib/server/supabase/services/events.service.js';
import type { EventStatus }             from '$lib/types/index.js';
import { auth }                         from '$lib/auth/auth.js';
import { getUserRole }                  from '$lib/server/supabase/services/users.service.js';


export const load: PageServerLoad = async ( { url, request, depends } ) => {
	depends( 'app:events' );

	const session = await auth.api.getSession( { headers: request.headers } );
	const role    = await getUserRole( session?.user.email ?? '' );

	const search       = url.searchParams.get( 'search' ) || '';
	const date         = url.searchParams.get( 'date' ) || '';
	const status       = ( url.searchParams.get( 'status' ) || 'ALL' ) as 'ALL' | EventStatus;
	const verification = ( url.searchParams.get( 'verification' ) || 'ALL' ) as 'ALL' | 'TRUE' | 'FALSE';
	const minors       = ( url.searchParams.get( 'minors' ) || 'ALL' ) as 'ALL' | 'TRUE' | 'FALSE';
	const page         = Number( url.searchParams.get( 'page' ) || '1' );
	const pageSize     = Number( url.searchParams.get( 'pageSize' ) || '12' );

	try {
		const { data: events, count } = await getEvents( {
			search,
			date,
			status,
			verification,
			minors,
			page,
			pageSize
		});

		return {
			events,
			count,
			isSuperAdmin : role === 'SUPER_ADMIN'
		};
	} catch ( err: any ) {
		return {
			events       : [],
			count        : 0,
			isSuperAdmin : role === 'SUPER_ADMIN',
			error        : err.message
		};
	}
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
