import { error, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types.js';
import {
	getEventById,
	addFamilyToEvent,
	removeFamilyFromEvent
}                       from '$lib/server/supabase/services/events.service.js';
import { getFamilies }  from '$lib/server/supabase/services/families.service.js';
import type { Family }  from '$lib/types/index.js';


export const load: PageServerLoad = async ( { params, url, depends } ) => {
	depends( 'app:event' );

	const event = await getEventById( params.id );

	if ( !event ) {
		throw error( 404, 'Evento no encontrado' );
	}

	const search   = url.searchParams.get( 'search' ) || '';
	const page     = Number( url.searchParams.get( 'page' ) || '1' );
	const pageSize = Number( url.searchParams.get( 'pageSize' ) || '12' );

	try {
		const { data: allFamilies } = await getFamilies( {
			search,
			pageSize : 10000
		} );

		const associatedFamilyIds = new Set( ( event.family_events || [] ).map( ( fe: any ) => fe.family_id ) );
		const availableFamilies   = allFamilies.filter( ( f: Family ) => !associatedFamilyIds.has( f.id ) );

		const count = availableFamilies.length;
		const from  = ( page - 1 ) * pageSize;
		const to    = from + pageSize;
		const paginatedFamilies = availableFamilies.slice( from, to );

		return {
			event,
			families      : paginatedFamilies,
			familiesCount : count
		};
	} catch ( err: any ) {
		return {
			event,
			families      : [],
			familiesCount : 0,
			error         : err.message
		};
	}
};


export const actions: Actions = {
	addFamily: async ( { request, params } ) => {
		const formData = await request.formData();
		const familyId = formData.get( 'familyId' ) as string;

		if ( !familyId ) {
			return fail( 400, { error: 'Falta el ID de la familia' } );
		}

		try {
			await addFamilyToEvent( params.id, familyId );
			return { success: true };
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	},

	removeFamily: async ( { request } ) => {
		const formData      = await request.formData();
		const familyEventId = formData.get( 'familyEventId' ) as string;

		if ( !familyEventId ) {
			return fail( 400, { error: 'Falta el ID de la asociación' } );
		}

		try {
			await removeFamilyFromEvent( familyEventId );
			return { success: true };
		} catch ( err: any ) {
			return fail( 400, { error: err.message } );
		}
	}
};
