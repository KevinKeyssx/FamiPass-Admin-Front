import { error, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types.js';
import {
	getEventById,
	addFamiliesToEvent,
	removeFamilyFromEvent
}                                       from '$lib/server/supabase/services/events.service.js';
import { getAllFamiliesLookup }         from '$lib/server/supabase/services/families.service.js';
import { isEventExpired }               from '$lib/utils/date.js';
import { auth }                         from '$lib/auth/auth.js';
import { getUserRole }                  from '$lib/server/supabase/services/users.service.js';


export const load : PageServerLoad = async ( { params, request, depends } ) => {
	depends( 'app:event' );

	const session = await auth.api.getSession( { headers : request.headers } );
	const role    = await getUserRole( session?.user.email ?? '' );

	const event = await getEventById( params.id );

	if ( !event ) {
		throw error( 404, 'Evento no encontrado' );
	}

	try {
		const allFamilies         = await getAllFamiliesLookup();
		const associatedFamilyIds = new Set( ( event.family_events || [] ).map( ( fe : any ) => fe.family_id ) );
		const availableFamilies   = allFamilies.filter( ( f ) => !associatedFamilyIds.has( f.id ) );

		return {
			event,
			availableFamilies,
			isSuperAdmin : role === 'SUPER_ADMIN'
		};
	} catch ( err : any ) {
		return {
			event,
			availableFamilies : [],
			isSuperAdmin      : role === 'SUPER_ADMIN',
			error             : err.message
		};
	}
};

export const actions : Actions = {
	addFamily : async ( { request, params } ) => {
		const event = await getEventById( params.id );

		if ( !event ) {
			return fail( 404, { error : 'Evento no encontrado' } );
		}

		if ( event.expires_at && isEventExpired( event.expires_at ) ) {
			return fail( 400, { error : 'El evento ha expirado y no se pueden asociar familias.' } );
		}

		const formData  = await request.formData();
		const familyIds = formData.getAll( 'familyIds' ).map( String ).filter( Boolean );
		const singleId  = formData.get( 'familyId' ) as string;

		if ( singleId && !familyIds.includes( singleId ) ) {
			familyIds.push( singleId );
		}

		if ( familyIds.length === 0 ) {
			return fail( 400, { error : 'Por favor selecciona al menos una familia.' } );
		}

		try {
			await addFamiliesToEvent( params.id, familyIds );

			return {
				success : true,
				count   : familyIds.length
			};
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	},

	removeFamily : async ( { request, params } ) => {
		const event = await getEventById( params.id );

		if ( !event ) {
			return fail( 404, { error : 'Evento no encontrado' } );
		}

		if ( event.expires_at && isEventExpired( event.expires_at ) ) {
			return fail( 400, { error : 'El evento ha expirado y no se pueden desasociar familias.' } );
		}

		const formData      = await request.formData();
		const familyEventId = formData.get( 'familyEventId' ) as string;

		if ( !familyEventId ) {
			return fail( 400, { error : 'Falta el ID de la asociación' } );
		}

		try {
			await removeFamilyFromEvent( familyEventId );

			return { success : true };
		} catch ( err : any ) {
			return fail( 400, { error : err.message } );
		}
	}
};
